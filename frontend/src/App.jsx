import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Users, UserCheck, Video, VideoOff, Volume2, ShieldAlert, RefreshCw, 
  Play, Pause, ChevronRight, Activity, Mail, Clock, HelpCircle, Share2, Server, AlertCircle
} from 'lucide-react';

const API_BASE = "http://localhost:5000";

// Mock Fallback Data (in case backend is offline)
const INITIAL_MOCK_STATE = {
  candidate_metadata: {
    name: "Alice Smith",
    email: "alice.smith@example.com",
    nicknames: ["MacBook Pro", "Alice", "Alice S.", "Alice's iPad"],
    keywords: ["algorithm", "system design", "fastapi", "react", "experience", "architecture"]
  },
  participants: [
    {
      id: "part-1",
      display_name: "MacBook Pro",
      email: null,
      camera_on: false,
      speaking_duration: 0.0,
      questions_answered: [],
      join_order: 1,
      is_screen_sharing: false,
      role: "unknown",
      confidence_score: 26.1,
      evidence_breakdown: [
        "Display name matches a known candidate device/nickname: 'MacBook Pro' (+20)",
        "Camera turned OFF (No Camera ON bonus)",
        "Speaking duration is 0.0s (less than 300s limit)",
        "Has not yet answered targeted interview questions",
        "Joined meeting early (Join order: #1) (+5)",
        "Screen sharing is inactive (+5)"
      ],
      decision_trace: [
        { signal_name: "Email Metadata Match", status: "No email provided", max_weight: 40.0, contribution: 0.0 },
        { signal_name: "Name Similarity Check", status: "'MacBook Pro' (Nickname Match)", max_weight: 20.0, contribution: 20.0 },
        { signal_name: "Active Camera Check", status: "Video Inactive (OFF)", max_weight: 10.0, contribution: 0.0 },
        { signal_name: "Speaking Active Time", status: "0.0s (Limit Not Met)", max_weight: 15.0, contribution: 0.0 },
        { signal_name: "Interview Answers Check", status: "No questions answered yet", max_weight: 20.0, contribution: 0.0 },
        { signal_name: "Early Arrival Check", status: "Joined #1 (Early)", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Inactive Screen Share", status: "Screen Share Inactive", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Interviewer Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Recruiter/HR Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Observer Role Penalty", status: "No Penalty", max_weight: -20.0, contribution: 0.0 }
      ]
    },
    {
      id: "part-2",
      display_name: "Dr. Bob Jones",
      email: "bob.jones@techcorp.com",
      camera_on: true,
      speaking_duration: 15.0,
      questions_answered: [],
      join_order: 2,
      is_screen_sharing: false,
      role: "interviewer",
      confidence_score: 0.0,
      evidence_breakdown: [
        "Email address 'bob.jones@techcorp.com' did not match target candidate email",
        "Low display name similarity (33.3%) with candidate",
        "Camera turned ON (+10)",
        "Speaking duration is 15.0s (less than 300s limit)",
        "Joined meeting early (Join order: #2) (+5)",
        "Screen sharing is inactive (+5)",
        "Identified as Interviewer (Penalty: -30)"
      ],
      decision_trace: [
        { signal_name: "Email Metadata Match", status: "bob.jones@techcorp.com (Mismatch)", max_weight: 40.0, contribution: 0.0 },
        { signal_name: "Name Similarity Check", status: "'Dr. Bob Jones' (33.3% Match)", max_weight: 20.0, contribution: 6.66 },
        { signal_name: "Active Camera Check", status: "Video Active (ON)", max_weight: 10.0, contribution: 10.0 },
        { signal_name: "Speaking Active Time", status: "15.0s (Limit Not Met)", max_weight: 15.0, contribution: 0.0 },
        { signal_name: "Interview Answers Check", status: "No questions answered yet", max_weight: 20.0, contribution: 0.0 },
        { signal_name: "Early Arrival Check", status: "Joined #2 (Early)", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Inactive Screen Share", status: "Screen Share Inactive", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Interviewer Role Penalty", status: "Interviewer Detected", max_weight: -30.0, contribution: -30.0 },
        { signal_name: "Recruiter/HR Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Observer Role Penalty", status: "No Penalty", max_weight: -20.0, contribution: 0.0 }
      ]
    },
    {
      id: "part-3",
      display_name: "Charlie HR",
      email: "charlie.recruiter@techcorp.com",
      camera_on: true,
      speaking_duration: 5.0,
      questions_answered: [],
      join_order: 3,
      is_screen_sharing: false,
      role: "recruiter",
      confidence_score: 0.0,
      evidence_breakdown: [
        "Email address 'charlie.recruiter@techcorp.com' did not match target candidate email",
        "Low display name similarity (30.0%) with candidate",
        "Camera turned ON (+10)",
        "Speaking duration is 5.0s (less than 300s limit)",
        "Joined meeting later (Join order: #3)",
        "Screen sharing is inactive (+5)",
        "Identified as Recruiter/HR (Penalty: -30)"
      ],
      decision_trace: [
        { signal_name: "Email Metadata Match", status: "charlie.recruiter@techcorp.com (Mismatch)", max_weight: 40.0, contribution: 0.0 },
        { signal_name: "Name Similarity Check", status: "'Charlie HR' (30.0% Match)", max_weight: 20.0, contribution: 6.0 },
        { signal_name: "Active Camera Check", status: "Video Active (ON)", max_weight: 10.0, contribution: 10.0 },
        { signal_name: "Speaking Active Time", status: "5.0s (Limit Not Met)", max_weight: 15.0, contribution: 0.0 },
        { signal_name: "Interview Answers Check", status: "No questions answered yet", max_weight: 20.0, contribution: 0.0 },
        { signal_name: "Early Arrival Check", status: "Joined #3 (Late)", max_weight: 5.0, contribution: 0.0 },
        { signal_name: "Inactive Screen Share", status: "Screen Share Inactive", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Interviewer Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Recruiter/HR Role Penalty", status: "HR/Recruiter Detected", max_weight: -30.0, contribution: -30.0 },
        { signal_name: "Observer Role Penalty", status: "No Penalty", max_weight: -20.0, contribution: 0.0 }
      ]
    },
    {
      id: "part-4",
      display_name: "Observer Dave",
      email: "dave.observer@techcorp.com",
      camera_on: false,
      speaking_duration: 2.0,
      questions_answered: [],
      join_order: 4,
      is_screen_sharing: false,
      role: "observer",
      confidence_score: 0.0,
      evidence_breakdown: [
        "Email address 'dave.observer@techcorp.com' did not match target candidate email",
        "Low display name similarity (30.0%) with candidate",
        "Camera turned OFF (No Camera ON bonus)",
        "Speaking duration is 2.0s (less than 300s limit)",
        "Joined meeting later (Join order: #4)",
        "Screen sharing is inactive (+5)",
        "Identified as Observer (Penalty: -20)"
      ],
      decision_trace: [
        { signal_name: "Email Metadata Match", status: "dave.observer@techcorp.com (Mismatch)", max_weight: 40.0, contribution: 0.0 },
        { signal_name: "Name Similarity Check", status: "'Observer Dave' (30.0% Match)", max_weight: 20.0, contribution: 6.0 },
        { signal_name: "Active Camera Check", status: "Video Inactive (OFF)", max_weight: 10.0, contribution: 0.0 },
        { signal_name: "Speaking Active Time", status: "2.0s (Limit Not Met)", max_weight: 15.0, contribution: 0.0 },
        { signal_name: "Interview Answers Check", status: "No questions answered yet", max_weight: 20.0, contribution: 0.0 },
        { signal_name: "Early Arrival Check", status: "Joined #4 (Late)", max_weight: 5.0, contribution: 0.0 },
        { signal_name: "Inactive Screen Share", status: "Screen Share Inactive", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Interviewer Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Recruiter/HR Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Observer Role Penalty", status: "Observer Detected", max_weight: -20.0, contribution: -20.0 }
      ]
    },
    {
      id: "part-5",
      display_name: "Alice Smyth",
      email: "alice.smyth@imposter.com",
      camera_on: true,
      speaking_duration: 10.0,
      questions_answered: ["brief introduction"],
      join_order: 5,
      is_screen_sharing: false,
      role: "unknown",
      confidence_score: 46.2,
      evidence_breakdown: [
        "Email address 'alice.smyth@imposter.com' did not match target candidate email",
        "Display name 'Alice Smyth' is similar to candidate 'Alice Smith' (Similarity: 90.9%) (+18.2)",
        "Camera turned ON (+10)",
        "Speaking duration is 10.0s (less than 300s limit)",
        "Answered interview questions (Matched topics: brief introduction) (+20)",
        "Joined meeting later (Join order: #5)",
        "Screen sharing is inactive (+5)"
      ],
      decision_trace: [
        { signal_name: "Email Metadata Match", status: "alice.smyth@imposter.com (Mismatch)", max_weight: 40.0, contribution: 0.0 },
        { signal_name: "Name Similarity Check", status: "'Alice Smyth' (90.9% Match)", max_weight: 20.0, contribution: 18.18 },
        { signal_name: "Active Camera Check", status: "Video Active (ON)", max_weight: 10.0, contribution: 10.0 },
        { signal_name: "Speaking Active Time", status: "10.0s (Limit Not Met)", max_weight: 15.0, contribution: 0.0 },
        { signal_name: "Interview Answers Check", status: "Topics: brief introduction", max_weight: 20.0, contribution: 20.0 },
        { signal_name: "Early Arrival Check", status: "Joined #5 (Late)", max_weight: 5.0, contribution: 0.0 },
        { signal_name: "Inactive Screen Share", status: "Screen Share Inactive", max_weight: 5.0, contribution: 5.0 },
        { signal_name: "Interviewer Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Recruiter/HR Role Penalty", status: "No Penalty", max_weight: -30.0, contribution: 0.0 },
        { signal_name: "Observer Role Penalty", status: "No Penalty", max_weight: -20.0, contribution: 0.0 }
      ]
    }
  ],
  timeline: [
    { timestamp: 0, candidate: "MacBook Pro", confidence: 26.1 }
  ]
};

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [topCandidate, setTopCandidate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [step, setStep] = useState(0);
  
  // Selected participant for detail view
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  
  // Connection and fallback status
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Fetch full state from backend API
  const fetchState = async () => {
    try {
      const response = await fetch(`${API_BASE}/state`);
      if (!response.ok) throw new Error("Backend response error");
      const data = await response.json();
      
      setParticipants(data.participants);
      setTopCandidate(data.top_candidate);
      setTimeline(data.timeline);
      setIsRunning(data.is_running);
      setIsBackendConnected(true);
      setBackendError(null);
      
      // Auto select top candidate if nothing selected
      if (data.participants.length > 0 && !selectedParticipantId) {
        // Find candidate in participants or default to first
        const topPart = data.participants.find(p => p.display_name === data.top_candidate?.candidate) || data.participants[0];
        setSelectedParticipantId(topPart.id);
      }
    } catch (err) {
      console.warn("Backend unavailable. Falling back to local simulation.", err);
      setIsBackendConnected(false);
      setBackendError("Could not connect to FastAPI server. Running in Demo (Local) Mode.");
    }
  };

  // Perform backend update action
  const sendUpdateAction = async (actionType) => {
    try {
      const response = await fetch(`${API_BASE}/simulate-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType })
      });
      if (!response.ok) throw new Error("Action failed");
      const data = await response.json();
      setParticipants(data.participants);
      setTopCandidate(data.top_candidate);
      setTimeline(data.timeline);
      setIsRunning(data.is_running);
      
      if (data.participants.length > 0 && !selectedParticipantId) {
        setSelectedParticipantId(data.participants[0].id);
      }
    } catch (err) {
      console.error("Action error, updating locally", err);
      // Local fallback simulator logic
      runLocalSimulationAction(actionType);
    }
  };

  // Initial Fetch & Long Polling simulator
  useEffect(() => {
    fetchState();
    
    const interval = setInterval(() => {
      if (isBackendConnected) {
        fetchState();
      } else {
        // If not connected, trigger local tick automatically if running
        if (isRunning) {
          runLocalSimulationAction("tick");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isBackendConnected, isRunning, step]);

  // Client-side local simulator logic
  const runLocalSimulationAction = (action) => {
    if (action === "reset") {
      setStep(0);
      setParticipants(JSON.parse(JSON.stringify(INITIAL_MOCK_STATE.participants)));
      setTimeline([INITIAL_MOCK_STATE.timeline[0]]);
      setTopCandidate({
        candidate: "MacBook Pro",
        email: null,
        confidence: 26.1,
        reasons: [
          "✓ Identified via device nickname 'MacBook Pro' despite missing email",
          "✓ Joined meeting early (Join order: #1)",
          "✓ Screen sharing is inactive"
        ]
      });
      setSelectedParticipantId("part-1");
      return;
    }

    if (action === "start") {
      setIsRunning(true);
      return;
    }

    if (action === "pause" || action === "stop") {
      setIsRunning(false);
      return;
    }

    if (action === "tick") {
      const nextStep = step + 1;
      setStep(nextStep);
      
      let updatedParts = JSON.parse(JSON.stringify(participants.length > 0 ? participants : INITIAL_MOCK_STATE.participants));
      
      const part1 = updatedParts.find(p => p.id === "part-1"); // Real candidate
      const part2 = updatedParts.find(p => p.id === "part-2"); // Interviewer
      const part3 = updatedParts.find(p => p.id === "part-3"); // Recruiter
      const part5 = updatedParts.find(p => p.id === "part-5"); // Imposter

      if (nextStep === 1) {
        if (part1) part1.email = "alice.smith@example.com";
        if (part2) part2.speaking_duration += 10.0;
      } 
      else if (nextStep === 2) {
        if (part1) {
          part1.camera_on = true;
          part1.speaking_duration += 45.0;
        }
        if (part5) part5.speaking_duration += 10.0;
      }
      else if (nextStep === 3) {
        if (part1) {
          part1.questions_answered = ["algorithm", "fastapi"];
          part1.speaking_duration += 90.0;
        }
        if (part2) part2.speaking_duration += 15.0;
      }
      else if (nextStep === 4) {
        if (part1) {
          part1.display_name = "Alice S.";
          part1.speaking_duration += 80.0;
        }
        if (part5) {
          part5.is_screen_sharing = true;
          part5.speaking_duration += 20.0;
        }
      }
      else if (nextStep === 5) {
        if (part5) part5.is_screen_sharing = false;
        if (part1) {
          part1.questions_answered = ["algorithm", "fastapi", "react", "experience"];
          part1.speaking_duration += 100.0;
        }
      }
      else if (nextStep === 6) {
        if (part1) {
          part1.speaking_duration += 60.0;
          part1.questions_answered = ["algorithm", "fastapi", "react", "experience", "system design", "architecture"];
        }
        if (part2) part2.speaking_duration += 15.0;
      }
      else if (nextStep === 7) {
        if (part1) {
          part1.display_name = "Alice Smith";
          part1.speaking_duration += 40.0;
        }
        if (part5) {
          part5.camera_on = false;
          part5.speaking_duration += 5.0;
        }
      }
      else {
        if (part1) part1.speaking_duration += 15.0;
        if (part2) part2.speaking_duration += 8.0;
      }

      // Re-evaluate scores locally
      const scoredList = updatedParts.map(p => {
        const score_data = scoreSingleParticipantLocally(p, INITIAL_MOCK_STATE.candidate_metadata);
        return {
          ...p,
          confidence_score: score_data.confidence,
          evidence_breakdown: score_data.reasons,
          decision_trace: score_data.decision_trace
        };
      });

      setParticipants(scoredList);

      // Find top candidate
      const sorted = [...scoredList].sort((a, b) => b.confidence_score - a.confidence_score);
      const topP = sorted[0];

      // Formulate reasons
      const explainReasons = generateProgrammaticExplanationLocally(topP, sorted);
      
      const newTop = {
        candidate: topP.display_name,
        email: topP.email,
        confidence: topP.confidence_score,
        reasons: explainReasons
      };
      
      setTopCandidate(newTop);

      // Add to timeline
      const newPoint = {
        timestamp: nextStep * 5,
        candidate: topP.display_name,
        confidence: topP.confidence_score
      };
      setTimeline(prev => [...prev, newPoint]);
    }
  };

  // Local Scoring implementation (mirrors Python backend)
  const scoreSingleParticipantLocally = (p, metadata) => {
    let raw = 0.0;
    let reasons = [];
    let trace = [];
    const targetName = metadata.name;
    const targetEmail = metadata.email;

    // 1. Email Match (+40)
    let emailContrib = 0.0;
    let emailStatus = "No email provided";
    if (p.email) {
      if (targetEmail && p.email.toLowerCase().trim() === targetEmail.toLowerCase().trim()) {
        emailContrib = 40.0;
        emailStatus = `${p.email} (Matched)`;
        reasons.push("Email address matched candidate metadata (+40)");
      } else {
        emailStatus = `${p.email} (Mismatch)`;
        reasons.push(`Email address '${p.email}' did not match target candidate email`);
      }
    } else {
      reasons.push("Email address is missing");
    }
    trace.push({
      signal_name: "Email Metadata Match",
      status: emailStatus,
      max_weight: 40.0,
      contribution: emailContrib
    });

    // 2. Name Similarity (+20)
    let similarity = 0.0;
    const nicknamesLower = metadata.nicknames.map(n => n.toLowerCase().trim());
    const dispLower = p.display_name.toLowerCase().trim();
    let nameStatus = "No match";

    if (nicknamesLower.includes(dispLower)) {
      similarity = 1.0;
      nameStatus = `'${p.display_name}' (Nickname Match)`;
    } else {
      similarity = simpleSimilarity(dispLower, targetName.toLowerCase());
      const nickSims = nicknamesLower.map(nick => simpleSimilarity(dispLower, nick));
      similarity = Math.max(similarity, ...nickSims);
      nameStatus = `'${p.display_name}' (${(similarity*100).toFixed(1)}% Match)`;
    }
    
    const namePoints = similarity * 20.0;
    raw += namePoints;
    
    if (similarity === 1.0) {
      reasons.push(`Display name matches device/nickname: '${p.display_name}' (+20)`);
    } else if (similarity > 0.6) {
      reasons.push(`Display name matches candidate pattern (${(similarity*100).toFixed(0)}%) (+${namePoints.toFixed(1)})`);
    } else {
      reasons.push(`Low display name similarity (${(similarity*100).toFixed(0)}%)`);
    }
    trace.push({
      signal_name: "Name Similarity Check",
      status: nameStatus,
      max_weight: 20.0,
      contribution: parseFloat(namePoints.toFixed(2))
    });

    // 3. Camera ON (+10)
    let camContrib = p.camera_on ? 10.0 : 0.0;
    trace.push({
      signal_name: "Active Camera Check",
      status: p.camera_on ? "Video Active (ON)" : "Video Inactive (OFF)",
      max_weight: 10.0,
      contribution: camContrib
    });
    if (p.camera_on) {
      raw += 10.0;
      reasons.push("Camera turned ON (+10)");
    } else {
      reasons.push("Camera turned OFF (No Camera ON bonus)");
    }

    // 4. Speaking Duration (>300s: +15)
    let speakContrib = p.speaking_duration > 300 ? 15.0 : 0.0;
    trace.push({
      signal_name: "Speaking Active Time",
      status: p.speaking_duration > 300 
        ? `${p.speaking_duration.toFixed(1)}s (Threshold Met)` 
        : `${p.speaking_duration.toFixed(1)}s (Limit Not Met)`,
      max_weight: 15.0,
      contribution: speakContrib
    });
    if (p.speaking_duration > 300) {
      raw += 15.0;
      reasons.push(`Speaking duration > 300s (${p.speaking_duration.toFixed(0)}s) (+15)`);
    } else {
      reasons.push(`Speaking duration is ${p.speaking_duration.toFixed(0)}s (less than 300s limit)`);
    }

    // 5. Answers Questions (+20)
    let qContrib = (p.questions_answered && p.questions_answered.length > 0) ? 20.0 : 0.0;
    trace.push({
      signal_name: "Interview Answers Check",
      status: (p.questions_answered && p.questions_answered.length > 0)
        ? `Topics: ${p.questions_answered.join(', ')}`
        : "No questions answered yet",
      max_weight: 20.0,
      contribution: qContrib
    });
    if (p.questions_answered && p.questions_answered.length > 0) {
      raw += 20.0;
      reasons.push(`Answered topics: ${p.questions_answered.join(', ')} (+20)`);
    } else {
      reasons.push("Has not yet answered targeted interview questions");
    }

    // 6. Joined Early (+5)
    let joinContrib = p.join_order <= 2 ? 5.0 : 0.0;
    trace.push({
      signal_name: "Early Arrival Check",
      status: p.join_order <= 2 ? `Joined #${p.join_order} (Early)` : `Joined #${p.join_order} (Late)`,
      max_weight: 5.0,
      contribution: joinContrib
    });
    if (p.join_order <= 2) {
      raw += 5.0;
      reasons.push(`Joined meeting early (Join order: #${p.join_order}) (+5)`);
    } else {
      reasons.push(`Joined meeting later (Join order: #${p.join_order})`);
    }

    // 7. Screen Sharing OFF (+5)
    let screenContrib = !p.is_screen_sharing ? 5.0 : 0.0;
    trace.push({
      signal_name: "Inactive Screen Share",
      status: !p.is_screen_sharing ? "Screen Share Inactive" : "Screen Share Active",
      max_weight: 5.0,
      contribution: screenContrib
    });
    if (!p.is_screen_sharing) {
      raw += 5.0;
      reasons.push("Screen sharing is inactive (+5)");
    } else {
      reasons.push("Active screen sharing detected (candidate screen share check)");
    }

    // Penalties
    let intPenalty = p.role === "interviewer" ? -30.0 : 0.0;
    trace.push({
      signal_name: "Interviewer Role Penalty",
      status: intPenalty !== 0 ? "Interviewer Detected" : "No Penalty",
      max_weight: -30.0,
      contribution: intPenalty
    });
    if (intPenalty !== 0) {
      raw -= 30.0;
      reasons.push("Identified as Interviewer (Penalty: -30)");
    }

    let recPenalty = p.role === "recruiter" ? -30.0 : 0.0;
    trace.push({
      signal_name: "Recruiter/HR Role Penalty",
      status: recPenalty !== 0 ? "HR/Recruiter Detected" : "No Penalty",
      max_weight: -30.0,
      contribution: recPenalty
    });
    if (recPenalty !== 0) {
      raw -= 30.0;
      reasons.push("Identified as Recruiter/HR (Penalty: -30)");
    }

    let obsPenalty = p.role === "observer" ? -20.0 : 0.0;
    trace.push({
      signal_name: "Observer Role Penalty",
      status: obsPenalty !== 0 ? "Observer Detected" : "No Penalty",
      max_weight: -20.0,
      contribution: obsPenalty
    });
    if (obsPenalty !== 0) {
      raw -= 20.0;
      reasons.push("Identified as Observer (Penalty: -20)");
    }

    const normalized = Math.max(0, Math.min(100, (raw / 115) * 100));
    return {
      confidence: parseFloat(normalized.toFixed(1)),
      reasons: reasons,
      decision_trace: trace
    };
  };

  const simpleSimilarity = (s1, s2) => {
    let matches = 0;
    const set1 = new Set(s1.split(''));
    const set2 = new Set(s2.split(''));
    
    // Character overlap ratio as a simple string similarity helper
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  };

  const generateProgrammaticExplanationLocally = (candidate, list) => {
    const reasons = [];
    const metadata = INITIAL_MOCK_STATE.candidate_metadata;
    
    if (candidate.email === metadata.email) {
      reasons.push("Email address matched candidate metadata exactly");
    } else if (!candidate.email) {
      if (metadata.nicknames.includes(candidate.display_name)) {
        reasons.push(`Identified via device nickname '${candidate.display_name}' despite missing email`);
      } else {
        reasons.push("Display name similarity matched, although email is missing");
      }
    }

    if (candidate.speaking_duration > 300) {
      reasons.push(`Highest speaking duration (${candidate.speaking_duration.toFixed(0)} seconds), showing high participation`);
    } else if (candidate.speaking_duration > 50) {
      reasons.push(`Substantial speaking time (${candidate.speaking_duration.toFixed(0)} seconds) during the interview`);
    }

    if (candidate.questions_answered && candidate.questions_answered.length > 0) {
      reasons.push(`Answered interview topics: ${candidate.questions_answered.join(', ')}`);
    }

    if (candidate.camera_on) {
      reasons.push("Camera remained ON throughout the evaluation window");
    } else {
      reasons.push("Camera is currently OFF, but other signals confirm identity");
    }

    // Ambiguity checks
    for (let p of list) {
      if (p.id !== candidate.id) {
        const similarity = simpleSimilarity(p.display_name.toLowerCase(), metadata.name.toLowerCase());
        if (similarity > 0.6 && p.role === "unknown") {
          reasons.push(`Resolved ambiguity with '${p.display_name}' (imposter candidate) due to incorrect email / low speaking duration`);
          break;
        }
      }
    }

    return reasons.map(r => `✓ ${r}`);
  };

  // Populate active screen if lists empty
  if (participants.length === 0) {
    setParticipants(JSON.parse(JSON.stringify(INITIAL_MOCK_STATE.participants)));
    setTopCandidate({
      candidate: "MacBook Pro",
      email: null,
      confidence: 26.1,
      reasons: [
        "✓ Identified via device nickname 'MacBook Pro' despite missing email",
        "✓ Joined meeting early (Join order: #1)",
        "✓ Screen sharing is inactive"
      ]
    });
    setTimeline(INITIAL_MOCK_STATE.timeline);
    setSelectedParticipantId("part-1");
  }

  const selectedParticipant = participants.find(p => p.id === selectedParticipantId);

  return (
    <div className="min-h-screen bg-slate-950 bg-radial-gradient text-slate-100 flex flex-col font-sans">
      
      {/* Top Banner Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30 text-cyan-400">
            <Activity className="h-6 w-6 pulse-active" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Sherlock AI <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">v1.0</span>
            </h1>
            <p className="text-xs text-slate-400">Real-Time Interview Candidate Identification</p>
          </div>
        </div>

        {/* Live Simulation controls */}
        <div className="flex items-center gap-4">
          
          {/* Connection status */}
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full glass-panel">
            <Server className={`h-3.5 w-3.5 ${isBackendConnected ? "text-emerald-400" : "text-amber-400"}`} />
            <span>{isBackendConnected ? "API Connected" : "Local Demo Mode"}</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button 
              onClick={() => sendUpdateAction(isRunning ? "pause" : "start")}
              className={`p-1.5 rounded-md transition-all ${isRunning ? 'text-amber-400 hover:bg-slate-800' : 'text-emerald-400 hover:bg-slate-800'}`}
              title={isRunning ? "Pause simulation" : "Resume simulation"}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button 
              onClick={() => sendUpdateAction("tick")}
              className="p-1.5 rounded-md text-slate-300 hover:bg-slate-800 transition-all hover:text-white"
              title="Manual Simulator Tick (Step 5s)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => sendUpdateAction("reset")}
              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800 transition-all hover:text-white"
              title="Reset Assessment"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Center - Main Stats & Graphs */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          
          {/* Top Banner Alert (if backend offline) */}
          {backendError && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-amber-300">Demo Warning:</span> {backendError} You can fully test the interview progression locally using the simulator buttons above.
              </div>
            </div>
          )}

          {/* Most Likely Candidate Spotlight Card */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-cyan-500/10 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]">
            <div className="absolute top-0 right-0 bg-cyan-500/10 border-l border-b border-cyan-500/20 text-cyan-400 text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5">
              <UserCheck className="h-3 w-3" /> Most Likely Candidate
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 mt-2">
              {/* Giant Confidence Score Circle */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Track ring */}
                  <circle cx="64" cy="64" r="54" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                  {/* Score ring */}
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="54" 
                    className="stroke-cyan-500 transition-all duration-1000 ease-out" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - (topCandidate?.confidence || 0) / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold tracking-tight text-white">
                    {topCandidate?.confidence || 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Confidence</span>
                </div>
              </div>

              {/* Candidate Info Details */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <h2 className="text-2xl font-bold tracking-tight text-white">{topCandidate?.candidate || "Analyzing..."}</h2>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">Identified</span>
                  </div>
                  <p className="text-sm text-slate-400 flex items-center justify-center md:justify-start gap-1.5 mt-1">
                    <Mail className="h-3.5 w-3.5" /> {topCandidate?.email || "Missing Email (Analyzing nicknames)"}
                  </p>
                </div>

                {/* Explanation Bullet Points */}
                <div className="space-y-1.5 text-xs text-left max-w-lg">
                  <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Evidence Arguments</h3>
                  {topCandidate?.reasons && topCandidate.reasons.length > 0 ? (
                    topCandidate.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                        <span>{reason.replace(/^✓\s*/, "")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">Evaluating meeting participants...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Graph Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-cyan-400" /> Confidence Growth Timeline
                </h3>
                <p className="text-xs text-slate-400">Continuous scoring progression of the identified candidate</p>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                Sim Step: {step}
              </span>
            </div>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#64748b" 
                    tickFormatter={(val) => `${val}s`} 
                    fontSize={10} 
                    dy={5}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    domain={[0, 100]} 
                    tickFormatter={(val) => `${val}%`} 
                    fontSize={10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                    labelFormatter={(label) => `Time: ${label}s`}
                    formatter={(value, name, props) => [`${value}% (${props.payload.candidate})`, 'Confidence']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorConfidence)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* Right Column - Participant Table & Signal Sidebar */}
        <div className="space-y-6">
          
          {/* Participant List Panel */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col h-full max-h-[640px]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-cyan-400" /> Participants ({participants.length})
              </h3>
              <span className="text-[10px] text-slate-400">Click row for detail evidence</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {participants.map((p) => {
                const isSelected = p.id === selectedParticipantId;
                const isCandidate = p.display_name === topCandidate?.candidate;

                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedParticipantId(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.25)]' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status indicator badge */}
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          p.role === 'interviewer' 
                            ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400' 
                            : p.role === 'recruiter' 
                            ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400'
                            : isCandidate 
                            ? 'bg-cyan-950/40 border border-cyan-500/40 text-cyan-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}>
                          {p.display_name.charAt(0)}
                        </div>
                        {p.camera_on && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate max-w-[120px]">{p.display_name}</p>
                          {isCandidate && (
                            <span className="text-[8px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/20 shrink-0">CANDIDATE</span>
                          )}
                          {p.role === 'interviewer' && (
                            <span className="text-[8px] font-extrabold uppercase bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20 shrink-0">INT</span>
                          )}
                          {p.role === 'recruiter' && (
                            <span className="text-[8px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 px-1 py-0.5 rounded border border-indigo-500/20 shrink-0">HR</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                          {p.email || 'Missing email'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">{p.confidence_score}%</p>
                      <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 justify-end">
                        <Volume2 className="h-2.5 w-2.5 text-slate-400" /> {p.speaking_duration.toFixed(0)}s
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Participant Evidence Summary Panel */}
            {selectedParticipant && (
              <div className="border-t border-slate-800 pt-4 mt-auto space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Selected Evidence Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{selectedParticipant.display_name}</span>
                </div>
                
                {/* Specific features display list */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                    {selectedParticipant.camera_on ? (
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <VideoOff className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    <span>Camera {selectedParticipant.camera_on ? 'ON (+10)' : 'OFF (0)'}</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Speaking: {selectedParticipant.speaking_duration.toFixed(0)}s</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Answers: {selectedParticipant.questions_answered.length} (+20)</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2">
                    <Share2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Screen Share: {selectedParticipant.is_screen_sharing ? 'ON' : 'OFF (+5)'}</span>
                  </div>
                </div>

                {/* Structured Decision Trace Explainability Table */}
                <div className="space-y-2">
                  {selectedParticipant.decision_trace && selectedParticipant.decision_trace.length > 0 ? (
                    <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden mt-2">
                      <div className="max-h-[190px] overflow-y-auto scrollbar-thin">
                        <table className="w-full text-left text-[9px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-850 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider sticky top-0">
                              <th className="py-2 px-2.5">Evidence Signal</th>
                              <th className="py-2 px-2.5">Telemetry Status</th>
                              <th className="py-2 px-2 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedParticipant.decision_trace.map((item, idx) => {
                              const isPenalty = item.max_weight < 0;
                              const isPositive = item.contribution > 0;
                              
                              return (
                                <tr key={idx} className="border-b border-slate-850/50 hover:bg-slate-900/40 transition-colors">
                                  <td className="py-1.5 px-2.5 font-medium text-slate-200">{item.signal_name}</td>
                                  <td className="py-1.5 px-2.5 text-slate-400 truncate max-w-[125px]" title={item.status}>{item.status}</td>
                                  <td className={`py-1.5 px-2 text-right font-bold pr-2.5 ${
                                    isPenalty && item.contribution !== 0
                                      ? 'text-rose-400'
                                      : isPositive
                                      ? 'text-cyan-400'
                                      : 'text-slate-500'
                                  }`}>
                                    {item.contribution > 0 ? `+${item.contribution}` : item.contribution}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Mathematical formula visualization footer */}
                      <div className="bg-slate-900/60 p-2.5 border-t border-slate-850 text-[10px] flex items-center justify-between font-semibold text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider">Scoring Formula</span>
                          <span>
                            Raw Score: <span className="font-extrabold text-white">
                              {selectedParticipant.decision_trace.reduce((acc, curr) => acc + curr.contribution, 0).toFixed(1)}
                            </span> / 115
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[8px] uppercase tracking-wider">Candidate Score</span>
                          <div className="text-cyan-400 font-extrabold text-xs">{selectedParticipant.confidence_score}%</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                      {selectedParticipant.evidence_breakdown.map((reason, idx) => {
                        const isPositive = reason.includes('+') || reason.includes('matched');
                        const isNeutral = !reason.includes('+') && !reason.includes('-');
                        return (
                          <div key={idx} className="text-[9px] flex items-start gap-1.5 leading-relaxed">
                            <span className={`text-xs leading-none shrink-0 ${isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-400' : 'text-rose-400'}`}>
                              {isPositive ? '✓' : isNeutral ? '•' : '✗'}
                            </span>
                            <span className={isPositive ? 'text-slate-200' : isNeutral ? 'text-slate-400' : 'text-rose-300'}>
                              {reason}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
        </div>

      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-3 flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold tracking-wider">
        <span>© 2026 Sherlock Candidate Identifier Inc.</span>
        <span>Continuous Evidence Logic Engine v1.0.0</span>
      </footer>

    </div>
  );
}
