
import os
import json
from typing import List, Dict, Optional

class LLMExtractor:
    def __init__(self):
        import google.generativeai as genai
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        load_dotenv(dotenv_path=env_path)
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            # Standard model name
            self.model = genai.GenerativeModel("gemini-2.5-flash-lite")
            self.active = True
        else:
            self.active = False


    async def extract_structured_skills(self, resume_text: str) -> Dict:
        """Use LLM to extract skills with context and verification signals."""
        if not self.active:
            return {"skills": [], "llm_used": False, "reasoning_score": 0}

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

            # Simple retry loop or direct call
            print("[LLM] Calling Gemini model:", self.model.model_name)
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] EXTRACTION RESPONSE ---\n{text}\n")

            # Robust JSON extraction
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                data = json.loads(text[start:end])
                
                # Calculate a reasoning score (0-10) for integration
                # High score if summary is meaningful and skills are found
                summary = data.get("brief_summary", "")
                skill_count = len(data.get("skills", []))
                
                reasoning_score = 0
                if skill_count > 0: reasoning_score += 4
                if len(summary) > 50: reasoning_score += 4
                if (data.get("years_of_experience") or 0) > 0: reasoning_score += 2
                
                data["reasoning_score"] = reasoning_score
                data["llm_used"] = True
                return data
                
            return {"skills": [], "llm_used": False, "reasoning_score": 0}
        except Exception as e:
            error_str = str(e)
            print(f"LLM Extraction failed: {error_str}")
            
            if "429" in error_str or "quota" in error_str.lower():
                print("[LLM] Rate limit hit — skipping LLM")
                return {"skills": [], "llm_used": False, "error": "rate_limit", "reasoning_score": 0}
                
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"--- [{datetime.now().isoformat()}] EXTRACTION FAILED ---\n{error_str}\n")
            return {"skills": [], "llm_used": False, "error": error_str, "reasoning_score": 0}

