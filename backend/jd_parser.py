"""Smart Talent Engine — JD (Job Description) requirement structuring.

Parses JD text into structured requirement nodes using alias matching
and priority detection (must_have / nice_to_have).
"""

import re
from alias_matcher import match_skills_in_text

# Priority signal patterns
MUST_HAVE_SIGNALS = re.compile(
    r"\b(?:must\s+have|required|essential|mandatory|minimum|need|needs|necessary|"
    r"requires?|prerequisite|critical|key\s+requirement|must\s+possess)\b",
    re.IGNORECASE
)

NICE_TO_HAVE_SIGNALS = re.compile(
    r"\b(?:nice\s+to\s+have|preferred|plus|bonus|advantageous|desirable|"
    r"ideally|optional|good\s+to\s+have|would\s+be\s+a\s+plus|"
    r"experience\s+with.*(?:a\s+plus|bonus|preferred))\b",
    re.IGNORECASE
)

# Year requirement patterns
YEAR_REQ_PATTERN = re.compile(
    r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?",
    re.IGNORECASE
)

MIN_YEAR_PATTERN = re.compile(
    r"(?:minimum|min|at\s+least)\s+(\d+)\s*(?:years?|yrs?)",
    re.IGNORECASE
)


def parse_jd(jd_text: str) -> dict:
    """
    Parse a job description into structured requirements.
    
    Returns:
        {
            "requirements": [
                {
                    "node_id": str,
                    "label": str, 
                    "priority": "must_have" | "nice_to_have",
                    "base_weight": float,
                    "min_years": int | None
                }
            ],
            "raw_text": str
        }
    """
    # Split JD into logical segments (by line or paragraph)
    lines = jd_text.split("\n")
    
    # Track current priority context
    current_priority = "must_have"  # default
    
    # Collect all skill matches across the entire text first
    all_matches = match_skills_in_text(jd_text)
    
    # Build requirement list
    requirements = []
    seen_nodes = set()
    
    for match in all_matches:
        node_id = match["node_id"]
        if node_id in seen_nodes:
            continue
        seen_nodes.add(node_id)
        
        # Determine priority by finding which part of the JD mentions this skill
        priority = _detect_priority_for_skill(jd_text, match["matched_via"])
        
        # Detect year requirements near this skill mention
        min_years = _detect_years_near_skill(jd_text, match["matched_via"])
        
        requirements.append({
            "node_id": node_id,
            "label": match["label"],
            "priority": priority,
            "base_weight": 1.0 if priority == "must_have" else 0.4,
            "min_years": min_years,
        })
    
    return {
        "requirements": requirements,
        "raw_text": jd_text,
    }


def _detect_priority_for_skill(jd_text: str, alias: str) -> str:
    """
    Detect whether a skill mention is must_have or nice_to_have
    by checking the surrounding context (±200 chars).
    """
    # Find the skill mention position
    pattern = re.compile(re.escape(alias), re.IGNORECASE)
    match = pattern.search(jd_text)
    if not match:
        return "must_have"
    
    # Get surrounding context (200 chars before and after)
    start = max(0, match.start() - 200)
    end = min(len(jd_text), match.end() + 200)
    context = jd_text[start:end]
    
    # Check for nice_to_have signals first (they override)
    if NICE_TO_HAVE_SIGNALS.search(context):
        return "nice_to_have"
    
    # Check for must_have signals
    if MUST_HAVE_SIGNALS.search(context):
        return "must_have"
    
    # Default: if in first 60% of text → must_have, else nice_to_have
    position_ratio = match.start() / max(len(jd_text), 1)
    if position_ratio < 0.6:
        return "must_have"
    return "nice_to_have"


def _detect_years_near_skill(jd_text: str, alias: str) -> int | None:
    """
    Detect year requirements near a skill mention.
    e.g., "3+ years of Python experience" → 3
    """
    pattern = re.compile(re.escape(alias), re.IGNORECASE)
    match = pattern.search(jd_text)
    if not match:
        return None
    
    # Check surrounding context (150 chars before and after)
    start = max(0, match.start() - 150)
    end = min(len(jd_text), match.end() + 150)
    context = jd_text[start:end]
    
    # Check for explicit minimum pattern first
    min_match = MIN_YEAR_PATTERN.search(context)
    if min_match:
        return int(min_match.group(1))
    
    # Check for general year pattern
    year_match = YEAR_REQ_PATTERN.search(context)
    if year_match:
        return int(year_match.group(1))
    
    return None
