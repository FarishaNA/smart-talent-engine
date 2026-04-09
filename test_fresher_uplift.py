
# test_fresher_uplift.py
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from scorer import score_candidate

def test_fresher_uplift():
    # Mock data
    requirements = [
        {"requirement_node_id": "python", "base_weight": 1.0, "match_score": 1.0}
    ]
    
    skill_nodes = [
        {"node_id": "python", "depth": "lead", "context": "personal", "last_year": 2024}
    ]
    
    # 1. Test as Senior (No uplift)
    score_senior, _ = score_candidate(
        per_requirement_results=requirements,
        candidate_skill_nodes=skill_nodes,
        most_recent_year=2024,
        is_fresher=False,
        project_text=""
    )
    
    # 2. Test as Fresher with weak projects
    score_fresher_weak, _ = score_candidate(
        per_requirement_results=requirements,
        candidate_skill_nodes=skill_nodes,
        most_recent_year=2024,
        is_fresher=True,
        project_text="Short text."
    )
    
    # 3. Test as Fresher with strong projects (>100 words)
    strong_project_text = "word " * 120
    score_fresher_strong, _ = score_candidate(
        per_requirement_results=requirements,
        candidate_skill_nodes=skill_nodes,
        most_recent_year=2024,
        is_fresher=True,
        project_text=strong_project_text
    )
    
    print(f"Senior Score: {score_senior}")
    print(f"Fresher (Weak Proj) Score: {score_fresher_weak}")
    print(f"Fresher (Strong Proj) Score: {score_fresher_strong}")
    
    # Expected: score_fresher_strong should be ~1.2x score_senior (due to my formula fix)
    # Wait, my formula in scorer.py uses 1.2x. Let's check.
    # context_weight for fresher + personal is 0.95 vs 0.45 for senior? 
    # Let's see results.

if __name__ == "__main__":
    test_fresher_uplift()
