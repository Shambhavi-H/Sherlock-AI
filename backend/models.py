from pydantic import BaseModel
from typing import List, Optional

class EvidenceTraceItem(BaseModel):
    signal_name: str
    status: str
    max_weight: float
    contribution: float

class Participant(BaseModel):
    id: str
    display_name: str
    email: Optional[str] = None
    camera_on: bool
    speaking_duration: float  # in seconds
    questions_answered: List[str] = []
    join_order: int
    is_screen_sharing: bool
    role: str  # candidate, interviewer, recruiter, observer, unknown
    confidence_score: float = 0.0
    evidence_breakdown: List[str] = []
    decision_trace: List[EvidenceTraceItem] = []

class CandidateResult(BaseModel):
    candidate: str  # Display Name
    email: Optional[str] = None
    confidence: float  # Percentage (0-100)
    reasons: List[str]

class TimelinePoint(BaseModel):
    timestamp: int  # relative or epoch
    candidate: str
    confidence: float

class MeetingStateResponse(BaseModel):
    participants: List[Participant]
    top_candidate: Optional[CandidateResult]
    timeline: List[TimelinePoint]
    is_running: bool
