
def compute_trajectory(skill_nodes: list[dict]) -> dict:
    """
    Compute skill trajectory based on timing of skill acquisition.
    - Rising: most high-depth skills added in last 2 years
    - Stable: skills spread evenly
    - Declining: most high-depth skills not used in 3+ years
    """
    import datetime
    current_year = datetime.datetime.now().year
    
    if not skill_nodes:
        return {"type": "unknown", "label": "Unknown Trajectory", "momentum": 0.5}

    recent_growth = 0
    total_high_depth = 0
    
    for sn in skill_nodes:
        if sn.get("depth") == "lead":
            total_high_depth += 1
            last_year = sn.get("last_year", current_year)
            if last_year >= current_year - 2:
                recent_growth += 1
    
    if total_high_depth == 0:
        return {"type": "stable", "label": "Stable Foundation", "momentum": 0.5}
        
    ratio = recent_growth / total_high_depth
    if ratio > 0.6:
        return {"type": "rising", "label": "Rising Star / High Momentum", "momentum": 0.85}
    elif ratio > 0.3:
        return {"type": "stable", "label": "Consistent Capability", "momentum": 0.60}
    else:
        return {"type": "declining", "label": "Legacy Skillset", "momentum": 0.35}
