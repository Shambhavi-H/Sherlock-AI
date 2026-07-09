import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from models import Participant, CandidateResult, MeetingStateResponse
from data import manager
import scoring

# Background simulation runner
async def simulation_loop():
    while True:
        try:
            await asyncio.sleep(5)
            if manager.is_running:
                manager.tick(scoring)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in simulation loop: {e}")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform initial score calculation on startup
    manager.tick(scoring)
    # Start the simulation loop background task
    task = asyncio.create_task(simulation_loop())
    yield
    # Clean up background task on shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Sherlock AI - Real-Time Candidate Identifier API",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UpdateRequest(BaseModel):
    action: Optional[str] = "tick"  # tick, reset, start, pause

@app.get("/participants", response_model=List[Participant])
def get_participants():
    """
    Returns all participant details along with their current computed scores.
    """
    state = manager.get_state()
    return state["participants"]

@app.get("/identify-candidate", response_model=CandidateResult)
def identify_candidate():
    """
    Runs the scoring engine and returns the details of the top identified candidate.
    """
    state = manager.get_state()
    top_candidate = scoring.score_participants(state["participants"], manager.candidate_metadata)
    if not top_candidate:
        raise HTTPException(status_code=404, detail="No participants in the meeting to identify.")
    return top_candidate

@app.post("/simulate-update", response_model=MeetingStateResponse)
def simulate_update(request: Optional[UpdateRequest] = None):
    """
    Forces a simulation update, toggles running status, or resets simulation state.
    """
    action = request.action if request else "tick"
    
    if action == "reset":
        state = manager.reset()
        # Recalculate scores right away after reset
        manager.tick(scoring)
        state = manager.get_state()
    elif action == "start":
        manager.is_running = True
        state = manager.get_state()
    elif action == "pause" or action == "stop":
        manager.is_running = False
        state = manager.get_state()
    elif action == "tick":
        # Force a simulation tick
        state = manager.tick(scoring)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
        
    top_candidate = scoring.score_participants(state["participants"], manager.candidate_metadata)
    
    return MeetingStateResponse(
        participants=state["participants"],
        top_candidate=top_candidate,
        timeline=state["timeline"],
        is_running=state["is_running"]
    )

@app.get("/state", response_model=MeetingStateResponse)
def get_state():
    """
    Returns the current full meeting state (participants, timeline, status).
    """
    state = manager.get_state()
    top_candidate = scoring.score_participants(state["participants"], manager.candidate_metadata)
    return MeetingStateResponse(
        participants=state["participants"],
        top_candidate=top_candidate,
        timeline=state["timeline"],
        is_running=state["is_running"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
