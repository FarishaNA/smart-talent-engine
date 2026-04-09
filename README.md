# Smart Talent Engine

An AI-powered technical resume screening system built with a hybrid graph + LLM architecture. Designed to eliminate ATS keyword bias, explain technical decisions clearly, and highlight "Hidden Gems".

## Features
- **Semantic Retrieval**: Filters candidates via SentenceTransformer vectors and ChromaDB nearest-neighbor lookups.
- **LLM Structured Extraction**: Utilizes Gemini 1.5 Flash to pull verified skills and identify seniority depth.  
- **Deterministic Knowledge Graph**: Acts as a guardrail. All skills extracted by LLM are verified against the canonical graph (`skill_graph.json`) to prevent hallucination. Evaluates direct and inferred (e.g., React implies JS) relationships.
- **Explainable Ranking**: Zero black-box scoring. Full AI Decision Trace generated for each candidate, validating exactly how scores were computed.
- **Growth Trajectory**: Maps domains against experience years and scores the candidate's trajectory as stable, advancing, or declining.

## Tech Stack
- **Backend**: FastAPI, ChromaDB, SentenceTransformers, Gemini Flash, Pydantic, aiosqlite
- **Frontend**: React (Vite), TailwindCSS, Recharts

## Getting Started

1. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Add your API Key:
Create a `.env` file in the `backend` folder:
```
GEMINI_API_KEY=your_gemini_api_key
```

3. Run the application:
Start Backend:
```bash
cd backend
uvicorn main:app --reload
```
Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

See `ARCHITECTURE.md` and `PROMPTS.md` for AI sprint implementation details.
