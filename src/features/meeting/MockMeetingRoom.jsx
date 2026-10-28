import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera, CameraOff, Check, Clock3, Copy, Grid2X2, Hand,
  LockKeyhole, Unlock, MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, Search,
  ShieldCheck, Smile, Subtitles, Users, Video, X, UserRoundPlus,
  LayoutPanelLeft, PanelsTopLeft, Settings, CircleHelp, MoreHorizontal,
  LogOut, Play, Square, UserCheck, Pin, VolumeX, Mail, Share2, Layers, Maximize2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import WhiteboardPanel from "../chat/WhiteboardPanel";
import WaitingRoom from "../waiting-room/WaitingRoom";
import ChatPanel from "../chat/ChatPanel";
import "./MockMeetingRoom.css";

// 6 participants matching the exact reference screenshot
const DEMO_PEOPLE = [
  { id: "me", name: "Rutuja Kale", initials: "RK", color: "orange", isYou: true, role: "Host", muted: false, cameraOn: false, handRaised: false, connection: "good" },
  { id: "rs", name: "Rithu Singh", initials: "RS", color: "teal", role: "Participant", muted: false, cameraOn: false, handRaised: false, connection: "good" },
  { id: "ds", name: "Dawan S", initials: "DS", color: "orange", role: "Participant", muted: false, cameraOn: false, handRaised: false, connection: "good" },
  { id: "jk", name: "Jhanavi Kumari", initials: "JK", color: "teal", role: "Participant", muted: true, cameraOn: false, handRaised: false, connection: "good" },
  { id: "aj", name: "Ajay Tomar", initials: "AJ", color: "teal", role: "Participant", muted: false, cameraOn: false, handRaised: true, connection: "moderate" },
  { id: "rk", name: "Roshan Kumar", initials: "RK", color: "orange", role: "Participant", muted: true, cameraOn: false, handRaised: false, connection: "good" },
];

const INITIAL_WAITING = [
  { id: "wait-1", name: "Kavya Nair", email: "kavya.nair@euodoo.com", initials: "KN", color: "teal", time: "2 min ago", role: "Participant", connection: "good" },
  { id: "wait-2", name: "Vikram Malhotra", email: "vikram.m@euodoo.com", initials: "VM", color: "orange", time: "Just now", role: "Participant", connection: "good" },
];

const INITIAL_MESSAGES = [
  { id: 1, sender: "Dawan S", initials: "DS", color: "orange", text: "Good morning everyone!", time: "10:12" },
  { id: 2, sender: "Ajay Tomar", initials: "AJ", color: "teal", text: "Can we go through the Q3 roadmap first?", time: "10:13" },
  { id: 3, sender: "Rithu Singh", initials: "RS", color: "teal", role: "Host", text: "Sure, I will share my screen in a minute.", time: "10:14" },
  { id: 4, isSystem: true, type: "hand", text: "Ajay Tomar raised a hand", time: "10:15" },
  { id: 5, sender: "You", initials: "RK", color: "orange", isYou: true, text: "We will discuss it tomorrow", time: "10:16" },
  { id: 6, sender: "Jhanavi Kumari", initials: "JK", color: "teal", text: "Sounds good, I will share the notes after the call.", time: "10:17" },
];

function normalizeColor(color, index = 0) {
  if (color === "orange" || color === "teal") return color;
  if (["peach", "rose", "red", "coral"].includes(String(color).toLowerCase())) return "orange";
  if (["mint", "green", "blue", "purple", "primary"].includes(String(color).toLowerCase())) return "teal";
  return index % 2 === 0 ? "orange" : "teal";
}

function getInitials(name = "User") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function playUiTone(frequency = 660) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);
    oscillator.onended = () => context.close().catch(() => {});
  } catch {
    /* Sound is optional and must not block controls. */
  }
}

// Clean connection signal SVG indicator for participants
function SignalBars({ strength = "good", size = 13, className = "" }) {
  const bars = strength === "poor" ? 1 : strength === "moderate" ? 2 : 3;
  const barColor = strength === "poor" ? "#ef4444" : strength === "moderate" ? "#f59e0b" : "#10b981";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={`mr-signal-icon ${className}`}
      aria-label={`Connection: ${strength}`}
      fill="currentColor"
    >
      <rect x="2" y="10" width="2.6" height="4" rx="0.8" opacity={bars >= 1 ? 1 : 0.25} fill={barColor} />
      <rect x="6.7" y="6.5" width="2.6" height="7.5" rx="0.8" opacity={bars >= 2 ? 1 : 0.25} fill={barColor} />
      <rect x="11.4" y="2.5" width="2.6" height="11.5" rx="0.8" opacity={bars >= 3 ? 1 : 0.25} fill={barColor} />
    </svg>
  );
}

// Video Tile signal bars (white with opacity for dark tile backgrounds)
function TileSignalBars({ strength = "good", size = 12 }) {
  const bars = strength === "poor" ? 1 : strength === "moderate" ? 2 : 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className="mr-tile-signal-icon"
      aria-label={`Signal strength: ${strength}`}
      fill="currentColor"
    >
      <rect x="2" y="10" width="2.6" height="4" rx="0.8" opacity={bars >= 1 ? 0.95 : 0.25} />
      <rect x="6.7" y="6.5" width="2.6" height="7.5" rx="0.8" opacity={bars >= 2 ? 0.95 : 0.25} />
      <rect x="11.4" y="2.5" width="2.6" height="11.5" rx="0.8" opacity={bars >= 3 ? 0.95 : 0.25} />
    </svg>
  );
}

