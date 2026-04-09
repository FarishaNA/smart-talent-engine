"""Smart Talent Engine — Core alias matching against skill_graph.json.

Uses word-boundary regex to prevent partial matches (java ≠ javascript).
Returns matched node_ids with the alias that triggered the match.
"""

import re
import json
import os
from typing import Optional

# Load skill graph at module level
_GRAPH_PATH = os.path.join(os.path.dirname(__file__), "skill_graph.json")
_graph_cache = None


def load_graph() -> dict:
    """Load and cache skill graph."""
    global _graph_cache
    if _graph_cache is None:
        with open(_GRAPH_PATH, "r", encoding="utf-8") as f:
            _graph_cache = json.load(f)
    return _graph_cache


def _build_alias_index() -> list[tuple[str, str, str, str, re.Pattern]]:
    """
    Build a sorted alias index for matching.
    Returns list of (alias, node_id, label, domain, compiled_regex) tuples.
    Sorted longest-first so longer aliases match before shorter ones.
    """
    graph = load_graph()
    alias_index = []

    for node in graph["nodes"]:
        for alias in node["aliases"]:
            # Escape special regex characters in alias, then wrap with word boundaries
            escaped = re.escape(alias)
            # Use word boundaries to prevent partial matches
            pattern = re.compile(r"\b" + escaped + r"\b", re.IGNORECASE)
            alias_index.append((alias, node["node_id"], node["label"], node["domain"], pattern))

    # Sort longest alias first to prefer more specific matches
    alias_index.sort(key=lambda x: len(x[0]), reverse=True)
    return alias_index


_alias_index_cache = None


def get_alias_index():
    global _alias_index_cache
    if _alias_index_cache is None:
        _alias_index_cache = _build_alias_index()
    return _alias_index_cache


def match_skills_in_text(text: str) -> list[dict]:
    """
    Scan text against all aliases in skill_graph.json using word-boundary regex.
    Returns list of matched skill dicts with node_id, label, domain, matched_via.
    De-duplicates by node_id (keeps first/longest alias match).
    """
    alias_index = get_alias_index()
    matched = {}  # node_id → match dict

    for alias, node_id, label, domain, pattern in alias_index:
        if node_id in matched:
            continue  # Already matched this node (via a longer alias)
        if pattern.search(text):
            matched[node_id] = {
                "node_id": node_id,
                "label": label,
                "domain": domain,
                "matched_via": alias,
            }

    return list(matched.values())


def count_skill_mentions(text: str, node_id: str) -> int:
    """Count how many sections/times a specific skill appears."""
    alias_index = get_alias_index()
    count = 0
    for alias, nid, _, _, pattern in alias_index:
        if nid == node_id:
            count += len(pattern.findall(text))
    return count


def get_node_by_id(node_id: str) -> Optional[dict]:
    """Get a node definition by its ID."""
    graph = load_graph()
    for node in graph["nodes"]:
        if node["node_id"] == node_id:
            return node
    return None


def get_edges_from(node_id: str) -> list[dict]:
    """Get all edges originating from a node."""
    graph = load_graph()
    return [e for e in graph["edges"] if e["from"] == node_id]


def get_edges_to(node_id: str) -> list[dict]:
    """Get all edges pointing to a node."""
    graph = load_graph()
    return [e for e in graph["edges"] if e["to"] == node_id]


def match_skills_to_graph(text: str, graph: dict) -> list[dict]:
    """
    Match skills in text against a provided skill graph.
    
    This is the variant used by extractor.py which passes the graph explicitly.
    Internally uses the same alias-index matching logic as match_skills_in_text.
    The graph parameter is accepted for API compatibility — the internal
    cached graph (loaded from skill_graph.json) is used for consistency.
    """
    return match_skills_in_text(text)


def get_all_domains() -> list[str]:
    """Get all unique domains from the skill graph."""
    graph = load_graph()
    return list(set(node["domain"] for node in graph["nodes"]))
