
import os
import json
import google.generativeai as genai
from typing import List, Dict, Optional

class LLMExtractor:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            self.active = True
        else:
            self.active = False

    async def extract_structured_skills(self, resume_text: str) -> Dict:
        """Use LLM to extract skills with context and verification signals."""
        if not self.active:
            return {}

        prompt = f"""
        Extract technical skills from this resume. For each skill, identify if it's 
        demonstrated in a 'work' context or just 'mentioned' in a list.
        Provide the output in valid JSON format:
        {{
            "skills": [
                {{"skill": "Python", "context": "work", "evidence": "Used in project X to build Y"}},
                {{"skill": "Docker", "context": "mention", "evidence": null}}
            ],
            "years_of_experience": 5,
            "brief_summary": "..."
        }}
        Resume: {resume_text[:4000]}
        """
        
        log_file = os.path.join(os.path.dirname(__file__), "logs", "ai_pipeline.log")
        
        try:
            from datetime import datetime
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\n--- [{datetime.now().isoformat()}] EXTRACTION PROMPT ---\n{prompt[:500]}...\n")

            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] EXTRACTION RESPONSE ---\n{text}\n")

            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
            return {"skills": [], "llm_used": False}
        except Exception as e:
            error_str = str(e)
            print(f"LLM Extraction failed: {error_str}")
            
            # Graceful 429/Quota handling
            if "429" in error_str or "quota" in error_str.lower():
                print("[LLM] Rate limit hit — skipping LLM, using graph scores only")
                return {"skills": [], "llm_used": False, "error": "rate_limit"}
                
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] EXTRACTION FAILED ---\n{error_str}\n")
            return {"skills": [], "llm_used": False, "error": error_str}
