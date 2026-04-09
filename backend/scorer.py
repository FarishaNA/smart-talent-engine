"""Smart Talent Engine — Weighted scoring formula + behavioural signals.

Scoring formula:
  per_req_score = match_score × base_weight × depth_weight × context_weight × recency_weight
  
Weights:
  depth:   lead=1.0, contribute=0.65, mention=0.30
  context: professional=1.0, academic=0.55, personal=0.45, cert=0.35
  recency: current=1.0, 1-2yr=0.85, 3-5yr=0.65, 5+yr=0.40

  compatibility_score = (sum of per_req weighted scores / sum of base_weights) × 100
"""

import re
from datetime import datetime

# ── Weight constants ────────────────────────────────────────

DEPTH_WEIGHTS = {
    "lead": 1.0,
    "contribute": 0.65,
    "mention": 0.30,
}

CONTEXT_WEIGHTS = {
    "professional": 1.0,
    "academic": 0.55,
    "personal": 0.45,
    "cert": 0.35,
}

CURRENT_YEAR = datetime.now().year

# ── Behavioural signal verbs ────────────────────────────────

BEHAVIOURAL_SIGNALS = {
    "led": re.compile(r"\b(?:led|leading|lead)\b", re.IGNORECASE),
    "built": re.compile(r"\b(?:built|building|build)\b", re.IGNORECASE),
    "designed": re.compile(r"\b(?:designed|designing|design)\b", re.IGNORECASE),
    "shipped": re.compile(r"\b(?:shipped|shipping|ship|delivered|delivering)\b", re.IGNORECASE),
    "scaled": re.compile(r"\b(?:scaled|scaling|scale)\b", re.IGNORECASE),
    "mentored": re.compile(r"\b(?:mentored|mentoring|mentor|coached|coaching)\b", re.IGNORECASE),
    "architected": re.compile(r"\b(?:architected|architecting|architect)\b", re.IGNORECASE),
    "automated": re.compile(r"\b(?:automated|automating|automate)\b", re.IGNORECASE),
    "optimized": re.compile(r"\b(?:optimized|optimizing|optimize|optimised)\b", re.IGNORECASE),
}


def get_recency_weight(most_recent_year: int | None) -> float:
    """Calculate recency weight based on most recent active year."""
    if most_recent_year is None:
        return 0.65  # unknown → middle weight
    
    years_ago = CURRENT_YEAR - most_recent_year
    
    if years_ago <= 0:
        return 1.0  # current
    elif years_ago <= 2:
        return 0.85  # 1-2 years ago
    elif years_ago <= 5:
        return 0.65  # 3-5 years ago
    else:
        return 0.40  # 5+ years ago


def get_depth_for_skill(skill_nodes: list[dict], node_id: str) -> str:
    """Get the depth tag for a specific skill node from candidate profile."""
    for sn in skill_nodes:
        if sn.get("node_id") == node_id:
            return sn.get("depth", "mention")
    return "mention"


def calculate_context_weight(context: str, fresher_mode: bool = False) -> float:
    """
    Weighted context based on where the skill was found.
    Uplifts project context for freshers.
    """
    weights = {
        "professional": 1.0,
        "academic": 0.55,  # Standard penalty for academic context
        "personal": 0.70,   # Projects are better than just school
        "mention": 0.40,    # Skill section only
        "cert": 0.85
    }
    
    # If candidate is a fresher, project and academic context get an uplift
    # since that's their primary way of showing skill.
    if fresher_mode:
        if context == "academic": return 0.85 # Increased from 0.55
        if context == "personal": return 0.95 # Increased from 0.70
        if context == "professional": return 1.0
        
    return weights.get(context, 0.5)


def get_context_for_skill(skill_nodes: list[dict], node_id: str) -> str:
    """Get the context tag for a specific skill node from candidate profile."""
    for sn in skill_nodes:
        if sn.get("node_id") == node_id:
            return sn.get("context", "professional")
    return "professional"


