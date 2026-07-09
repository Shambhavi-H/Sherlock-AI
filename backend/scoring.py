import os
from typing import List, Dict, Any, Optional
from models import Participant, CandidateResult, EvidenceTraceItem
import similarity
import openai

def score_single_participant(p: Participant, metadata: Dict[str, Any]) -> Dict[str, Any]:
    target_name = metadata.get("name", "")
    target_email = metadata.get("email", "")
    nicknames = metadata.get("nicknames", [])
    
    trace: List[EvidenceTraceItem] = []
    reasons = []
    
    # 1. Email Match (+40)
    email_contrib = 0.0
    email_status = "Missing"
    if p.email:
        if target_email and p.email.lower().strip() == target_email.lower().strip():
            email_contrib = 40.0
            email_status = f"{p.email} (Matched)"
            reasons.append("Email address matched candidate metadata (+40)")
        else:
            email_status = f"{p.email} (Mismatch)"
            reasons.append(f"Email address '{p.email}' did not match target candidate email")
    else:
        email_status = "No email provided"
        
    trace.append(EvidenceTraceItem(
        signal_name="Email Metadata Match",
        status=email_status,
        max_weight=40.0,
        contribution=email_contrib
    ))
        
    # 2. Name Similarity (+20)
    # Check if display name matches target name or any of the common nicknames
    name_sim_score = 0.0
    is_nickname = False
    name_status = "No match"
    
    # Check nicknames first (exact match)
    if p.display_name.lower().strip() in [n.lower().strip() for n in nicknames]:
        name_sim_score = 1.0
        is_nickname = True
        name_status = f"'{p.display_name}' (Device Nickname Match)"
    else:
        # Calculate semantic similarity with target name
        sim_to_target = similarity.calculate_name_similarity(p.display_name, target_name)
        # Calculate similarity with all nicknames, take max
        sim_to_nicknames = [similarity.calculate_name_similarity(p.display_name, nick) for nick in nicknames]
        name_sim_score = max([sim_to_target] + sim_to_nicknames)
        name_status = f"'{p.display_name}' ({name_sim_score*100:.1f}% Semantic Match)"
        
    name_contrib = name_sim_score * 20.0
    
    if name_sim_score == 1.0:
        if is_nickname:
            reasons.append(f"Display name matches a known candidate device/nickname: '{p.display_name}' (+20)")
        else:
            reasons.append("Display name matches candidate name exactly (+20)")
    elif name_sim_score > 0.6:
        reasons.append(f"Display name '{p.display_name}' is similar to candidate '{target_name}' (Similarity: {name_sim_score*100:.1f}%) (+{name_contrib:.1f})")
    else:
        reasons.append(f"Low display name similarity ({name_sim_score*100:.1f}%) with candidate")

    trace.append(EvidenceTraceItem(
        signal_name="Name Similarity Check",
        status=name_status,
        max_weight=20.0,
        contribution=round(name_contrib, 2)
    ))

    # 3. Camera ON (+10)
    camera_contrib = 10.0 if p.camera_on else 0.0
    camera_status = "Video Active (ON)" if p.camera_on else "Video Inactive (OFF)"
    if p.camera_on:
        reasons.append("Camera turned ON (+10)")
    else:
        reasons.append("Camera turned OFF (No Camera ON bonus)")
        
    trace.append(EvidenceTraceItem(
        signal_name="Active Camera Check",
        status=camera_status,
        max_weight=10.0,
        contribution=camera_contrib
    ))

    # 4. Speaking Duration >300 seconds (+15)
    speaking_contrib = 15.0 if p.speaking_duration > 300.0 else 0.0
    speaking_status = f"{p.speaking_duration:.1f}s (Threshold Met)" if p.speaking_duration > 300.0 else f"{p.speaking_duration:.1f}s (Limit Not Met)"
    if p.speaking_duration > 300.0:
        reasons.append(f"Speaking duration exceeds 300 seconds (Active speaking: {p.speaking_duration:.1f}s) (+15)")
    else:
        reasons.append(f"Speaking duration is {p.speaking_duration:.1f}s (less than 300s limit)")
        
    trace.append(EvidenceTraceItem(
        signal_name="Speaking Active Time",
        status=speaking_status,
        max_weight=15.0,
        contribution=speaking_contrib
    ))

    # 5. Answers Questions (+20)
    questions_contrib = 20.0 if p.questions_answered else 0.0
    questions_status = f"Topics: {', '.join(p.questions_answered)}" if p.questions_answered else "No questions answered yet"
    if p.questions_answered:
        reasons.append(f"Answered interview questions (Matched topics: {', '.join(p.questions_answered)}) (+20)")
    else:
        reasons.append("Has not yet answered targeted interview questions")
        
    trace.append(EvidenceTraceItem(
        signal_name="Interview Answers Check",
        status=questions_status,
        max_weight=20.0,
        contribution=questions_contrib
    ))

    # 6. Joined Early (+5)
    join_contrib = 5.0 if p.join_order <= 2 else 0.0
    join_status = f"Joined #{p.join_order} (Early)" if p.join_order <= 2 else f"Joined #{p.join_order} (Late)"
    if p.join_order <= 2:
        reasons.append(f"Joined meeting early (Join order: #{p.join_order}) (+5)")
    else:
        reasons.append(f"Joined meeting later (Join order: #{p.join_order})")
        
    trace.append(EvidenceTraceItem(
        signal_name="Early Arrival Check",
        status=join_status,
        max_weight=5.0,
        contribution=join_contrib
    ))

    # 7. Screen Sharing OFF (+5)
    screen_contrib = 5.0 if not p.is_screen_sharing else 0.0
    screen_status = "Screen Share Inactive" if not p.is_screen_sharing else "Screen Share Active"
    if not p.is_screen_sharing:
        reasons.append("Screen sharing is inactive (+5)")
    else:
        reasons.append("Active screen sharing detected (candidate screen share check)")
        
    trace.append(EvidenceTraceItem(
        signal_name="Inactive Screen Share",
        status=screen_status,
        max_weight=5.0,
        contribution=screen_contrib
    ))

    # Role Penalties
    role_lower = p.role.lower()
    
    interviewer_penalty = -30.0 if ("interviewer" in role_lower or p.display_name.lower().find("interviewer") != -1) else 0.0
    trace.append(EvidenceTraceItem(
        signal_name="Interviewer Role Penalty",
        status="Interviewer Detected" if interviewer_penalty != 0 else "No Penalty",
        max_weight=-30.0,
        contribution=interviewer_penalty
    ))
    
    recruiter_penalty = -30.0 if ("recruiter" in role_lower or "hr" in role_lower or p.display_name.lower().find("hr") != -1) else 0.0
    trace.append(EvidenceTraceItem(
        signal_name="Recruiter/HR Role Penalty",
        status="HR/Recruiter Detected" if recruiter_penalty != 0 else "No Penalty",
        max_weight=-30.0,
        contribution=recruiter_penalty
    ))
    
    observer_penalty = -20.0 if ("observer" in role_lower or p.display_name.lower().find("observer") != -1) else 0.0
    trace.append(EvidenceTraceItem(
        signal_name="Observer Role Penalty",
        status="Observer Detected" if observer_penalty != 0 else "No Penalty",
        max_weight=-20.0,
        contribution=observer_penalty
    ))

    if interviewer_penalty != 0:
        reasons.append("Identified as Interviewer (Penalty: -30)")
    if recruiter_penalty != 0:
        reasons.append("Identified as Recruiter/HR (Penalty: -30)")
    if observer_penalty != 0:
        reasons.append("Identified as Observer (Penalty: -20)")

    # Normalize score to 0 - 100%
    # Maximum possible score is 115 (40+20+10+15+20+5+5)
    raw_score = sum(item.contribution for item in trace)
    max_score = 115.0
    normalized_confidence = max(0.0, min(100.0, (raw_score / max_score) * 100.0))

    return {
        "confidence": round(normalized_confidence, 1),
        "reasons": reasons,
        "raw_score": raw_score,
        "decision_trace": trace
    }

