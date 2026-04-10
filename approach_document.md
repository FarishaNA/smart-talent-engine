# Design Document: Smart Talent Engine

## 1. Project Overview
Smart Talent Engine is an AI-augmented recruitment platform that transitions from traditional keyword matching to a multi-stage verification pipeline. It leverages Semantic Search, Graph-based Ontology, and LLM reasoning to identify top-tier talent with extreme precision and transparency.

---

## 2. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Vanilla CSS | Modern, performant UI with a custom "Zen" design system focusing on focus and clarity. |
| **Backend** | FastAPI (Python 3.10+) | High-performance async API framework; ideal for orchestrating AI pipelines. |
| **AI Orchestration** | Google Gemini 1.5 Flash | Chosen for its high context window and reasoning speed. More cost-effective than Pro for high-volume extraction. |
| **Vector Database** | ChromaDB (Local) | Low-latency, local-first retrieval. Avoids cloud overhead and ensures data privacy during the indexing phase. |
| **Embeddings** | Sentence-Transformers | `all-MiniLM-L6-v2` provides a balance of high semantic recall and low compute footprint. |
| **Graph Layer** | Directed Acyclic Graph (DAG) | Custom-built skill ontology to handle deterministic skill inferences (e.g., "Next.js" → "React"). |
| **Parsing** | Docling + EasyOCR | Multi-modal parsing to handle both structured PDFs and scanned image-based resumes. |

---

## 3. Engineering Trade-offs

### 3.1. Hybrid Ranking vs. Pure LLM Ranking
*   **Trade-off**: Running an LLM over every candidate in a database of 10,000 is prohibitively slow and expensive.
*   **Decision**: We use a **tiered filter**.
    1.  **ChromaDB** filters 10,000 down to the top 30 based on semantic similarity (Recall).
    2.  **Graph Scorer** validates these 30 based on deterministic skill rules (Precision).
    3.  **Gemini 1.5 Flash** re-ranks the top 10 based on "Trajectory" and "Potential" (Nuance).

### 3.2. Local Embeddings vs. API-based Embeddings
*   **Trade-off**: OpenAI/Google embeddings might offer slightly higher accuracy but at the cost of network latency and recurring API costs per embedding.
*   **Decision**: `all-MiniLM-L6-v2` is run locally. It is fast enough for resume retrieval where terminology is relatively consistent, saving ~$0.05 per candidate in production.

### 3.3. SQLite vs. PostgreSQL/NoSQL
*   **Trade-off**: PostgreSQL offers better scaling for millions of records.
*   **Decision**: SQLite (aiosqlite) was chosen for development speed and zero-config deployment. The system is designed such that metadata can be migrated to Postgres easily if needed.

---

## 4. Edge Case Handling

| Edge Case | Solution |
| :--- | :--- |
| **The "Fresher" Bias** | Candidates with <1 year of industry experience are often penalized by default scorers. We implement a **1.25x Fresher Uplift** if the extraction layer detects >100 words of high-quality project evidence. |
| **Experience Inflation** | Many systems calculate seniority by `(Current Date - Education Start Date)`. We explicitly **exclude education years** and only count Industry/Project tenure to ensure accurate seniority mapping. |
| **The "Keyword Stuffer"** | Candidates listing 50 skills in a footer without context. The **Context Weighting** system gives 1.0x to professional mentions but only 0.40x to "section-only" mentions without supporting bullet points. |
| **Niche Domain Mismatch** | A generalist might rank high for a "Frontend" role due to high similarity scores. We apply a **Critical Domain Penalty (40%)** if the JD is frontend-heavy and the candidate lacks core library matches (React/Vue). |
| **Score Compression** | Resumes naturally cluster in the 10-20% range. We use **Non-linear Expansion** (`score^0.6`) to spread candidates across the 0-100 scale, making the UI more readable for recruiters. |

---

## 5. Security & Privacy
*   **Local Processing**: Resumes are parsed and indexed locally before any data is sent to Gemini.
*   **PII Masking**: Logic is provided (optional) to mask names and contact info before LLM re-ranking to reduce algorithmic bias.
