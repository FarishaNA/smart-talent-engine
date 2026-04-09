"""Smart Talent Engine — Three-pattern hidden gem detection.

Hidden gem detection only runs on candidates scoring 40-70%.
Not on clear matches (>70%) or clear mismatches (<40%).

Pattern A (terminology_mismatch): score >= 55 AND inferred_matches >= 2
Pattern B (hierarchy_mismatch): candidate has domain nodes but not leaf nodes
Pattern C (context_mismatch): depth=lead/contribute but context=academic/personal
"""

from alias_matcher import load_graph


def detect_hidden_gem(
    compatibility_score: float,
    direct_matches: list[dict],
    inferred_matches: list[dict],
    gaps: list[dict],
    candidate_skill_nodes: list[dict],
    per_requirement: list[dict],
) -> tuple[bool, str | None, str | None]:
    """
    Detect if a candidate is a hidden gem.
    
    Returns:
        (hidden_gem_flag, hidden_gem_type, hidden_gem_explanation)
    """
    # Only analyse candidates in the 40-70% range
    if compatibility_score < 40 or compatibility_score > 70:
        return False, None, None
    
    # Try each pattern in order of significance
    
    # Pattern A: Terminology Mismatch
    result = _check_terminology_mismatch(compatibility_score, inferred_matches)
    if result[0]:
        return result
    
    # Pattern B: Hierarchy Mismatch
    result = _check_hierarchy_mismatch(candidate_skill_nodes, gaps)
    if result[0]:
        return result
    
    # Pattern C: Context Mismatch
    result = _check_context_mismatch(candidate_skill_nodes, per_requirement)
    if result[0]:
        return result
    
    return False, None, None


def _check_terminology_mismatch(
    score: float,
    inferred_matches: list[dict],
) -> tuple[bool, str | None, str | None]:
    """
    Pattern A: Candidate scores >= 55 AND has >= 2 inferred matches.
    Their skills are real — they just wrote them differently.
    """
    if score >= 55 and len(inferred_matches) >= 2:
        # Build explanation from inferred matches
        examples = []
        for im in inferred_matches[:3]:
            via = im.get("matched_via", "alias")
            label = im.get("label", "skill")
            examples.append(f"'{via}' matched '{label}'")
        
        example_text = "; ".join(examples)
        explanation = (
            f"Candidate uses non-standard terminology that matches via graph inference. "
            f"{example_text}. "
            f"Score of {score:.0f}% is likely understated — recommend manual review."
        )
        return True, "terminology_mismatch", explanation
    
    return False, None, None


def _check_hierarchy_mismatch(
    candidate_skill_nodes: list[dict],
    gaps: list[dict],
) -> tuple[bool, str | None, str | None]:
    """
    Pattern B: Candidate has domain-level skills but not specific leaf nodes.
    e.g., has ML/AI domain skills but didn't name PyTorch explicitly.
    """
    graph = load_graph()
    
    # Build domain → node mapping
    node_domains = {}
    for node in graph["nodes"]:
        node_domains[node["node_id"]] = node["domain"]
    
    candidate_domains = set()
    for sn in candidate_skill_nodes:
        node_id = sn.get("node_id", "")
        if node_id in node_domains:
            candidate_domains.add(node_domains[node_id])
    
    # Check if any gap is in a domain the candidate has coverage in
    domain_gaps = []
    for gap in gaps:
        gap_node_id = gap.get("node_id", "")
        if gap_node_id in node_domains:
            gap_domain = node_domains[gap_node_id]
            if gap_domain in candidate_domains:
                domain_gaps.append((gap.get("label", gap_node_id), gap_domain))
    
    if len(domain_gaps) >= 1:
        gap_examples = [f"'{g[0]}' ({g[1]})" for g in domain_gaps[:3]]
        gap_text = ", ".join(gap_examples)
        domain_text = ", ".join(set(g[1] for g in domain_gaps[:3]))
        
        explanation = (
            f"Candidate demonstrates {domain_text} domain expertise without naming "
            f"{gap_text} explicitly. Likely transferable skill — verify during interview."
        )
        return True, "hierarchy_mismatch", explanation
    
    return False, None, None


def _check_context_mismatch(
    candidate_skill_nodes: list[dict],
    per_requirement: list[dict],
) -> tuple[bool, str | None, str | None]:
    """
    Pattern C: Strong depth signals (lead/contribute) but only in
    academic/personal context. Possible recent grad with genuine capability.
    """
    strong_depth_in_non_pro = []
    
    for sn in candidate_skill_nodes:
        depth = sn.get("depth", "mention")
        context = sn.get("context", "professional")
        
        if depth in ("lead", "contribute") and context in ("academic", "personal"):
            strong_depth_in_non_pro.append({
                "node_id": sn.get("node_id"),
                "label": sn.get("label", sn.get("node_id", "")),
                "depth": depth,
                "context": context,
            })
    
    if len(strong_depth_in_non_pro) >= 2:
        examples = [f"'{s['label']}' ({s['depth']} in {s['context']})" 
                     for s in strong_depth_in_non_pro[:3]]
        example_text = ", ".join(examples)
        
        explanation = (
            f"Strong capability signals in non-professional context: {example_text}. "
            f"Depth of work suggests genuine expertise beyond typical coursework — "
            f"possible recent graduate with real capability."
        )
        return True, "context_mismatch", explanation
    
    return False, None, None
