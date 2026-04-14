
import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict

class VectorStore:
    def __init__(self):
        # Initialize local embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.client = chromadb.PersistentClient(path="./chroma_db")
    
    def upsert_resumes(self, job_id: str, candidates: List[Dict]):
        """Store candidate resumes in a job-specific collection."""
        collection_name = f"job_{job_id}"
        # Ensure we use cosine similarity
        collection = self.client.get_or_create_collection(
            name=collection_name, 
            metadata={"hnsw:space": "cosine"}
        )
        
        ids = [c["candidate_id"] for c in candidates]
        documents = [c["raw_text"] for c in candidates]
        metadatas = [{"name": c["name"]} for c in candidates]
        
        # Chroma handles embeddings automatically if we pass documents, 
        # but we use our specific model for consistency.
        embeddings = self.model.encode(documents).tolist()
        
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

    def query_top_candidates(self, job_id: str, jd_text: str, n_results: int = 30) -> Dict[str, float]:
        """Return IDs and similarity scores of top N candidates."""
        try:
            collection = self.client.get_collection(name=f"job_{job_id}")
            count = collection.count()
            print(f"\n[VectorStore] ── Semantic Retrieval ──────────────────────────")
            print(f"[VectorStore] Collection : job_{job_id}")
            print(f"[VectorStore] Indexed    : {count} candidates")
            print(f"[VectorStore] JD preview : {jd_text[:120].strip()!r}...")

            # Step 1: Generate query embedding
            query_embedding = self.model.encode([jd_text])
            print(f"[VectorStore] ✅ Query embedding generated — shape: {query_embedding.shape}, "
                  f"norm: {float((query_embedding**2).sum()**0.5):.4f}")

            results = collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=min(n_results, count) if count > 0 else 1
            )

            ids       = results.get("ids",       [[]])[0]
            distances = results.get("distances", [[]])[0]
            print(f"[VectorStore] Retrieved  : {len(ids)} results from ChromaDB")

            # Step 2: Convert cosine distances → similarity scores
            # ChromaDB cosine space: distance = 1 − cosine_similarity
            output: Dict[str, float] = {}
            print(f"[VectorStore] {'Candidate ID':<38}  {'Raw Dist':>9}  {'Similarity':>10}  {'Score/100':>9}")
            print(f"[VectorStore] {'-'*38}  {'-'*9}  {'-'*10}  {'-'*9}")
            for cand_id, dist in zip(ids, distances):
                similarity = max(0.0, 1.0 - float(dist))
                score_100  = round(similarity * 100, 2)
                output[cand_id] = score_100
                print(f"[VectorStore] {cand_id:<38}  {dist:>9.5f}  {similarity:>10.5f}  {score_100:>9.2f}")

            print(f"[VectorStore] ✅ Final semantic_map built — {len(output)} entries")
            print(f"[VectorStore] ──────────────────────────────────────────────────\n")
            return output

        except Exception as e:
            print(f"[VectorStore] ❌ Vector search FAILED: {type(e).__name__}: {e}")
            return {}

