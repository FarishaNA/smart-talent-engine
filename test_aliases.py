
# test_aliases.py
import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from alias_matcher import match_skills_in_text

def test_aliases():
    # Load the updated graph
    with open("backend/skill_graph.json", "r") as f:
        graph = json.load(f)
    
    test_cases = [
        ("Experience building and consuming REST APIs", "restapi"),
        ("Expertise in Java Virtual Machine", "java"),
        ("Strong knowledge of the Microsoft Stack", "dotnet"),
        ("Python developer with Django expertise", "python"),
        ("Python developer with Django expertise", "django"),
        ("Experience with built and consumed REST APIs", "restapi"),
        ("Background in backend services and microservices", "restapi")
    ]
    
    print("=== Alias Match Test ===")
    all_passed = True
    for text, expected_node in test_cases:
        matches = match_skills_in_text(text)
        matched_ids = [m["node_id"] for m in matches]
        
        status = "PASSED" if expected_node in matched_ids else "FAILED"
        if status == "FAILED":
            all_passed = False
        
        print(f"Text: '{text}'")
        print(f"Expected: {expected_node} | Matched: {matched_ids} | Result: {status}")
        print("-" * 30)
    
    if all_passed:
        print("\nSUCCESS: All alias test cases passed!")
    else:
        print("\nFAILURE: Some alias test cases failed.")

if __name__ == "__main__":
    test_aliases()