// Accessible Toggle Switch component for Host Tools
function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`mr-toggle-switch ${checked ? "is-checked" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
    >
      <span className="mr-toggle-thumb" />
    </button>
  );
}

function AvatarTile({
  person,
  active = false,
  isMainSpeaker = false,
  isFilmstrip = false,
  onClick,
  onOptionsClick,
}) {
  return (
    <div
      className={`mr-tile mr-${person.color} ${active ? "mr-speaking" : ""} ${
        isMainSpeaker ? "mr-main-speaker-tile" : ""
      } ${isFilmstrip ? "mr-filmstrip-tile" : ""}`}
      onClick={onClick}
    >
      {person.isYou && <span className="mr-tile-badge mr-host-badge">Host</span>}
      {person.handRaised && <span className="mr-tile-badge mr-hand-badge">✋ Raised hand</span>}
      {active && isMainSpeaker && (
        <span className="mr-tile-badge mr-active-speaker-badge">Active speaker</span>
      )}

      <span className="mr-avatar">{person.initials}</span>

      <div className="mr-tile-name">
        <TileSignalBars strength={person.connection || "good"} />
        {person.muted && <MicOff size={13} aria-label="Muted" className="mr-tile-mic-off" />}
        <span>
          {person.name}
          {person.isYou ? " (You)" : ""}
        </span>
      </div>

      {person.cameraOn && (
        <span className="mr-live-video-label">
          <Video size={13} /> Camera on
        </span>
      )}

      {onOptionsClick && !isFilmstrip && (
        <button
          type="button"
          className="mr-tile-options-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOptionsClick(person.id, e);
          }}
          aria-label={`Options for ${person.name}`}
        >
          <MoreHorizontal size={14} />
        </button>
      )}
    </div>
  );
}

export default function MockMeetingRoom({
  meetingId = "482-913-207",
  title = "Project Discussion",
  isHost = true,
  initialParticipants = [],
  onLeave,
  initialNotice = "",
}) {
  const navigate = useNavigate();

  // Participant state (defaulting to the 6 people from reference image)
  const [people, setPeople] = useState(() => {
    const userProvided = Array.isArray(initialParticipants) ? initialParticipants.find((p) => p.isYou) : null;
    const selfName = userProvided?.name && userProvided.name !== "You" ? userProvided.name : "Rutuja Kale";
    const selfInitials = userProvided?.initials && userProvided.initials !== "YO" ? userProvided.initials : "RK";

    return DEMO_PEOPLE.map((p) => {
      if (p.isYou) {
        return {
          ...p,
          name: selfName,
          initials: selfInitials,
        };
      }
      return p;
    });
  });

  // Waiting Room list
  const [waitingList, setWaitingList] = useState(INITIAL_WAITING);

  // In-meeting Chat messages
  const [messages, setMessages] = useState(INITIAL_MESSAGES);

  // Microphone and Camera states
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // View state: Grid View | Speaker View | Sidebar View
  const [view, setView] = useState("grid"); // "grid" | "speaker" | "sidebar"

  // Active speaker state
  const [activeSpeakerId, setActiveSpeakerId] = useState("rs"); // default active speaker (Rithu Singh)
  const lastSpeakerManualFocus = useRef(0);

  // Meeting lock status notification for header badge
  const [lockNotice, setLockNotice] = useState(null); // { id: number, locked: boolean, text: string }
  const lockNoticeTimer = useRef(null);

  // Independent panels: 'people', 'chat', or null (opening one NEVER opens the other!)
  const [activeSidePanel, setActiveSidePanel] = useState(null);

  // Interactive Popups & Modals
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [waitingRoomOpen, setWaitingRoomOpen] = useState(false);
  const [hostToolsOpen, setHostToolsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [endMeetingAllOpen, setEndMeetingAllOpen] = useState(false);
  const [recordStartConfirmOpen, setRecordStartConfirmOpen] = useState(false);
  const [recordStopConfirmOpen, setRecordStopConfirmOpen] = useState(false);
  const [breakoutRoomsOpen, setBreakoutRoomsOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reaction, setReaction] = useState("");
  const [participantMenu, setParticipantMenu] = useState(null); // { id, x, y }

  // Host Tools feature toggles
  const [meetingLocked, setMeetingLocked] = useState(false);
  const [allowShareScreen, setAllowShareScreen] = useState(true);
  const [allowUnmute, setAllowUnmute] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [breakoutRoomsActive, setBreakoutRoomsActive] = useState(false);
  const [whiteboardAllowed, setWhiteboardAllowed] = useState(true);

  // Captions & Recording
  const [captionOn, setCaptionOn] = useState(true);
  const [captionLang, setCaptionLang] = useState("English");
  const [captions, setCaptions] = useState("The team is aligned on the 15th November milestone.");
  const [recording, setRecording] = useState(true);
  const [recordSeconds, setRecordSeconds] = useState(1483);
  const [elapsed, setElapsed] = useState(0);

  // Search & Screen share
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(initialNotice);
  const [isLoading, setIsLoading] = useState(true);
  const [shareStream, setShareStream] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const toastTimer = useRef(null);

  // Filter participants in People panel
  const visiblePeople = useMemo(
    () => people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [people, search]
  );

  const self = people.find((p) => p.isYou) || people[0];
  const meetingCode = String(meetingId).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24) || "482-913-207";

  // Active speaker selection
  const activeSpeaker = useMemo(() => {
    return (
      people.find((p) => p.id === activeSpeakerId) ||
      people.find((p) => p.isYou) ||
      people[0]
    );
  }, [people, activeSpeakerId]);

  // Sidebar participants (all participants other than the active speaker)
  const sidebarParticipants = useMemo(() => {
    return people.filter((p) => p.id !== activeSpeaker.id);
  }, [people, activeSpeaker.id]);

  function handleSelectSpeaker(personId, personName) {
    setActiveSpeakerId(personId);
    lastSpeakerManualFocus.current = Date.now();
    notify(`${personName} focused as active speaker`, 740);
  }

  // Active speaker automatic activity simulation (WebRTC audio energy simulation)
  useEffect(() => {
    const interval = window.setInterval(() => {
      // If user recently focused someone manually, pause automatic speaker switching
      if (Date.now() - lastSpeakerManualFocus.current < 14000) return;

      const candidates = people.filter((p) => !p.muted && p.id !== activeSpeakerId);
      if (candidates.length > 0) {
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        setActiveSpeakerId(next.id);
        const quotes = [
          "The team is aligned on the 15th November milestone.",
          "Let's review the API architecture and latency benchmarks.",
          "Sprint velocity increased by 22% this quarter.",
          "I will share the design spec doc in the chat panel.",
        ];
        setCaptions(quotes[Math.floor(Math.random() * quotes.length)]);
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [people, activeSpeakerId]);

  const notify = useCallback((message, tone = 660) => {
    setToast(message);
    playUiTone(tone);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setIsLoading(false), 280);
    return () => window.clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (!initialNotice) return undefined;
    const toneTimer = window.setTimeout(() => playUiTone(740), 80);
    const dismissTimer = window.setTimeout(() => setToast(""), 2800);
    return () => {
      window.clearTimeout(toneTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [initialNotice]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
      if (recording) setRecordSeconds((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      shareStream?.getTracks().forEach((track) => track.stop());
    };
  }, [shareStream]);

  // Synchronize self updates into people state
  function updateSelf(changes) {
    setPeople((current) => current.map((p) => (p.isYou ? { ...p, ...changes } : p)));
  }

  // --- Microphone Mute / Unmute ---
  async function toggleMic() {
    if (muted) {
      // Trying to UNMUTE: attempt device access gracefully, never block UI on hardware error
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.warn("Audio hardware error or permission not granted:", err);
        notify("Microphone hardware unavailable (using demo audio)", 430);
      }
      setMuted(false);
      updateSelf({ muted: false });
      notify("Microphone unmuted", 740);
    } else {
      // Trying to MUTE
      setMuted(true);
      updateSelf({ muted: true });
      notify("Microphone muted", 520);
    }
  }

  // --- Camera Toggle ---
  async function toggleCamera() {
    if (cameraOn) {
      setCameraOn(false);
      updateSelf({ cameraOn: false });
      notify("Camera turned off", 520);
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera not supported.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraOn(true);
      updateSelf({ cameraOn: true });
      notify("Camera turned on", 740);
    } catch {
      // Fallback for demo environments
      setCameraOn(true);
      updateSelf({ cameraOn: true });
      notify("Camera turned on (demo mode)", 740);
    }
  }

  // --- Screen Share Toggle ---
  async function toggleShare() {
    if (!allowShareScreen && !self.isYou) {
      notify("Host has disabled screen sharing for participants", 430);
      return;
    }
    if (shareStream) {
      shareStream.getTracks().forEach((track) => track.stop());
      setShareStream(null);
      notify("Screen sharing stopped");
      return;
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing not supported.");
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getVideoTracks()[0].addEventListener("ended", () => setShareStream(null), { once: true });
      setShareStream(stream);
      notify("You are presenting your screen", 740);
    } catch {
      notify("Screen sharing cancelled or unavailable", 430);
    }
  }

  // --- Invite Copy & Popup ---
  async function copyInviteLink() {
    const link = `${window.location.origin}/meeting/${encodeURIComponent(meetingId)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
      notify("Meeting invite link copied to clipboard", 740);
    } catch {
      notify(`Meeting code: ${meetingCode}`);
    }
  }

  // --- Chat Message Send ---
  function handleSendMessage(text) {
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: "You",
        initials: self.initials || "RK",
        color: self.color || "orange",
        isYou: true,
        text,
        time,
      },
    ]);
    notify("Message sent", 740);
  }

  // --- Reaction Selection ---
  function chooseReaction(val) {
    if (!allowReactions) {
      notify("Host has disabled reactions", 430);
      setReactionOpen(false);
      return;
    }
    setReaction(val);
    setReactionOpen(false);
    notify(`Reaction ${val} sent`, 740);
    window.setTimeout(() => setReaction(""), 1800);
  }

  // --- Leave and End Meeting ---
  function handleLeaveMeeting() {
    setLeaveOpen(false);
    if (onLeave) onLeave();
    else navigate("/", { replace: true, state: { meetingLeft: true } });
  }

  function handleEndMeetingForAll() {
    setEndMeetingAllOpen(false);
    setHostToolsOpen(false);
    notify("Meeting ended for all participants", 520);
    setTimeout(() => {
      if (onLeave) onLeave();
      else navigate("/", { replace: true, state: { meetingEnded: true } });
    }, 450);
  }

  // --- Host: Mute All Participants ---
  function handleMuteAllParticipants() {
    setPeople((current) => current.map((p) => (p.isYou ? p : { ...p, muted: true })));
    notify("All participants muted by host", 740);
  }

  // --- Participant mute toggle ---
  function togglePersonMute(id) {
    setPeople((current) =>
      current.map((p) => {
        if (p.id === id) {
          const next = !p.muted;
          notify(`${p.name} ${next ? "muted" : "unmuted"}`);
          return { ...p, muted: next };
        }
        return p;
      })
    );
  }

  // --- Lock Meeting Toggle & Notification ---
  function handleToggleLockMeeting() {
    const nextLocked = !meetingLocked;
    setMeetingLocked(nextLocked);
    if (lockNoticeTimer.current) window.clearTimeout(lockNoticeTimer.current);
    const noticeId = Date.now();
    setLockNotice({
      id: noticeId,
      locked: nextLocked,
      text: nextLocked ? "Meeting Locked" : "Meeting Unlocked",
    });
    playUiTone(nextLocked ? 520 : 740);
    lockNoticeTimer.current = window.setTimeout(() => {
      setLockNotice(null);
    }, 3800);
  }

  // --- Waiting Room Actions ---
  function handleAdmitParticipant(id) {
    if (meetingLocked) {
      notify("Meeting is locked. Unlock meeting in Host Tools to admit participants.", 430);
      return;
    }
    const person = waitingList.find((p) => p.id === id);
    if (!person) return;
    setWaitingList((current) => current.filter((p) => p.id !== id));
    setPeople((current) => [
      ...current,
      {
        id: person.id,
        name: person.name,
        initials: person.initials,
        color: person.color || "teal",
        role: "Participant",
        muted: true,
        cameraOn: false,
        handRaised: false,
        connection: "good",
      },
    ]);
    notify(`${person.name} admitted to meeting`, 740);
  }

  function handleDenyParticipant(id) {
    const person = waitingList.find((p) => p.id === id);
    setWaitingList((current) => current.filter((p) => p.id !== id));
    if (person) notify(`${person.name} denied entry`, 520);
  }

  function handleAdmitAllWaiting() {
    if (meetingLocked) {
      notify("Meeting is locked. Unlock meeting in Host Tools to admit participants.", 430);
      return;
    }
    const count = waitingList.length;
    const newPeople = waitingList.map((p) => ({
      id: p.id,
      name: p.name,
      initials: p.initials,
      color: p.color || "teal",
      role: "Participant",
      muted: true,
      cameraOn: false,
      handRaised: false,
      connection: "good",
    }));
    setPeople((current) => [...current, ...newPeople]);
    setWaitingList([]);
    notify(`${count} attendees admitted to meeting`, 740);
  }

  // Record toggle with confirmation popups
  function handleRecordButtonClick() {
    if (recording) {
      setRecordStopConfirmOpen(true);
    } else {
      setRecordStartConfirmOpen(true);
    }
  }

  function confirmStartRecording() {
    setRecording(true);
    setRecordStartConfirmOpen(false);
    notify("Recording started", 740);
  }

  function confirmStopRecording() {
    setRecording(false);
    setRecordStopConfirmOpen(false);
    notify("Recording stopped and saved to cloud", 520);
  }

  const recordLabel = `${Math.floor(recordSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(recordSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="mr-app">
      {/* Top Header */}
      <header className="mr-header">
        <div className="mr-brand">
          <button className="mr-logo" onClick={() => navigate("/")} aria-label="Return to dashboard">
            E
          </button>
          <div className="mr-brand-copy">
            <strong>Euodoo Meet</strong>
            <div className="mr-meeting-id-row">
              <span className="mr-meeting-id-text">Meeting ID: {meetingCode}</span>
              {lockNotice && (
                <span
                  key={lockNotice.id}
                  className={`mr-header-lock-badge ${lockNotice.locked ? "is-locked" : "is-unlocked"}`}
                  role="status"
                  aria-live="polite"
                >
                  {lockNotice.locked ? (
                    <LockKeyhole size={11} className="mr-lock-badge-icon" />
                  ) : (
                    <Unlock size={11} className="mr-lock-badge-icon" />
                  )}
                  <span>{lockNotice.text}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mr-encrypted">
          <LockKeyhole size={14} /> Encrypted
        </div>

        <div className="mr-header-actions">
          {/* Recording Pill */}
          <button
            className={`mr-record-pill ${recording ? "" : "is-off"}`}
            onClick={handleRecordButtonClick}
            title={recording ? "Click to stop recording" : "Click to start recording"}
          >
            <i /> {recording ? "REC" : "Recording off"} {recording && <span>{recordLabel}</span>}
          </button>

          {/* View Switch */}
          <div className="mr-view-switch" role="tablist" aria-label="Meeting layout">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => {
                setView("grid");
                notify("Layout switched to Grid View");
              }}
              title="Grid View (all participants)"
            >
              <Grid2X2 size={14} /> Grid
            </button>
            <button
              className={view === "speaker" ? "active" : ""}
              onClick={() => {
                setView("speaker");
                notify("Layout switched to Speaker View");
              }}
              title="Speaker View (active speaker prominent)"
            >
              <Maximize2 size={14} /> Speaker
            </button>
            <button
              className={view === "sidebar" ? "active" : ""}
              onClick={() => {
                setView("sidebar");
                notify("Layout switched to Sidebar View");
              }}
              title="Sidebar View (active speaker + participant sidebar)"
            >
              <LayoutPanelLeft size={14} /> Sidebar
            </button>
          </div>

          {/* People Count Pill: Toggles ONLY People panel */}
          <button
            className={`mr-count-pill ${activeSidePanel === "people" ? "active" : ""}`}
            onClick={() => setActiveSidePanel((v) => (v === "people" ? null : "people"))}
            title="View participants"
          >
            <Users size={16} />
            <span>{people.length} people</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main
        className={`mr-workspace ${activeSidePanel ? "with-sidebar" : ""} ${
          view === "speaker" ? "speaker-view" : ""
        } ${view === "sidebar" ? "sidebar-view-mode" : ""}`}
      >
        <section className="mr-stage">
          {isLoading ? (
            <div className="mr-grid">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="mr-tile-skeleton" key={`skeleton-${index}`} aria-hidden="true">
                  <span className="mr-skeleton-avatar" />
                  <span className="mr-skeleton-label" />
                </div>
              ))}
            </div>
          ) : view === "sidebar" ? (
            /* --- SIDEBAR VIEW: Prominent active speaker on left + vertical scrollable participant sidebar --- */
            <div className="mr-sidebar-layout">
              <div className="mr-main-speaker-container">
                <AvatarTile
                  person={{
                    ...activeSpeaker,
                    muted: activeSpeaker.isYou ? muted : activeSpeaker.muted,
                    cameraOn: activeSpeaker.isYou ? cameraOn : activeSpeaker.cameraOn,
                    handRaised: activeSpeaker.isYou ? handRaised : activeSpeaker.handRaised,
                  }}
                  active={true}
                  isMainSpeaker={true}
                  onClick={() => {}}
                  onOptionsClick={(id, e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setParticipantMenu({ id, x: rect.left, y: rect.bottom + 6 });
                  }}
                />
              </div>

              <aside className="mr-filmstrip-sidebar" aria-label="Meeting participant sidebar">
                <div className="mr-filmstrip-header">
                  <span>Participants ({sidebarParticipants.length})</span>
                </div>
                <div className="mr-filmstrip-scroll">
                  {sidebarParticipants.map((person) => (
                    <div
                      key={person.id}
                      className="mr-filmstrip-item"
                      title={`Click to focus ${person.name} as active speaker`}
                      onClick={() => handleSelectSpeaker(person.id, person.name)}
                    >
                      <AvatarTile
                        person={{
                          ...person,
                          muted: person.isYou ? muted : person.muted,
                          cameraOn: person.isYou ? cameraOn : person.cameraOn,
                          handRaised: person.isYou ? handRaised : person.handRaised,
                        }}
                        active={person.id === activeSpeaker.id}
                        isFilmstrip={true}
                        onClick={() => handleSelectSpeaker(person.id, person.name)}
                        onOptionsClick={(id, e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setParticipantMenu({ id, x: rect.left, y: rect.bottom + 6 });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : view === "speaker" ? (
            /* --- SPEAKER VIEW: Prominent full stage speaker --- */
            <div className="mr-speaker-full-layout">
              <AvatarTile
                person={{
                  ...activeSpeaker,
                  muted: activeSpeaker.isYou ? muted : activeSpeaker.muted,
                  cameraOn: activeSpeaker.isYou ? cameraOn : activeSpeaker.cameraOn,
                  handRaised: activeSpeaker.isYou ? handRaised : activeSpeaker.handRaised,
                }}
                active={true}
                isMainSpeaker={true}
                onClick={() => {}}
                onOptionsClick={(id, e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setParticipantMenu({ id, x: rect.left, y: rect.bottom + 6 });
                }}
              />
            </div>
          ) : (
            /* --- GRID VIEW: 3x2 Grid of all participants --- */
            <div className="mr-grid">
              {people.map((person) => (
                <AvatarTile
                  key={person.id}
                  person={{
                    ...person,
                    muted: person.isYou ? muted : person.muted,
                    cameraOn: person.isYou ? cameraOn : person.cameraOn,
                    handRaised: person.isYou ? handRaised : person.handRaised,
                  }}
                  active={person.id === activeSpeaker.id}
                  onClick={() => handleSelectSpeaker(person.id, person.name)}
                  onOptionsClick={(id, e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setParticipantMenu({ id, x: rect.left, y: rect.bottom + 6 });
                  }}
                />
              ))}
            </div>
          )}

          {/* Floating Reaction */}
          {reaction && (
            <div className="mr-floating-reaction" role="status">
              {reaction}
            </div>
          )}

          {/* Screen Share Indicator */}
          {shareStream && (
            <div className="mr-share-indicator">
              <MonitorUp size={15} /> You are presenting your screen to the meeting
            </div>
          )}

          {/* Live Captions Banner */}
          {captionOn && (
            <div className="mr-caption-banner">
              <span className="mr-cc">CC</span>
              <div>
                <strong>Dawan S</strong>
                <p>{captions}</p>
              </div>
              <button onClick={() => setCaptionOn(false)} aria-label="Hide captions">
                <X size={14} />
              </button>
              <label>
                <select
                  aria-label="Caption language"
                  value={captionLang}
                  onChange={(e) => {
                    setCaptionLang(e.target.value);
                    notify(`Captions set to ${e.target.value}`);
                  }}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </label>
            </div>
          )}
        </section>

        {/* --- People Panel (Reference Image Exact Design) --- */}
        {activeSidePanel === "people" && (
          <aside className="mr-sidebar mr-people-sidebar" aria-label="Participants">
            {/* Header */}
            <div className="mr-sidebar-head">
              <div className="mr-people-head-title">
                <h2>
                  People <span className="mr-people-badge-pill">{people.length}</span>
                </h2>
              </div>
              <button
                type="button"
                className="mr-icon-button"
                onClick={() => setActiveSidePanel(null)}
                aria-label="Close people panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Field */}
            <label className="mr-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search participants"
                aria-label="Search participants"
              />
            </label>

            {/* Section Header */}
            <p className="mr-section-label">IN THE MEETING</p>

            {/* Participant Vertical List */}
            <div className="mr-people-list">
              {visiblePeople.map((person) => {
                const isPersonMuted = person.isYou ? muted : person.muted;
                const isPersonCameraOn = person.isYou ? cameraOn : person.cameraOn;
                const isPersonHandRaised = person.isYou ? handRaised : person.handRaised;

                return (
                  <div className="mr-person-row" key={person.id}>
                    {/* Circular Avatar */}
                    <span className={`mr-mini-avatar mr-${person.color}`}>{person.initials}</span>

                    {/* Participant Details */}
                    <div className="mr-person-copy">
                      <div className="mr-person-name-row">
                        <strong>
                          {person.name}
                          {person.isYou ? " (You)" : " (Sample)"}
                        </strong>
                        {person.role === "Host" && <span className="mr-host-inline-tag">Host</span>}
                      </div>
                      <small className={isPersonHandRaised ? "mr-status-raised" : ""}>
                        {person.isYou
                          ? "You (Host)"
                          : isPersonHandRaised
                          ? "Raised hand"
                          : person.role || "Participant"}
                      </small>
                    </div>

                    {/* Status Icons on Right */}
                    <div className="mr-person-actions-right">
                      {/* Raised Hand indicator */}
                      {isPersonHandRaised && (
                        <span className="mr-hand-icon-wrap" title="Raised hand">
                          <Hand size={15} className="mr-hand-icon" />
                        </span>
                      )}

                      {/* Connection Signal SVG */}
                      <SignalBars
                        strength={person.connection || "good"}
                        size={13}
                        className="mr-people-signal"
                      />

                      {/* Microphone SVG */}
                      <button
                        type="button"
                        className={`mr-mini-action ${isPersonMuted ? "is-muted" : ""}`}
                        onClick={() =>
                          person.isYou ? toggleMic() : togglePersonMute(person.id)
                        }
                        title={isPersonMuted ? "Unmute microphone" : "Mute microphone"}
                      >
                        {isPersonMuted ? (
                          <MicOff size={16} className="mr-mic-off-svg" />
                        ) : (
                          <Mic size={16} className="mr-mic-svg" />
                        )}
                      </button>

                      {/* Camera SVG */}
                      <span
                        className={`mr-mini-camera ${isPersonCameraOn ? "is-active" : "is-off"}`}
                        title={isPersonCameraOn ? "Camera on" : "Camera off"}
                      >
                        {isPersonCameraOn ? (
                          <Camera size={16} />
                        ) : (
                          <CameraOff size={16} className="mr-camera-off-svg" />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions: Mute All & Invite */}
            <div className="mr-sidebar-footer">
              <button
                type="button"
                className="mr-primary-button mr-mute-all-btn"
                onClick={handleMuteAllParticipants}
              >
                <MicOff size={15} /> Mute all
              </button>
              <button
                type="button"
                className="mr-outline-button mr-invite-pill-btn"
                onClick={() => setInviteOpen(true)}
              >
                <UserRoundPlus size={15} /> Invite
              </button>
            </div>
          </aside>
        )}

        {/* --- Chat Panel (Separate Independent Sidebar) --- */}
        {activeSidePanel === "chat" && (
          <ChatPanel
            isOpen={true}
            messages={messages}
            onSend={handleSendMessage}
            onClose={() => setActiveSidePanel(null)}
          />
        )}
      </main>

      {/* Whiteboard Workspace Panel */}
      <WhiteboardPanel
        isOpen={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
        onNotify={notify}
      />

      {/* Bottom Meeting Toolbar */}
      <footer className="mr-toolbar">
        {/* Notice: "Excellent connection" text is completely removed per prompt requirement! */}
        <div className="mr-controls">
          {/* Microphone Button */}
          <Control
            icon={muted ? <MicOff className="mr-control-muted-icon" /> : <Mic />}
            label={muted ? "Unmute" : "Mic"}
            active={muted}
            danger={muted}
            onClick={toggleMic}
          />

          {/* Camera Button */}
          <Control
            icon={cameraOn ? <Camera /> : <CameraOff />}
            label={cameraOn ? "Camera on" : "Camera"}
            active={cameraOn}
            onClick={toggleCamera}
          />

          {/* Share Screen */}
          <Control
            icon={<MonitorUp />}
            label={shareStream ? "Stop share" : "Share screen"}
            active={Boolean(shareStream)}
            onClick={toggleShare}
          />

          {/* Captions */}
          <Control
            icon={<Subtitles />}
            label="Captions"
            active={captionOn}
            onClick={() => {
              setCaptionOn((v) => !v);
              notify(captionOn ? "Captions hidden" : "Captions enabled");
            }}
          />

          {/* Reactions */}
          <div className="mr-control-wrap">
            <button
              type="button"
              className={`mr-control ${reactionOpen ? "active" : ""}`}
              onClick={() => setReactionOpen((v) => !v)}
              aria-label="Reactions"
            >
              <Smile />
            </button>
            <small>Reactions</small>
            {reactionOpen && (
              <div className="mr-reaction-picker">
                {["👍", "❤️", "😂", "👏", "🎉", "🤔"].map((item) => (
                  <button key={item} type="button" onClick={() => chooseReaction(item)}>
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Raise Hand */}
          <Control
            icon={<Hand />}
            label={handRaised ? "Lower hand" : "Raise hand"}
            active={handRaised}
            onClick={() => {
              const next = !handRaised;
              setHandRaised(next);
              updateSelf({ handRaised: next });
              notify(next ? "Hand raised" : "Hand lowered", 740);
            }}
          />

          {/* Waiting Room Button */}
          <div className="mr-control-wrap">
            <button
              type="button"
              className={`mr-control ${waitingRoomOpen ? "active" : ""}`}
              onClick={() => setWaitingRoomOpen(true)}
              aria-label="Waiting room"
              title="Waiting room"
            >
              <Clock3 />
              {waitingList.length > 0 && (
                <span className="mr-control-badge">{waitingList.length}</span>
              )}
            </button>
            <small>Waiting room</small>
          </div>

          {/* Host Tools Button */}
          <Control
            icon={<ShieldCheck />}
            label="Host tools"
            active={hostToolsOpen}
            onClick={() => setHostToolsOpen((v) => !v)}
          />

          {/* Whiteboard Button */}
          <Control
            icon={<PanelsTopLeft />}
            label="Whiteboard"
            active={whiteboardOpen}
            onClick={() => setWhiteboardOpen((v) => !v)}
          />

          {/* People Button: Toggles ONLY People Panel */}
          <Control
            icon={<Users />}
            label="People"
            active={activeSidePanel === "people"}
            onClick={() => setActiveSidePanel((v) => (v === "people" ? null : "people"))}
          />

          {/* Chat Button: Toggles ONLY Chat Panel */}
          <Control
            icon={<MessageSquare />}
            label="Chat"
            active={activeSidePanel === "chat"}
            onClick={() => setActiveSidePanel((v) => (v === "chat" ? null : "chat"))}
          />

          {/* View Toggle */}
          <Control
            icon={view === "sidebar" ? <LayoutPanelLeft /> : view === "speaker" ? <Maximize2 /> : <Grid2X2 />}
            label={view === "grid" ? "View" : view === "sidebar" ? "Sidebar" : "Speaker"}
            active={view !== "grid"}
            onClick={() => {
              const nextView = view === "grid" ? "sidebar" : view === "sidebar" ? "speaker" : "grid";
              setView(nextView);
              notify(
                nextView === "sidebar"
                  ? "Switched to Sidebar View"
                  : nextView === "speaker"
                  ? "Switched to Speaker View"
                  : "Switched to Grid View"
              );
            }}
          />
        </div>

        {/* Leave Button */}
        <button
          type="button"
          className="mr-leave-button"
          onClick={() => setLeaveOpen(true)}
        >
          <PhoneOff size={17} /> Leave
        </button>
      </footer>

      {/* --- Host Tools Floating Panel (Reference Image Exact Design) --- */}
      {hostToolsOpen && (
        <div
          className="mr-host-tools-floating"
          role="dialog"
          aria-modal="false"
          aria-label="Host tools panel"
        >
          {/* Header */}
          <div className="mr-ht-header">
            <div className="mr-ht-title-group">
              <ShieldCheck size={18} className="mr-ht-shield-icon" />
              <strong>Host tools</strong>
            </div>
            <button
              type="button"
              className="mr-ht-close-btn"
              onClick={() => setHostToolsOpen(false)}
              aria-label="Close host tools"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mr-ht-body">
            {/* Section 1: MEETING */}
            <div className="mr-ht-section">
              <span className="mr-ht-section-label">MEETING</span>

              {/* Mute all participants */}
              <button
                type="button"
                className="mr-ht-row mr-ht-action-row"
                onClick={handleMuteAllParticipants}
              >
                <div className="mr-ht-row-left">
                  <MicOff size={17} className="mr-ht-icon" />
                  <span>Mute all participants</span>
                </div>
              </button>

              {/* Lock meeting */}
              <div
                className="mr-ht-row mr-ht-clickable"
                onClick={handleToggleLockMeeting}
              >
                <div className="mr-ht-row-left">
                  {meetingLocked ? (
                    <LockKeyhole size={17} className="mr-ht-icon is-locked-icon" />
                  ) : (
                    <Unlock size={17} className="mr-ht-icon" />
                  )}
                  <span>Lock meeting</span>
                </div>
                <ToggleSwitch
                  checked={meetingLocked}
                  onChange={handleToggleLockMeeting}
                  ariaLabel="Toggle Lock meeting"
                />
              </div>

              {/* Waiting room */}
              <div
                className="mr-ht-row mr-ht-clickable"
                onClick={() => {
                  setWaitingRoomOpen(true);
                  setHostToolsOpen(false);
                }}
              >
                <div className="mr-ht-row-left">
                  <Clock3 size={17} className="mr-ht-icon" />
                  <span>Waiting room</span>
                </div>
                <div className="mr-ht-row-right">
                  {waitingList.length > 0 && (
                    <span className="mr-ht-badge">{waitingList.length} waiting</span>
                  )}
                  <ToggleSwitch
                    checked={true}
                    onChange={() => {
                      setWaitingRoomOpen(true);
                      setHostToolsOpen(false);
                    }}
                    ariaLabel="Open waiting room"
                  />
                </div>
              </div>

              {/* Record meeting */}
              <div className="mr-ht-row">
                <div className="mr-ht-row-left">
                  <span className="mr-ht-rec-dot" />
                  <span>Record meeting</span>
                </div>
                <ToggleSwitch
                  checked={recording}
                  onChange={handleRecordButtonClick}
                  ariaLabel="Toggle Recording"
                />
              </div>
            </div>

            {/* Section 2: ALLOW PARTICIPANTS TO */}
            <div className="mr-ht-section">
              <span className="mr-ht-section-label">ALLOW PARTICIPANTS TO</span>

              {/* Share screen */}
              <div className="mr-ht-row">
                <div className="mr-ht-row-left">
                  <MonitorUp size={17} className="mr-ht-icon" />
                  <span>Share screen</span>
                </div>
                <ToggleSwitch
                  checked={allowShareScreen}
                  onChange={() => {
                    setAllowShareScreen((v) => !v);
                    notify(
                      !allowShareScreen
                        ? "Participants can now share screen"
                        : "Screen sharing disabled for participants"
                    );
                  }}
                  ariaLabel="Allow participants to share screen"
                />
              </div>

              {/* Unmute themselves */}
              <div className="mr-ht-row">
                <div className="mr-ht-row-left">
                  <Mic size={17} className="mr-ht-icon" />
                  <span>Unmute themselves</span>
                </div>
                <ToggleSwitch
                  checked={allowUnmute}
                  onChange={() => {
                    setAllowUnmute((v) => !v);
                    notify(
                      !allowUnmute
                        ? "Participants can now unmute"
                        : "Participants muted and locked"
                    );
                  }}
                  ariaLabel="Allow participants to unmute themselves"
                />
              </div>

              {/* Send reactions */}
              <div className="mr-ht-row">
                <div className="mr-ht-row-left">
                  <Smile size={17} className="mr-ht-icon" />
                  <span>Send reactions</span>
                </div>
                <ToggleSwitch
                  checked={allowReactions}
                  onChange={() => {
                    setAllowReactions((v) => !v);
                    notify(
                      !allowReactions ? "Reactions enabled" : "Reactions disabled"
                    );
                  }}
                  ariaLabel="Allow participants to send reactions"
                />
              </div>

              {/* Breakout rooms */}
              <div
                className="mr-ht-row mr-ht-clickable"
                onClick={() => setBreakoutRoomsOpen(true)}
              >
                <div className="mr-ht-row-left">
                  <Grid2X2 size={17} className="mr-ht-icon" />
                  <span>Breakout rooms</span>
                </div>
                <ToggleSwitch
                  checked={breakoutRoomsActive}
                  onChange={() => {
                    setBreakoutRoomsActive((v) => !v);
                    notify(
                      !breakoutRoomsActive
                        ? "Breakout rooms active"
                        : "Breakout rooms closed"
                    );
                  }}
                  ariaLabel="Toggle Breakout rooms"
                />
              </div>

              {/* Use whiteboard */}
              <div
                className="mr-ht-row mr-ht-clickable"
                onClick={() => {
                  setWhiteboardOpen(true);
                  setHostToolsOpen(false);
                }}
              >
                <div className="mr-ht-row-left">
                  <PanelsTopLeft size={17} className="mr-ht-icon" />
                  <span>Use whiteboard</span>
                  <span className="mr-ht-new-pill">NEW</span>
                </div>
                <ToggleSwitch
                  checked={whiteboardOpen}
                  onChange={() => setWhiteboardOpen((v) => !v)}
                  ariaLabel="Open whiteboard"
                />
              </div>
            </div>

            {/* Bottom: End Meeting for All */}
            <div className="mr-ht-footer">
              <button
                type="button"
                className="mr-ht-end-btn"
                onClick={() => {
                  setHostToolsOpen(false);
                  setEndMeetingAllOpen(true);
                }}
              >
                <PhoneOff size={16} /> End meeting for all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Waiting Room Modal --- */}
      <WaitingRoom
        isOpen={waitingRoomOpen}
        people={waitingList}
        isLocked={meetingLocked}
        onAdmit={handleAdmitParticipant}
        onDeny={handleDenyParticipant}
        onAdmitAll={handleAdmitAllWaiting}
        onClose={() => setWaitingRoomOpen(false)}
      />

      {/* --- Invite Popup Modal --- */}
      {inviteOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setInviteOpen(false)}
        >
          <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-invite-title">
            <button
              className="mr-modal-close"
              onClick={() => setInviteOpen(false)}
              aria-label="Close invite modal"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon">
              <UserRoundPlus size={22} />
            </span>
            <h2 id="mr-invite-title">Invite attendees</h2>
            <p>Share this link or meeting code with colleagues to join this session.</p>

            <div className="mr-invite-box">
              <label>Meeting link</label>
              <div className="mr-invite-copy-row">
                <input
                  readOnly
                  value={`${window.location.origin}/meeting/${encodeURIComponent(meetingId)}`}
                />
                <button
                  type="button"
                  className="mr-primary-button"
                  onClick={copyInviteLink}
                >
                  {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                  {copiedLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mr-invite-box" style={{ marginTop: "12px" }}>
              <label>Meeting ID</label>
              <div className="mr-invite-code-line">
                <code>{meetingCode}</code>
                <button
                  type="button"
                  className="mr-outline-button"
                  onClick={() => {
                    navigator.clipboard.writeText(meetingCode);
                    notify("Meeting ID copied");
                  }}
                >
                  <Copy size={14} /> Copy ID
                </button>
              </div>
            </div>

            <div className="mr-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="mr-outline-button"
                onClick={() => setInviteOpen(false)}
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- Participant Options Dropdown Popover --- */}
      {participantMenu && (
        <div
          className="mr-popover-backdrop"
          onClick={() => setParticipantMenu(null)}
        >
          <div
            className="mr-participant-options-menu"
            style={{
              top: `${Math.min(participantMenu.y, window.innerHeight - 180)}px`,
              left: `${Math.min(participantMenu.x, window.innerWidth - 200)}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const target = people.find((p) => p.id === participantMenu.id);
                notify(`${target?.name || "Participant"} pinned to spotlight`);
                setView("speaker");
                setParticipantMenu(null);
              }}
            >
              <Pin size={15} /> Pin to spotlight
            </button>
            <button
              type="button"
              onClick={() => {
                togglePersonMute(participantMenu.id);
                setParticipantMenu(null);
              }}
            >
              <VolumeX size={15} /> Toggle mute
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                const target = people.find((p) => p.id === participantMenu.id);
                if (target?.isYou) {
                  notify("Host cannot be removed");
                  setParticipantMenu(null);
                  return;
                }
                setPeople((prev) => prev.filter((p) => p.id !== participantMenu.id));
                notify(`${target?.name || "Participant"} removed from meeting`, 520);
                setParticipantMenu(null);
              }}
            >
              <LogOut size={15} /> Remove participant
            </button>
          </div>
        </div>
      )}

      {/* --- Recording Start Confirmation Popup --- */}
      {recordStartConfirmOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setRecordStartConfirmOpen(false)}
        >
          <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-rec-start-title">
            <button
              className="mr-modal-close"
              onClick={() => setRecordStartConfirmOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon">
              <Play size={22} />
            </span>
            <h2 id="mr-rec-start-title">Start recording?</h2>
            <p>
              By starting recording, all meeting attendees will be notified that this video session and in-call chat are being recorded for corporate compliance.
            </p>
            <div className="mr-modal-actions">
              <button
                type="button"
                className="mr-outline-button"
                onClick={() => setRecordStartConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mr-primary-button"
                onClick={confirmStartRecording}
              >
                <Play size={15} /> Start recording
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- Recording Stop Confirmation Popup --- */}
      {recordStopConfirmOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setRecordStopConfirmOpen(false)}
        >
          <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-rec-stop-title">
            <button
              className="mr-modal-close"
              onClick={() => setRecordStopConfirmOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon mr-danger-icon">
              <Square size={22} />
            </span>
            <h2 id="mr-rec-stop-title">Stop recording?</h2>
            <p>
              Are you sure you want to stop recording this meeting? The recorded MP4 file will be processed and saved to your cloud workspace.
            </p>
            <div className="mr-modal-actions">
              <button
                type="button"
                className="mr-outline-button"
                onClick={() => setRecordStopConfirmOpen(false)}
              >
                Continue recording
              </button>
              <button
                type="button"
                className="mr-leave-button"
                onClick={confirmStopRecording}
              >
                <Square size={15} /> Stop recording
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- Breakout Rooms Modal --- */}
      {breakoutRoomsOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setBreakoutRoomsOpen(false)}
        >
          <section className="mr-modal mr-modal-wide" role="dialog" aria-modal="true" aria-labelledby="mr-breakout-title">
            <button
              className="mr-modal-close"
              onClick={() => setBreakoutRoomsOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon">
              <Grid2X2 size={22} />
            </span>
            <h2 id="mr-breakout-title">Breakout rooms</h2>
            <p>Divide participants into smaller interactive groups.</p>
            <div className="mr-breakout-grid">
              <div className="mr-breakout-card">
                <strong>Room 1: Design & UX</strong>
                <small>3 participants (Rutuja, Dawan, Ajay)</small>
              </div>
              <div className="mr-breakout-card">
                <strong>Room 2: Engineering</strong>
                <small>3 participants (Rithu, Jhanavi, Roshan)</small>
              </div>
            </div>
            <div className="mr-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="mr-outline-button"
                onClick={() => setBreakoutRoomsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mr-primary-button"
                onClick={() => {
                  setBreakoutRoomsActive(true);
                  setBreakoutRoomsOpen(false);
                  notify("Breakout rooms started (demo)", 740);
                }}
              >
                Open rooms
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- Leave Meeting Confirmation Popup --- */}
      {leaveOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setLeaveOpen(false)}
        >
          <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-leave-title">
            <button
              className="mr-modal-close"
              onClick={() => setLeaveOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon mr-danger-icon">
              <PhoneOff size={22} />
            </span>
            <h2 id="mr-leave-title">Leave this meeting?</h2>
            <p>You will exit the session and return to your Euodoo Meet dashboard.</p>
            <div className="mr-modal-actions">
              <button
                type="button"
                className="mr-outline-button"
                onClick={() => setLeaveOpen(false)}
              >
                Stay in meeting
              </button>
              <button
                type="button"
                className="mr-leave-button"
                onClick={handleLeaveMeeting}
              >
                <PhoneOff size={16} /> Leave meeting
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- End Meeting for All Confirmation Popup --- */}
      {endMeetingAllOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setEndMeetingAllOpen(false)}
        >
          <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-end-all-title">
            <button
              className="mr-modal-close"
              onClick={() => setEndMeetingAllOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon mr-danger-icon">
              <PhoneOff size={22} />
            </span>
            <h2 id="mr-end-all-title">End meeting for all?</h2>
            <p>
              Are you sure you want to end the meeting for everyone? This will immediately disconnect all {people.length} participants and close the conference room.
            </p>
            <div className="mr-modal-actions">
              <button
                type="button"
                className="mr-outline-button"
                onClick={() => setEndMeetingAllOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mr-leave-button"
                onClick={handleEndMeetingForAll}
              >
                <PhoneOff size={16} /> End meeting for all
              </button>
            </div>
          </section>
        </div>
      )}

      {/* --- Meeting Settings Popup --- */}
      {settingsOpen && (
        <div
          className="mr-modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
        >
          <section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-settings-title">
            <button
              className="mr-modal-close"
              onClick={() => setSettingsOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="mr-modal-icon">
              <Settings size={22} />
            </span>
            <h2 id="mr-settings-title">Meeting settings</h2>
            <p>Configure your audio, camera, and peripheral devices.</p>

            <button className="mr-modal-row" onClick={toggleMic}>
              {muted ? <MicOff size={17} /> : <Mic size={17} />}
              <span>{muted ? "Unmute microphone" : "Mute microphone"}</span>
            </button>

            <button className="mr-modal-row" onClick={toggleCamera}>
              {cameraOn ? <CameraOff size={17} /> : <Camera size={17} />}
              <span>{cameraOn ? "Turn camera off" : "Turn camera on"}</span>
            </button>

            <button
              className="mr-primary-button mr-modal-done"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </button>
          </section>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="mr-toast" role="status" aria-live="polite">
          <Check size={16} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function Control({ icon, label, active = false, danger = false, onClick }) {
  return (
    <div className="mr-control-wrap">
      <button
        type="button"
        className={`mr-control ${active ? "active" : ""} ${danger ? "is-danger" : ""}`}
        onClick={onClick}
        title={label}
        aria-label={label}
      >
        {icon}
      </button>
      <small>{label}</small>
    </div>
  );
}
