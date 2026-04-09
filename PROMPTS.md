# Prompts Documentation

The Smart Talent Engine uses two structured prompts against the Gemini 1.5 Flash model.

## 1. Skill Extraction Prompt (`llm_extractor.py`)

Used to parse context out of raw resumes in Stage 2.

**System Prompt Strategy**:
- Zero-shot JSON extraction.
- Extreme hallucination guards (forced to only output from the provided canonical list).
- Provides context (Lead vs Mention) that deterministic regex struggles with.

**Prompt Template**:
```text
You are an expert technical recruiter and resume parser.
Extract ALL technical skills and tools from this resume text.

CRITICAL CONSTRAINT: You must ONLY extract skills that exactly match a label in this canonical list:
{canonical_list}

Ignore soft skills. Ignore skills not in the canonical list.
If a skill implies another (e.g. React implies JavaScript), extract BOTH if you know the implication, but ONLY use labels from the canonical list.

For each skill, determine the depth/involvement from the context:
- "lead": managed, designed, architected, or led the team using it
- "contribute": built, developed, implemented core features with it
- "mention": used lightly, maintained, or just listed in a skills section

Return ONLY valid JSON with no markdown formatting:
{{
  "skills": [
    {{
      "label": "Exact Canonical Label",
      "depth": "lead | contribute | mention"
    }}
  ]
}}

RESUME TEXT:
{raw_text}
```

## 2. Rationale Re-ranking Prompt (`reranker.py`)

Used on the Top 10 candidates in Stage 4.

**System Prompt Strategy**:
- RAG style formulation. The model is presented only with pre-evaluated, verified candidate data instead of the raw, biased resume.
- Prioritizes must-have validation.
- Forces succinct, two-sentence rationale referencing exact verified skills.

**Prompt Template**:
```text
You are a senior technical recruiter re-ranking pre-screened candidates.

JOB SUMMARY:
{jd_text}

MUST-HAVE REQUIREMENTS: {must_have_nodes}

CANDIDATES (pre-scored and validated by skill graph — all evidence is verified):
{summaries_json}

RANKING RULES:
1. Candidates with ALL must-have requirements met rank highest
2. Among equal must-have coverage, prefer higher graph_score
3. For junior roles, prefer candidates with "advancing" trajectory
4. Penalise candidates with must_have_gaps heavily
5. Inferred matches (via graph edges) are valid — do not penalise them

Return ONLY valid JSON — no explanation, no markdown:
{{
  "rankings": [
    {{
      "candidate_id": "exact id from input",
      "rank": 1,
      "reasoning": "Two sentences. Cite specific skills from the evidence above. Be factual."
    }}
  ]
}}
```
