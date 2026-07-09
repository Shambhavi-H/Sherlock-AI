import sys
import os

# Allow importing modules from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import Participant
import scoring
import similarity

def run_tests():
    print("==================================================")
    print("Running Sherlock AI Upgraded Scoring Engine Tests...")
    print("==================================================")

    # 1. Mock Metadata
    metadata = {
        "name": "Alice Smith",
        "email": "alice.smith@example.com",
        "nicknames": ["MacBook Pro", "Alice", "Alice S.", "Alice's iPad"],
        "keywords": ["algorithm", "system design", "fastapi"]
    }

    # Test Cases
    # Case A: Ideal Candidate (Name and Email match exactly, Camera ON, speaking duration > 300, answers questions)
    candidate_perfect = Participant(
        id="p-1",
        display_name="Alice Smith",
        email="alice.smith@example.com",
        camera_on=True,
        speaking_duration=350.0,
        questions_answered=["algorithm", "fastapi"],
        join_order=1,
        is_screen_sharing=False,
        role="candidate"
    )

    # Case B: Nickname match but missing email
    candidate_nickname = Participant(
        id="p-2",
        display_name="MacBook Pro",
        email=None,
        camera_on=False,
        speaking_duration=0.0,
        questions_answered=[],
        join_order=2,
        is_screen_sharing=False,
        role="unknown"
    )

    # Score Case A
    score_a = scoring.score_single_participant(candidate_perfect, metadata)
    print(f"\n[Case A] Perfect Candidate (Alice Smith):")
    print(f"Confidence: {score_a['confidence']}%")
    print(f"Raw Score: {score_a['raw_score']}")
    print("Decision Trace:")
    for item in score_a['decision_trace']:
        print(f"  - {item.signal_name}: Status='{item.status}', Points={item.contribution}/{item.max_weight}")
        
    assert score_a['confidence'] == 100.0, f"Expected 100.0%, got {score_a['confidence']}%"
    assert len(score_a['decision_trace']) == 10, "Expected 10 traces including 7 signals and 3 penalties"
    
    # Calculate sum and check mathematical consistency
    trace_sum = sum(item.contribution for item in score_a['decision_trace'])
    assert abs(trace_sum - score_a['raw_score']) < 0.01, f"Trace sum ({trace_sum}) should equal raw score ({score_a['raw_score']})"

    # Score Case B
    score_b = scoring.score_single_participant(candidate_nickname, metadata)
    print(f"\n[Case B] Nickname Candidate (MacBook Pro):")
    print(f"Confidence: {score_b['confidence']}%")
    print(f"Raw Score: {score_b['raw_score']}")
    print("Decision Trace:")
    for item in score_b['decision_trace']:
        print(f"  - {item.signal_name}: Status='{item.status}', Points={item.contribution}/{item.max_weight}")
        
    assert len(score_b['decision_trace']) == 10
    trace_sum_b = sum(item.contribution for item in score_b['decision_trace'])
    assert abs(trace_sum_b - score_b['raw_score']) < 0.01

    # Verify fallback mode
    print(f"\nModel Available for Semantic Search: {similarity.MODEL_AVAILABLE}")
    sim = similarity.calculate_name_similarity("Alice Smyth", "Alice Smith")
    print(f"Calculated similarity between 'Alice Smyth' and 'Alice Smith': {sim*100:.1f}%")
    assert sim > 0.6, "Similarity should be high for typo"

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
