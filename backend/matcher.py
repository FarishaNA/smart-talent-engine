"""Smart Talent Engine — Graph traversal matching engine.

For each JD requirement node:
1. Check direct match (candidate has exact node) → score 1.0
2. Traverse implies/subset_of edges → score = edge weight
3. Check related edges → partial credit at edge weight
4. No match found → gap

Maximum 2 hops to prevent false inferences.
"""

from alias_matcher import load_graph


def _build_edge_index() -> dict:
    """
    Build adjacency indices for fast traversal.
    Returns {
        "from": { node_id: [edge_dict, ...] },
        "to": { node_id: [edge_dict, ...] }
    }
    """
    graph = load_graph()
    from_idx = {}
    to_idx = {}
    for edge in graph["edges"]:
        from_idx.setdefault(edge["from"], []).append(edge)
        to_idx.setdefault(edge["to"], []).append(edge)
    return {"from": from_idx, "to": to_idx}


_edge_index_cache = None


def get_edge_index():
    global _edge_index_cache
    if _edge_index_cache is None:
        _edge_index_cache = _build_edge_index()
    return _edge_index_cache


def expand_skills_via_graph(node_ids: list[str], max_hops: int = 2) -> dict[str, float]:
    """
    Weighted Graph Expansion (Push Model):
    Expand a set of starting node IDs using get_edges_from().
    Returns {node_id: weight} where original nodes are 1.0 
    and implied nodes are (parent_weight * edge_weight).
    """
    from alias_matcher import get_edges_from
    
    # Initialize with original skills at full weight
    expanded = {nid: 1.0 for nid in node_ids}
    
    current_frontier = {nid: 1.0 for nid in node_ids}
    for _ in range(max_hops):
        next_frontier = {}
        for node, current_weight in current_frontier.items():
            # Use get_edges_from() as requested
            outgoing = get_edges_from(node)
            for edge in outgoing:
                if edge["type"] in ("implies", "subset_of"):
                    target = edge["to"]
                    new_weight = current_weight * edge.get("weight", 0.75)
                    
                    # If target not visited OR found a better path (unlikely with implies but safe)
                    if target not in expanded or new_weight > expanded[target]:
                        expanded[target] = round(new_weight, 3)
                        next_frontier[target] = new_weight
        
        if not next_frontier:
            break
        current_frontier = next_frontier
        
    return expanded


def match_candidate_to_requirements(
    candidate_weights: dict[str, float],
    requirements: list[dict],
) -> list[dict]:
    """
    Match a candidate's skill weights against JD requirement nodes.
    
    Args:
        candidate_weights: Dict of {node_id: weight} the candidate has.
        requirements: List of requirement dicts.
    """
    edge_index = get_edge_index()
    results = []

    for req in requirements:
        req_node_id = req["node_id"]
        result = {
            "requirement_node_id": req_node_id,
            "requirement_label": req.get("label", req_node_id),
            "priority": req.get("priority", "must_have"),
            "base_weight": req.get("base_weight", 1.0),
            "min_years": req.get("min_years") or 0,
            "match_type": "missing",
            "match_score": 0.0,
            "matched_via_node": None,
            "matched_via_edge_type": None,
            "evidence": "Not found in resume",
        }

        # Step 1: Direct match (using candidate's calculated weight)
        if req_node_id in candidate_weights:
            weight = candidate_weights[req_node_id]
            result["match_type"] = "direct"
            result["match_score"] = weight
            result["matched_via_node"] = req_node_id
            result["evidence"] = f"Direct match (weight {weight:.2f}) — '{req.get('label', req_node_id)}' found in expanded profile"
            results.append(result)
            continue

        # Step 2: Check if any candidate node implies/subset_of the requirement (1 hop)
        best_inferred = _find_best_inferred_match(
            req_node_id, set(candidate_weights.keys()), edge_index, max_hops=2
        )

        if best_inferred:
            result["match_type"] = "inferred"
            result["match_score"] = best_inferred["weight"]
            result["matched_via_node"] = best_inferred["via_node"]
            result["matched_via_edge_type"] = best_inferred["edge_type"]
            result["evidence"] = (
                f"Inferred via '{best_inferred['via_node']}' "
                f"({best_inferred['edge_type']}, weight {best_inferred['weight']:.2f})"
            )
            results.append(result)
            continue

        # Step 3: No match found → gap
        result["evidence"] = f"'{req.get('label', req_node_id)}' not found — no direct or inferred match"
        results.append(result)

    return results


