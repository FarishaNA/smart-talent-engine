"""Smart Talent Engine — Pydantic data models."""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field
import uuid


# ── Skill Graph Models ──────────────────────────────────────

class SkillNodeDef(BaseModel):
    """Definition of a node in skill_graph.json."""
    node_id: str
    label: str
    domain: str
    aliases: List[str]


class SkillEdgeDef(BaseModel):
    """Definition of an edge in skill_graph.json."""
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    type: Literal["implies", "subset_of", "related"]
    weight: float

    class Config:
        populate_by_name = True


class SkillGraph(BaseModel):
    nodes: List[SkillNodeDef]
    edges: List[SkillEdgeDef]


# ── Candidate / Resume Models ──────────────────────────────

class SkillNode(BaseModel):
    """A skill extracted from a candidate's resume."""
    node_id: str
    label: str
    domain: str
    matched_via: str  # the alias text that triggered the match
    depth: Literal["lead", "contribute", "mention"] = "mention"
    context: Literal["professional", "academic", "personal", "cert"] = "professional"
    section: str = ""


class CandidateProfile(BaseModel):
    candidate_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Unknown"
    email: Optional[str] = None
    resume_format: str = "unknown"
    parse_confidence: float = 0.0
    skill_nodes: List[SkillNode] = []
    skill_node_ids: List[str] = []
    year_ranges: List[dict] = []
    total_experience_years: int = 0
    most_recent_year: Optional[int] = None
    keyword_stuffing_flag: bool = False
    raw_text: str = ""
    sections: dict = {}
    llm_extraction_used: bool = False    # Whether LLM extraction ran on this resume
    skill_confidence: dict = {}          # node_id → confidence level mapping
    candidate_type: dict = {}            # Output from classifier.py
    skill_verification: dict = {}        # Output from extractor.py


# ── Job Description Models ──────────────────────────────────

class JDRequirement(BaseModel):
    node_id: str
    label: str
    priority: Literal["must_have", "nice_to_have"] = "must_have"
    base_weight: float = 1.0
    min_years: Optional[int] = None


class JDRequirementSet(BaseModel):
    job_id: str = ""
    requirements: List[JDRequirement] = []
    raw_text: str = ""


# ── Match / Scoring Models ──────────────────────────────────

class PerRequirementScore(BaseModel):
    requirement_node_id: str
    requirement_label: str
    priority: str
    match_type: Literal["direct", "inferred", "missing"]
    match_score: float = 0.0
    matched_via_node: Optional[str] = None
    matched_via_edge_type: Optional[str] = None
    evidence: str = ""
    weighted_score: float = 0.0
    depth_weight: float = 1.0
    context_weight: float = 1.0
    recency_weight: float = 1.0
    base_weight: float = 1.0


class GapAnalysis(BaseModel):
    strong_match: List[str] = []
    partial_match: List[str] = []
    weak_signal: List[str] = []
    missing: List[str] = []


class MatchResult(BaseModel):
    candidate_id: str
    job_id: str
    name: str = ""
    compatibility_score: float = 0.0
    confidence_level: Literal["high", "medium", "low"] = "low"
    direct_matches: List[dict] = []
    inferred_matches: List[dict] = []
    gaps: List[dict] = []
    hidden_gem_flag: bool = False
    hidden_gem_type: Optional[str] = None
    hidden_gem_explanation: Optional[str] = None
    keyword_stuffing_flag: bool = False
    gap_analysis: dict = {}
    justification: str = ""
    per_requirement: List[dict] = []
    behavioural_signals: List[str] = []
    seniority_score: float = 0.0
    stage1_similarity: float = 0.0       # Embedding cosine similarity score
    retrieval_method: str = "graph_only" # "rag_retrieved" | "graph_only" | "all_candidates"
    llm_rank: Optional[int] = None       # LLM re-ranking position
    llm_reasoning: Optional[str] = None  # LLM-generated reasoning text
    llm_reranked: bool = False           # Whether LLM re-ranking was applied
    trajectory: dict = {}                # Output from trajectory.py
    hiring_profile: dict = {}            # Output from classifier.py
    decision_trace: str = ""             # Full step-by-step reasoning trace
    llm_extraction: List[dict] = []      # Raw skills found by LLM


# ── API Request / Response Models ───────────────────────────

class JobCreate(BaseModel):
    title: str
    description: str  # JD text


class JobResponse(BaseModel):
    job_id: str
    title: str
    description: str
    resume_count: int = 0
    status: str = "created"
    top_score: Optional[float] = None
    hidden_gem_count: int = 0
    created_at: str = ""


class JobListResponse(BaseModel):
    jobs: List[JobResponse]


class ResumeStatusItem(BaseModel):
    filename: str
    status: Literal["queued", "parsing", "extracting_skills", "complete", "failed"]
    skills_found: int = 0
    error: Optional[str] = None
    candidate_id: Optional[str] = None


class BatchStatus(BaseModel):
    job_id: str
    total: int = 0
    completed: int = 0
    failed: int = 0
    in_progress: int = 0
    items: List[ResumeStatusItem] = []


class RankingResponse(BaseModel):
    job_id: str
    total_candidates: int = 0
    results: List[MatchResult] = []


class CompareRequest(BaseModel):
    candidate_ids: List[str]
    job_id: str


class CompareResponse(BaseModel):
    job_id: str
    candidates: List[MatchResult] = []
    differentiator: Optional[dict] = None
    summary: str = ""


class StatsResponse(BaseModel):
    total_resumes: int = 0
    total_jobs: int = 0
    hidden_gems_count: int = 0
    avg_processing_time_ms: float = 0.0
