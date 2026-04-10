
import os
import json
import google.generativeai as genai
from typing import List, Dict

class LLMReranker:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            self.active = True
        else:
            self.active = False

    async def rerank(self, jd_text: str, candidates: List[Dict]) -> List[Dict]:
        """Re-rank the top 10 candidates based on JD requirements."""
        if not self.active or not candidates:
            return candidates

        candidate_summaries = "\n".join([
            f"ID: {c['candidate_id']}, Name: {c['name']}, Graph Score: {c['compatibility_score']}, Skills: {', '.join([s['label'] for s in c['skill_nodes'][:10]])}"
            for c in candidates[:10]
        ])

        prompt = f"""
        You are an expert technical recruiter. Based on this Job Description, 
        rank these top 10 candidates. Provide a new rank (1-10) and a brief 
        reasoning for each.
        
        Job Description: {jd_text[:1500]}
        
        Candidates:
        {candidate_summaries}
        
        Return a JSON list: [{{"id": "...", "llm_rank": 1, "reasoning": "..."}}, ...]
        """
        
        log_file = os.path.join(os.path.dirname(__file__), "logs", "ai_pipeline.log")
        
        try:
            from datetime import datetime
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n--- [{datetime.now().isoformat()}] RERANK PROMPT ---\n{prompt[:1000]}\n")

            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] RERANK RESPONSE ---\n{text}\n")

            start = text.find('[')
            end = text.rfind(']') + 1
            if start >= 0 and end > start:
                rankings = json.loads(text[start:end])
                
                # Map back to candidates
                rank_map = {r["id"]: r for r in rankings}
                for c in candidates:
                    if c["candidate_id"] in rank_map:
                        c["llm_rank"] = rank_map[c["candidate_id"]].get("llm_rank", 99)
                        c["llm_reasoning"] = rank_map[c["candidate_id"]].get("reasoning", "")
            
            # Sort by LLM rank (prioritize 1)
            return sorted(candidates, key=lambda x: x.get("llm_rank", 99))
        except Exception as e:
            error_str = str(e)
            print(f"LLM Reranking failed: {error_str}")
            
            # Graceful 429/Quota handling
            if "429" in error_str or "quota" in error_str.lower():
                print("[LLM] Rate limit hit — skipping re-rank, using graph scores")
                return candidates
                
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] RERANK FAILED ---\n{error_str}\n")
            return candidates

