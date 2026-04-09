
import os
import json
import google.generativeai as genai
from typing import List, Dict

class LLMReranker:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
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
        try:
            response = await self.model.generate_content_async(prompt)
            # Find JSON block
            text = response.text
            start = text.find('[')
            end = text.rfind(']') + 1
            rankings = json.loads(text[start:end])
            
            # Map back to candidates
            rank_map = {r["id"]: r for r in rankings}
            for c in candidates:
                if c["candidate_id"] in rank_map:
                    c["llm_rank"] = rank_map[c["candidate_id"]]["llm_rank"]
                    c["llm_reasoning"] = rank_map[c["candidate_id"]]["reasoning"]
            
            # Sort by LLM rank (prioritize 1)
            return sorted(candidates, key=lambda x: x.get("llm_rank", 99))
        except Exception as e:
            print(f"LLM Reranking failed: {e}")
            return candidates

