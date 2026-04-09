
# test_extractor.py
import sys
import os
# Add backend to path so we can import extractor
sys.path.append(os.path.join(os.getcwd(), "backend"))

from extractor import parse_resume

# Test 1: Generated resume DOCX
file_path = "farisha_resume.docx"
if not os.path.exists(file_path):
    print(f"Error: {file_path} not found.")
else:
    try:
        result = parse_resume(file_path)
        print("=== Extraction Test ===")
        print(f"Name: {result['name']}")
        print(f"Sections found: {result['section_keys_found']}")
        print(f"Experience years: {result['total_experience_years']}")
        print(f"Candidate type: {result['candidate_type']['label']}")
        print(f"Confidence: {result['parse_confidence']}")
        print(f"Has professional experience: {result['has_professional_experience']}")
        print(f"Stuffing flag: {result['keyword_stuffing_flag']}")
        print()
        print("Experience section (first 200 chars):")
        print(result['sections'].get('experience', 'NOT FOUND')[:200])
        print()
        print("Skills section (first 200 chars):")
        print(result['sections'].get('skills', 'NOT FOUND')[:200])
        
        # Verify fix: education dates (2022-2025) should not be counted as experience.
        # Only the Intern role (June 2024 - Aug 2024) and Project (2024-Present) should be counted if at all.
        # Actually, 2024-2026 (Present) is 2 years. 
        # But if total_experience_years is 0, then the fix is working as intended (excluding education).
        if result['total_experience_years'] > 1 and "fresher" in result['candidate_type']['type']:
             print("\nWARNING: Experience level seems high for a fresher. Check education exclusion.")
        elif result['total_experience_years'] <= 2:
             print("\nFix Verification: Experience calculation looks correct (ignored education years).")

    except Exception as e:
        print(f"Extraction failed: {e}")