def score_candidate(
    per_requirement_results: list[dict],
    candidate_skill_nodes: list[dict],
    most_recent_year: int | None,
    is_fresher: bool = False,
    project_text: str = ""
) -> tuple[float, list[dict]]:
    """
    Apply weighted scoring formula to per-requirement match results.
    
    Returns:
        (compatibility_score, enriched_per_requirement_list)
    """
    recency_weight = get_recency_weight(most_recent_year)
    
    total_weighted_score = 0.0
    total_base_weight = 0.0
    enriched = []
    
    for req_result in per_requirement_results:
        req_node_id = req_result["requirement_node_id"]
        match_score = req_result["match_score"]
        base_weight = req_result["base_weight"]
        
        # Get depth and context from candidate's matched skill
        # For inferred matches, use the via_node's depth/context
        lookup_node = req_result.get("matched_via_node") or req_node_id
        depth = get_depth_for_skill(candidate_skill_nodes, lookup_node)
        context = get_context_for_skill(candidate_skill_nodes, lookup_node)
        
        depth_w = DEPTH_WEIGHTS.get(depth, 0.30)
        context_w = calculate_context_weight(context, fresher_mode=is_fresher)
        
        # Apply formula
        weighted_score = match_score * base_weight * depth_w * context_w * recency_weight
        
        total_weighted_score += weighted_score
        total_base_weight += base_weight
        
        enriched_result = {
            **req_result,
            "depth_weight": depth_w,
            "context_weight": context_w,
            "recency_weight": recency_weight,
            "weighted_score": round(weighted_score, 4),
        }
        enriched.append(enriched_result)
    
    # Calculate compatibility score (0-100)
    if total_base_weight > 0:
        compatibility_score = (total_weighted_score / total_base_weight) * 100
    else:
        compatibility_score = 0.0
    
    # Apply 1.2x Fresher Uplift for strong project evidence
    if is_fresher and compatibility_score > 10 and len(project_text.split()) > 100:
        compatibility_score = min(100.0, compatibility_score * 1.2)
    
    compatibility_score = round(min(100.0, max(0.0, compatibility_score)), 2)
    
    return compatibility_score, enriched


def build_gap_analysis(enriched_per_req: list[dict]) -> dict:
    """
    Classify skills into gap analysis buckets.
    
    - Strong Match (green): weighted_score >= 0.7 × base_weight
    - Partial Match (amber): weighted_score >= 0.4 × base_weight
    - Weak Signal (yellow): weighted_score > 0 but < 0.4 × base_weight
    - Missing (red): weighted_score == 0
    """
    strong = []
    partial = []
    weak = []
    missing = []
    
    for r in enriched_per_req:
        label = r["requirement_label"]
        base = r["base_weight"]
        ws = r["weighted_score"]
        
        if ws == 0:
            missing.append(label)
        elif ws >= 0.7 * base:
            strong.append(label)
        elif ws >= 0.4 * base:
            partial.append(label)
        else:
            weak.append(label)
    
    return {
        "strong_match": strong,
        "partial_match": partial,
        "weak_signal": weak,
        "missing": missing,
    }


def extract_behavioural_signals(raw_text: str) -> list[str]:
    """Extract behavioural signal verbs from resume text."""
    signals = []
    for signal_name, pattern in BEHAVIOURAL_SIGNALS.items():
        if pattern.search(raw_text):
            signals.append(signal_name)
    return signals


def calculate_seniority_score(
    total_experience: int,
    behavioural_signals: list[str],
    depth_distribution: dict[str, int],
) -> float:
    """
    Calculate a seniority score (0-1) based on:
    - Total experience years
    - Behavioural signals (leadership verbs)
    - Depth distribution (how many lead vs contribute vs mention)
    """
    # Experience component (0-0.4)
    exp_score = min(total_experience / 15.0, 1.0) * 0.4
    
    # Behavioural component (0-0.3)
    leadership_signals = {"led", "architected", "mentored", "scaled"}
    leadership_count = len(set(behavioural_signals) & leadership_signals)
    beh_score = min(leadership_count / 3.0, 1.0) * 0.3
    
    # Depth component (0-0.3)
    total_skills = sum(depth_distribution.values()) or 1
    lead_ratio = depth_distribution.get("lead", 0) / total_skills
    contribute_ratio = depth_distribution.get("contribute", 0) / total_skills
    depth_score = (lead_ratio * 1.0 + contribute_ratio * 0.5) * 0.3
    
    return round(exp_score + beh_score + depth_score, 3)


def get_confidence_level(parse_confidence: float) -> str:
    """Map parse confidence to high/medium/low."""
    if parse_confidence >= 0.8:
        return "high"
    elif parse_confidence >= 0.5:
        return "medium"
    return "low"