def _find_best_inferred_match(
    target_node_id: str,
    candidate_set: set[str],
    edge_index: dict,
    max_hops: int = 2,
) -> dict | None:
    """
    Find the best inferred match for a target requirement node
    by traversing edges from candidate nodes.
    
    Checks:
    - Candidate has node X, and X --[implies/subset_of]--> target
    - Candidate has node X, X --> Y --> target (2 hops, multiplied weights)
    - Candidate has node X, and X --[related]--> target
    
    Returns the best match dict or None.
    """
    best = None
    best_weight = 0.0

    # Hop 1: Check edges FROM candidate nodes TO the target
    edges_to_target = edge_index["to"].get(target_node_id, [])
    for edge in edges_to_target:
        if edge["from"] in candidate_set:
            weight = edge["weight"]
            edge_type = edge["type"]
            if weight > best_weight:
                best_weight = weight
                best = {
                    "via_node": edge["from"],
                    "edge_type": edge_type,
                    "weight": weight,
                    "hops": 1,
                }

    # Hop 1 (reverse): Check edges FROM target TO candidate nodes
    # This handles cases like: target=python, candidate has django,
    # edge: django --implies--> python (already covered above)
    # But also: target=javascript, candidate has react,
    # edge: react --implies--> javascript (already covered above)

    # Hop 2: Check 2-hop paths (only if no strong 1-hop match)
    if max_hops >= 2 and best_weight < 0.75:
        # Find intermediate nodes connected to target
        for edge_to_target in edges_to_target:
            intermediate = edge_to_target["from"]
            if intermediate in candidate_set:
                continue  # Already handled in hop 1

            # Check if any candidate node connects to this intermediate
            edges_to_intermediate = edge_index["to"].get(intermediate, [])
            for edge_to_mid in edges_to_intermediate:
                if edge_to_mid["from"] in candidate_set:
                    # 2-hop path: candidate_node → intermediate → target
                    # Weight = product of edge weights (diminishing)
                    combined_weight = edge_to_mid["weight"] * edge_to_target["weight"]
                    # Only consider implies/subset_of for 2-hop (not related)
                    if edge_to_mid["type"] in ("implies", "subset_of") and \
                       edge_to_target["type"] in ("implies", "subset_of"):
                        if combined_weight > best_weight:
                            best_weight = combined_weight
                            best = {
                                "via_node": edge_to_mid["from"],
                                "edge_type": f"{edge_to_mid['type']}→{edge_to_target['type']}",
                                "weight": round(combined_weight, 3),
                                "hops": 2,
                            }

    return best


def classify_matches(per_requirement_results: list[dict]) -> dict:
    """
    Classify matches into direct_matches, inferred_matches, and gaps.
    """
    direct = []
    inferred = []
    gaps = []

    for r in per_requirement_results:
        entry = {
            "node_id": r["requirement_node_id"],
            "label": r["requirement_label"],
            "priority": r["priority"],
            "score": r["match_score"],
            "evidence": r["evidence"],
        }
        if r["match_type"] == "direct":
            direct.append(entry)
        elif r["match_type"] == "inferred":
            entry["matched_via"] = r["matched_via_node"]
            entry["edge_type"] = r["matched_via_edge_type"]
            inferred.append(entry)
        else:
            gaps.append(entry)

    return {
        "direct_matches": direct,
        "inferred_matches": inferred,
        "gaps": gaps,
    }
