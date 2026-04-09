"""Smart Talent Engine — Template-based justification generator.

Generates plain English explanations from match results.
Optional: Gemini Flash call for top 5 if API key present.
Template justification is the default — works with zero API keys.
"""

import os
from typing import Optional


def generate_justification(
    name: str,
    compatibility_score: float,
    direct_matches: list[dict],
    inferred_matches: list[dict],
    gaps: list[dict],
    hidden_gem_flag: bool,
    hidden_gem_type: Optional[str],
    hidden_gem_explanation: Optional[str],
    behavioural_signals: list[str],
    gap_analysis: dict,
) -> str:
    """
    Generate a template-based plain English justification for a candidate's score.
    """
    parts = []
    
    # Opening statement
    if compatibility_score >= 80:
        parts.append(f"{name} is a strong match for this role with a compatibility score of {compatibility_score:.0f}%.")
    elif compatibility_score >= 60:
        parts.append(f"{name} shows solid alignment with this role at {compatibility_score:.0f}% compatibility.")
    elif compatibility_score >= 40:
        parts.append(f"{name} has partial alignment with this role at {compatibility_score:.0f}% compatibility.")
    else:
        parts.append(f"{name} shows limited alignment with this role at {compatibility_score:.0f}% compatibility.")
    
    # Direct matches
    if direct_matches:
        dm_labels = [m.get("label", m.get("node_id", "")) for m in direct_matches]
        if len(dm_labels) <= 3:
            parts.append(f"Direct skill matches: {', '.join(dm_labels)}.")
        else:
            parts.append(
                f"Direct skill matches include {', '.join(dm_labels[:3])}, "
                f"and {len(dm_labels) - 3} more."
            )
    
    # Inferred matches
    if inferred_matches:
        inferred_details = []
        for im in inferred_matches[:3]:
            via = im.get("matched_via", "related skill")
            label = im.get("label", "")
            inferred_details.append(f"{label} (via {via})")
        parts.append(f"Inferred matches: {', '.join(inferred_details)}.")
    
    # Gaps
    if gaps:
        gap_labels = [g.get("label", g.get("node_id", "")) for g in gaps]
        if len(gap_labels) <= 3:
            parts.append(f"Gaps identified: {', '.join(gap_labels)}.")
        else:
            parts.append(
                f"Gaps identified: {', '.join(gap_labels[:3])}, "
                f"and {len(gap_labels) - 3} more."
            )
    
    # Behavioural signals
    if behavioural_signals:
        parts.append(f"Behavioural signals detected: {', '.join(behavioural_signals)}.")
    
    # Hidden gem note
    if hidden_gem_flag and hidden_gem_explanation:
        parts.append(f"⚡ Hidden Gem ({hidden_gem_type}): {hidden_gem_explanation}")
    
    return " ".join(parts)


