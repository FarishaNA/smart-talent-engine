
# Smart Talent Engine — Technical Architecture

This document describes the high-level architecture and processing pipeline of the Smart Talent Engine resume screening system.

## Core Philosophy
Smart Talent Engine transitions from a "keyword matching" approach to a **multi-stage AI verification pipeline**. It combines the speed of semantic search, the reasoning of Large Language Models (LLMs), and the authoritative correctness of Graph Theory.

---

## 1. Data Ingestion & Extraction (The Foundation)
The system uses a robust extraction layer to handle complex resume layouts.

- **Docling & EasyOCR**: Layout-aware parsing extracts text from two-column PDFs, tables, and images.
- **Section Detection**: Resumes are segmented into Header, Summary, Experience, Projects, and Education.
- **Experience Normalization**: Careers are measured by professional experience alone. Education years are explicitly excluded from the seniority calculation to ensure fair treatment of freshers.

## 2. The Four-Stage Ranking Pipeline
When a recruiter ranks candidates, they pass through four distinct layers:

### Stage 1: Semantic Retrieval (Recall)
- **Technology**: ChromaDB + Sentence Transformers (`all-MiniLM-L6-v2`).
- **Goal**: Rapidly narrow down the pool (e.g., top 30) based on conceptual similarity between the JD and the resume.
- **Benefit**: Captures candidates who use different terminology but have the right background.

### Stage 2: LLM Structured Extraction (Reasoning)
- **Technology**: Gemini 1.5 Flash.
- **Goal**: Extracts skills with granular evidence (e.g., "Used React to build X").
- **Benefit**: Provides the "Why" behind a skill match.

### Stage 3: Graph Scoring & Validation (Authority)
- **Technology**: Directed Acyclic Graph (Skill Ontology).
- **Goal**: Deterministically validate matches. If a candidate knows "Django", the graph infers they know "Python" and "Backend".
- **Formula**: `Score = Match Weight × Context Weight × Recency Weight`.
- **Special Logic**: 
  - **Fresher Uplift**: Candidates with <1yr experience receive a 1.25x score multiplier if they show strong project evidence.
  - **Context Weighting**: Professional experience is weighted higher than academic mentions.

### Stage 4: LLM Re-Ranking (Final Polish)
- **Technology**: Gemini 1.5 Flash.
- **Goal**: The LLM reviews the top 10 candidates in detail, considering nuances like "Trajectory" and "Potential" to refine the final sort order.

## 3. Explainability & Trust
Every score is backed by a **Decision Trace**.

- **Deterministic Audit**: The trace shows exactly which nodes in the skill graph were triggered.
- **Hiring Profile**: Candidates are classified (Rising Star, Senior Pro, etc.) based on their experience trajectory and score.
- **Skill Verification**: An authenticity score is computed by matching claimed skills against bullet points in the raw text.

## 4. Technology Stack
- **Backend**: FastAPI (Python 3.10+)
- **Database**: SQLite (Async)
- **Vector Store**: ChromaDB (Local)
- **Frontend**: React (Vite) + Vanilla CSS
- **AI Models**: Google Gemini 1.5 Flash, Sentence Transformers