def score_participants(participants: List[Participant], metadata: Dict[str, Any]) -> Optional[CandidateResult]:
    if not participants:
        return None

    scored_participants = []
    for p in participants:
        score_res = score_single_participant(p, metadata)
        scored_participants.append({
            "participant": p,
            "score_data": score_res
        })
        
    # Sort by confidence score descending
    scored_participants.sort(key=lambda x: x["score_data"]["confidence"], reverse=True)
    
    top_p_data = scored_participants[0]
    top_p = top_p_data["participant"]
    top_score_data = top_p_data["score_data"]
    
    # Explainable AI Reasoning (OpenAI or Programmatic fallback)
    reasons = generate_explainable_reasoning(top_p, top_score_data, scored_participants, metadata)
    
    return CandidateResult(
        candidate=top_p.display_name,
        email=top_p.email,
        confidence=top_score_data["confidence"],
        reasons=reasons
    )

def generate_explainable_reasoning(
    candidate: Participant, 
    score_data: Dict[str, Any], 
    all_scored: List[Dict[str, Any]], 
    metadata: Dict[str, Any]
) -> List[str]:
    
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            openai.api_key = api_key
            prompt = f"""
            Analyze the following interview meeting data and write a short bulleted list of 3-4 distinct evidence arguments explaining why '{candidate.display_name}' is identified as the actual candidate.
            
            Target Candidate Profile:
            - Target Name: {metadata.get('name')}
            - Target Email: {metadata.get('email')}
            - Nicknames: {metadata.get('nicknames')}
            
            Selected Candidate's Current State:
            - Name: {candidate.display_name}
            - Email: {candidate.email}
            - Camera ON: {candidate.camera_on}
            - Speaking duration: {candidate.speaking_duration:.1f} seconds
            - Questions answered: {candidate.questions_answered}
            - Join order: #{candidate.join_order}
            - Screen sharing: {candidate.is_screen_sharing}
            - Role: {candidate.role}
            - Confidence Score: {score_data['confidence']}%
            
            Other participants in the call:
            {[{'name': item['participant'].display_name, 'confidence': item['score_data']['confidence'], 'role': item['participant'].role} for item in all_scored if item['participant'].id != candidate.id]}
            
            Formulate a clear explanation resolving any ambiguity (e.g. if their display name was initially 'MacBook Pro' or if there is someone with a similar name like 'Alice Smyth'). Keep the explanations concise, professional, and start each with a checkmark or bullet point. Do not include markdown headers.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are Sherlock AI, an intelligent agent identifying candidates in online meetings using evidence signals."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250,
                temperature=0.2
            )
            content = response.choices[0].message.content.strip()
            lines = [line.strip().lstrip('-*✓ ').strip() for line in content.split('\n') if line.strip()]
            return [f"✓ {line}" for line in lines if line]
        except Exception:
            pass

    # Fallback Programmatic Reasoning
    reasons = []
    
    # 1. Email Check
    if candidate.email and candidate.email.lower() == metadata.get("email", "").lower():
        reasons.append("Email address matched candidate metadata exactly")
    elif not candidate.email:
        if candidate.display_name in metadata.get("nicknames", []):
            reasons.append(f"Identified via device nickname '{candidate.display_name}' despite missing email")
        else:
            reasons.append("Display name similarity matched, although email is missing")
            
    # 2. Speaking Duration
    if candidate.speaking_duration > 300:
        reasons.append(f"Highest speaking duration ({candidate.speaking_duration:.0f} seconds), showing high participation")
    elif candidate.speaking_duration > 50:
        reasons.append(f"Substantial speaking time ({candidate.speaking_duration:.0f} seconds) during the interview")
        
    # 3. Question Answering
    if candidate.questions_answered:
        reasons.append(f"Answered interview topics: {', '.join(candidate.questions_answered)}")
        
    # 4. Camera Status
    if candidate.camera_on:
        reasons.append("Camera remained ON throughout the evaluation window")
    else:
        reasons.append("Camera is currently OFF, but other signals confirm identity")

    # 5. Handle Ambiguities specifically
    for item in all_scored:
        other = item["participant"]
        if other.id != candidate.id:
            similarity_score = similarity.calculate_name_similarity(other.display_name, metadata.get("name", ""))
            if similarity_score > 0.6 and other.role == "unknown":
                reasons.append(f"Resolved ambiguity with '{other.display_name}' (imposter candidate) due to incorrect email / low speaking duration")
                break

    return [f"✓ {r}" for r in reasons]
