
import os
import json
import google.generativeai as genai
from typing import List, Dict

class LLMReranker:
    def __init__(self):
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        load_dotenv(dotenv_path=env_path)
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash-lite")
            self.active = True
        else:
            self.active = False


    async def rerank(self, jd_text: str, candidates: List[Dict]) -> List[Dict]:
        """Re-rank the top 10 candidates based on JD requirements."""
        if not self.active or not candidates:
            for c in candidates: c["llm_rerank_score"] = 0
            return candidates

        candidate_summaries = "\n".join([
            f"ID: {c.get('candidate_id', 'N/A')}, Name: {c.get('name', 'Unknown')}, Graph Score: {float(c.get('compatibility_score', 0)):.1f}%, "
            f"Key Skills: {', '.join([s.get('label', 'Skill') for s in c.get('skill_nodes', [])[:8]])}"
            for c in candidates[:10]
        ])

        prompt = f"""
        You are an expert technical recruiter. Re-rank these top 10 candidates based on alignment with the JD.
        
        Job Description: {jd_text[:1500]}
        
        Candidates:
        {candidate_summaries}
        
        Return ONLY valid JSON: [{{"id": "...", "llm_rank": 1, "reasoning": "..."}}, ...]
        """
        
        log_file = os.path.join(os.path.dirname(__file__), "logs", "ai_pipeline.log")
        
        try:
            from datetime import datetime
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n--- [{datetime.now().isoformat()}] RERANK PROMPT ---\n{prompt[:500]}...\n")

            print("[LLM] Calling Gemini model:", self.model.model_name)
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] RERANK RESPONSE ---\n{text}\n")

            start = text.find('[')
            end = text.rfind(']') + 1
            if start >= 0 and end > start:
                rankings = json.loads(text[start:end])
                
                rank_map = {r["id"]: r for r in rankings}
                for c in candidates:
                    if c["candidate_id"] in rank_map:
                        rank = rank_map[c["candidate_id"]].get("llm_rank", 10)
                        c["llm_rank"] = rank
                        c["llm_reasoning"] = rank_map[c["candidate_id"]].get("reasoning", "")
                        # Score: Rank 1 = 100, Rank 2 = 90, ..., Rank 10 = 10
                        c["llm_rerank_score"] = max(0, 110 - (rank * 10))
                    else:
                        c["llm_rerank_score"] = 0
            
            return sorted(candidates, key=lambda x: x.get("llm_rank", 99))
        except Exception as e:
            error_str = str(e)
            print(f"LLM Rerank failed: {error_str}")
            for c in candidates: c["llm_rerank_score"] = 0
            return candidates


