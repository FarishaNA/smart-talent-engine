
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
            print(f"[VectorStore] Querying collection 'job_{job_id}', candidates indexed: {collection.count()}")
            query_embedding = self.model.encode([jd_text]).tolist()
            
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(n_results, collection.count())
            )
            print(f"[VectorStore] Query returned {len(results.get('ids', [[]])[0])} results")
            
            # results['distances'][0] are 1 - similarity for cosine
            # We want similarity scores normalized to 0-100
            output = {}
            if results['ids'] and results['distances']:
                for cand_id, dist in zip(results['ids'][0], results['distances'][0]):
                    similarity = max(0.0, 1.0 - float(dist))
                    output[cand_id] = round(similarity * 100, 2)
            return output
        except Exception as e:
            print(f"Vector search failed: {e}")
            return {}

