
import os
import json
import google.generativeai as genai
from typing import List, Dict, Optional

class LLMExtractor:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
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
        try:
            response = await self.model.generate_content_async(prompt)
            # Find JSON block in response
            text = response.text
            start = text.find('{')
            end = text.rfind('}') + 1
            return json.loads(text[start:end])
        except Exception as e:
            print(f"LLM Extraction failed: {e}")
            return {}
