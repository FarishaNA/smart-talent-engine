
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
        collection = self.client.get_or_create_collection(name=collection_name)
        
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

    def query_top_candidates(self, job_id: str, jd_text: str, n_results: int = 30) -> List[str]:
        """Return IDs of top N candidates by semantic similarity."""
        try:
            collection = self.client.get_collection(name=f"job_{job_id}")
            query_embedding = self.model.encode([jd_text]).tolist()
            
            results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(n_results, collection.count())
            )
            return results['ids'][0]
        except Exception as e:
            print(f"Vector search failed: {e}")
            return []