async def generate_llm_justification(
    name: str,
    compatibility_score: float,
    direct_matches: list[dict],
    inferred_matches: list[dict],
    gaps: list[dict],
    job_title: str,
) -> Optional[str]:
    """
    Optional: Generate a 2-sentence justification using Gemini Flash.
    Returns None if API key not present or call fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        dm_text = ", ".join(m.get("label", "") for m in direct_matches[:5])
        im_text = ", ".join(m.get("label", "") for m in inferred_matches[:3])
        gap_text = ", ".join(g.get("label", "") for g in gaps[:3])
        
        prompt = (
            f"Write exactly 2 sentences justifying why {name} "
            f"(compatibility score: {compatibility_score:.0f}%) "
            f"should or should not be considered for the '{job_title}' role. "
            f"Direct skill matches: {dm_text}. "
            f"Inferred matches: {im_text}. "
            f"Gaps: {gap_text}. "
            f"Be specific and professional. No filler words."
        )
        
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception:
        return None


def generate_comparison_summary(
    candidates: list[dict],
    per_req_data: list[list[dict]],
) -> str:
    """
    Generate a template-based comparison summary for 2-3 candidates.
    """
    if len(candidates) < 2:
        return "Need at least 2 candidates to compare."
    
    names = [c.get("name", "Unknown") for c in candidates]
    scores = [c.get("compatibility_score", 0) for c in candidates]
    
    # Find strengths per candidate
    strengths = []
    for i, candidate in enumerate(candidates):
        strong = candidate.get("gap_analysis", {}).get("strong_match", [])
        strengths.append(strong)
    
    parts = []
    
    # Score comparison
    best_idx = scores.index(max(scores))
    parts.append(
        f"{names[best_idx]} leads with {scores[best_idx]:.0f}% compatibility."
    )
    
    # Strength differences
    for i, (name, strong) in enumerate(zip(names, strengths)):
        if strong:
            area = ", ".join(strong[:3])
            parts.append(f"{name} is strongest in {area}.")
    
    # Find differentiator (requirement with biggest score spread)
    if per_req_data and len(per_req_data) >= 2:
        max_diff = 0
        diff_req = None
        for j in range(len(per_req_data[0])):
            req_scores = []
            for i in range(len(per_req_data)):
                if j < len(per_req_data[i]):
                    req_scores.append(per_req_data[i][j].get("weighted_score", 0))
            if len(req_scores) >= 2:
                diff = max(req_scores) - min(req_scores)
                if diff > max_diff:
                    max_diff = diff
                    diff_req = per_req_data[0][j].get("requirement_label", "")
        
        if diff_req:
            parts.append(f"Biggest differentiator: {diff_req}.")
    
    # Recommendation
    parts.append(
        f"{names[best_idx]} recommended for this role based on overall must-have coverage."
    )
    
    return " ".join(parts)


def generate_decision_trace(
    candidate_name: str,
    score: float,
    per_requirement: list,
    trajectory: dict,
    hiring_profile: dict,
    stage1_similarity: float = 0.0,
    llm_reranked: bool = False
) -> str:
    """
    Generate step-by-step plain English decision trace.
    This is NOT LLM-generated — it is deterministic template logic.
    Shows exactly how every number was produced.
    """
    lines = [
        f"=== Decision Trace: {candidate_name} ===",
        f"Final Score: {score:.1f}%",
        f"Hiring Profile: {hiring_profile.get('label', 'Unknown')}",
        f"Semantic Similarity (Stage 1): {stage1_similarity:.3f}",
        f"LLM Re-ranked: {'Yes' if llm_reranked else 'No — using graph score order'}",
        "",
        "--- Per-Requirement Breakdown ---"
    ]

    for req in per_requirement:
        req_text = (req.get("req_text") or req.get("requirement", "Unknown"))[:45]
        match_type = req.get("match_type", "missing")
        req_score = round(req.get("best_score", req.get("score", 0.0)), 3)
        weighted = round(req.get("weighted_score", 0.0), 3)
        priority = req.get("priority", "nice_to_have")
        weight = "1.0" if priority == "must_have" else "0.4"

        if match_type == "direct":
            lines.append(
                f"  ✅ {req_text}\n"
                f"     Priority: {priority} (weight {weight})\n"
                f"     Match: DIRECT — skill found in resume\n"
                f"     Score: {req_score:.2f} → weighted {weighted:.3f}"
            )
        elif match_type == "inferred":
            via = req.get("via", "unknown edge")
            edge_weight = round(req.get("inference_weight", req_score), 2)
            lines.append(
                f"  🔶 {req_text}\n"
                f"     Priority: {priority} (weight {weight})\n"
                f"     Match: INFERRED via '{via}' (edge weight {edge_weight})\n"
                f"     Score: {req_score:.2f} → weighted {weighted:.3f}"
            )
        else:
            gap_type = req.get("gap_type", "hard_gap")
            bridge = req.get("bridge_from")
            if gap_type == "bridgeable" and bridge:
                lines.append(
                    f"  📚 {req_text}\n"
                    f"     Priority: {priority} (weight {weight})\n"
                    f"     Match: BRIDGEABLE — candidate has '{bridge}' which leads to this\n"
                    f"     Score: 0.000 → weighted 0.000 (not counted, but learnable)"
                )
            else:
                lines.append(
                    f"  ❌ {req_text}\n"
                    f"     Priority: {priority} (weight {weight})\n"
                    f"     Match: MISSING — no direct or inferred match found\n"
                    f"     Score: 0.000 → weighted 0.000"
                )

    lines.extend([
        "",
        "--- Trajectory ---",
        trajectory.get("label", "Trajectory: Unknown"),
        f"Momentum score: {trajectory.get('momentum', 0.5):.3f}",
        "",
        "--- Recommendation ---",
        hiring_profile.get("recommendation", "No recommendation available")
    ])

    return "\n".join(lines)
