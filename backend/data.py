import json
import os
from typing import List, Dict, Any, Optional
from models import Participant, TimelinePoint, CandidateResult

class MeetingStateManager:
    def __init__(self, data_path: str = "sample_data.json"):
        # Resolve data path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_path = os.path.join(current_dir, data_path)
        self.candidate_metadata = {}
        self.participants: Dict[str, Participant] = {}
        self.timeline: List[TimelinePoint] = []
        self.step = 0
        self.is_running = True
        self.load_initial_data()

    def load_initial_data(self):
        with open(self.data_path, 'r') as f:
            data = json.load(f)
        
        self.candidate_metadata = data.get("candidate_metadata", {})
        initial_parts = data.get("initial_participants", [])
        
        self.participants = {}
        for p in initial_parts:
            self.participants[p["id"]] = Participant(
                id=p["id"],
                display_name=p["display_name"],
                email=p["email"],
                camera_on=p["camera_on"],
                speaking_duration=p["speaking_duration"],
                questions_answered=list(p["questions_answered"]),
                join_order=p["join_order"],
                is_screen_sharing=p["is_screen_sharing"],
                role=p["role"],
                confidence_score=0.0,
                evidence_breakdown=[]
            )
        self.timeline = []
        self.step = 0

    def reset(self):
        self.load_initial_data()
        return self.get_state()

    def tick(self, scoring_engine):
        if not self.is_running:
            return self.get_state()

        self.step += 1
        
        # Simulate interview progression timeline
        part1 = self.participants.get("part-1") # Real candidate (initially MacBook Pro)
        part2 = self.participants.get("part-2") # Interviewer Bob
        part3 = self.participants.get("part-3") # Recruiter Charlie
        part5 = self.participants.get("part-5") # Ambiguous Alice Smyth

        if self.step == 1:
            # MacBook Pro sets email
            if part1:
                part1.email = "alice.smith@example.com"
            if part2:
                part2.speaking_duration += 10.0

        elif self.step == 2:
            # MacBook Pro turns camera ON, starts speaking
            if part1:
                part1.camera_on = True
                part1.speaking_duration += 45.0
            if part5:
                part5.speaking_duration += 10.0

        elif self.step == 3:
            # MacBook Pro answers first set of questions matching keywords
            if part1:
                part1.questions_answered.extend(["algorithm", "fastapi"])
                part1.speaking_duration += 90.0
            if part2:
                part2.speaking_duration += 15.0

        elif self.step == 4:
            # MacBook Pro renames to "Alice S." (Nickname change)
            if part1:
                part1.display_name = "Alice S."
                part1.speaking_duration += 80.0
            if part5:
                # Imposter starts screen sharing (interferes)
                part5.is_screen_sharing = True
                part5.speaking_duration += 20.0

        elif self.step == 5:
            # Imposter stops screen sharing, MacBook Pro answers more questions
            if part5:
                part5.is_screen_sharing = False
            if part1:
                part1.questions_answered.extend(["react", "experience"])
                part1.speaking_duration += 100.0

        elif self.step == 6:
            # MacBook Pro speaking duration exceeds 300 seconds
            if part1:
                part1.speaking_duration += 60.0 # total will be 0+45+90+80+100+60 = 375s (> 300)
                part1.questions_answered.extend(["system design", "architecture"])
            if part2:
                part2.speaking_duration += 15.0

        elif self.step == 7:
            # Renames to full display name
            if part1:
                part1.display_name = "Alice Smith"
                part1.speaking_duration += 40.0
            if part5:
                # Imposter turns camera OFF out of frustration
                part5.camera_on = False
                part5.speaking_duration += 5.0
        
        else:
            # Post step 7, standard slow increments
            if part1:
                part1.speaking_duration += 15.0
            if part2:
                part2.speaking_duration += 8.0

        # Perform scoring for all participants
        top_candidate_res = scoring_engine.score_participants(
            list(self.participants.values()), 
            self.candidate_metadata
        )

        # Update in-memory scores, evidence and decision traces
        for p in self.participants.values():
            score_data = scoring_engine.score_single_participant(p, self.candidate_metadata)
            p.confidence_score = score_data["confidence"]
            p.evidence_breakdown = score_data["reasons"]
            p.decision_trace = score_data["decision_trace"]

        # Append to timeline
        if top_candidate_res:
            self.timeline.append(TimelinePoint(
                timestamp=self.step * 5,  # 5 seconds per step
                candidate=top_candidate_res.candidate,
                confidence=top_candidate_res.confidence
            ))

        return self.get_state()

    def get_state(self) -> Dict[str, Any]:
        return {
            "participants": list(self.participants.values()),
            "timeline": self.timeline,
            "is_running": self.is_running
        }

# Global manager instance
manager = MeetingStateManager()
