
def classify(
    score: float,
    confidence: str,
    trajectory: dict,
    hidden_gem_flag: bool,
    keyword_stuffing_flag: bool,
    must_have_gaps: int,
    total_requirements: int
) -> dict:
    """
    Final classification of a candidate for recruitment decision support.
    """
    # 1. Reject if stuffing is egregious
    if keyword_stuffing_flag and score < 40:
        return {
            "label": "Low Signal / Padding Detected",
            "badge_class": "bg-red-500 text-white",
            "recommendation": "Reject: High skill density with zero evidence. Probable padding."
        }

    # 2. Perfect Fit
    if score >= 85 and must_have_gaps == 0:
        return {
            "label": "Strong Match (Ready to Interview)",
            "badge_class": "bg-emerald-600 text-white",
            "recommendation": "Hire: Strong alignment with all critical must-haves."
        }

    # 3. Hidden Gem
    if hidden_gem_flag:
        return {
            "label": "Potential Hidden Gem",
            "badge_class": "bg-amber-100 text-amber-800",
            "recommendation": "Interview: High core capability despite specific stack gaps."
        }

    # 4. High Potential / Growth
    if trajectory.get("type") == "rising" and score >= 60:
        return {
            "label": "High Growth Potential",
            "badge_class": "bg-blue-600 text-white",
            "recommendation": "Consider: Candidate is rapidly acquiring relevant high-depth skills."
        }

    # 5. Partial Match
    if score >= 50:
        return {
            "label": "Partial Match",
            "badge_class": "bg-gray-200 text-gray-800",
            "recommendation": "Screen: Good alignment but missing some requirements."
        }

    # Default
    return {
        "label": "Limited Alignment",
        "badge_class": "bg-gray-100 text-gray-500",
        "recommendation": "Hold: Score or signals indicate low alignment."
    }
