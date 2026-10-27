import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera, CameraOff, Check, ChevronDown, Clock3, Copy, Grid2X2, Hand,
  LockKeyhole, MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, Search,
  ShieldCheck, Smile, Subtitles, Users, Video, Volume2, X, UserRoundPlus,
  LayoutPanelLeft, PanelsTopLeft, Settings, CircleHelp, MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./MockMeetingRoom.css";

const DEMO_PEOPLE = [
  { id: "me", name: "Rutuja Kale", initials: "RU", color: "orange", isYou: true, role: "Host", muted: false, cameraOn: false },
  { id: "rs", name: "Rithu Singh", initials: "RS", color: "teal", role: "Participant", muted: false, cameraOn: false },
  { id: "ds", name: "Dawan S", initials: "DS", color: "orange", role: "Participant", muted: false, cameraOn: false },
  { id: "jk", name: "Jhanavi Kumari", initials: "JK", color: "teal", role: "Participant", muted: true, cameraOn: false },
  { id: "aj", name: "Ajay Tomar", initials: "AJ", color: "teal", role: "Participant", muted: false, cameraOn: false, handRaised: true },
  { id: "rk", name: "Roshan Kumar", initials: "RK", color: "orange", role: "Participant", muted: true, cameraOn: false },
];

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
  } catch { /* Sound is optional and must not block controls. */ }
}

function AvatarTile({ person, active, onClick }) {
  return (
    <button type="button" className={`mr-tile mr-${person.color} ${active ? "mr-speaking" : ""}`} onClick={onClick} aria-label={`Focus ${person.name}`}>
      {person.isYou && <span className="mr-tile-badge mr-host-badge">Host</span>}
      {person.handRaised && <span className="mr-tile-badge mr-hand-badge">✋ Raised hand</span>}
      <span className="mr-avatar">{person.initials}</span>
      <span className="mr-tile-name">
        {person.muted && <MicOff size={13} aria-label="Muted" />}
        <span>{person.name}{person.isYou ? " (You)" : ""}</span>
      </span>
      {person.cameraOn && <span className="mr-live-video-label"><Video size={13} /> Camera enabled</span>}
    </button>
  );
}

export default function MockMeetingRoom({
  meetingId = "demo-meeting",
  title = "Project Discussion",
  isHost = false,
  initialParticipants = [],
  onLeave,
  initialNotice = "",
}) {
  const navigate = useNavigate();
  const [people, setPeople] = useState(() => {
    const supplied = Array.isArray(initialParticipants) ? initialParticipants : [];
    const normalized = supplied.map((p, i) => ({
      id: p.id || `person-${i}`,
      name: p.name || p.fullName || `Participant ${i + 1}`,
      initials: p.initials || getInitials(p.name || p.fullName),
      color: p.color || (i % 2 ? "teal" : "orange"),
      role: p.role || (p.isHost ? "Host" : "Participant"),
      isYou: Boolean(p.isYou || p.isCurrentUser),
      muted: Boolean(p.muted),
      cameraOn: Boolean(p.cameraOn),
      handRaised: Boolean(p.handRaised),
    }));
    const hasSelf = normalized.some((p) => p.isYou);
    const base = normalized.length ? normalized : DEMO_PEOPLE;
    return hasSelf ? base : [
      { id: "me", name: "You", initials: "YO", color: "orange", isYou: true, role: isHost ? "Host" : "Participant", muted: false, cameraOn: false },
      ...base.filter((p) => !p.isYou),
    ];
  });
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [view, setView] = useState("grid");
  const [sidebar, setSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("people");
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState([{ id: 1, sender: "Rithu Singh", text: "We will discuss it tomorrow", time: "10:21" }]);
  const [captionOn, setCaptionOn] = useState(true);
  const [captions, setCaptions] = useState("We will discuss it tomorrow");
  const [handRaised, setHandRaised] = useState(false);
  const [recording, setRecording] = useState(true);
  const [recordSeconds, setRecordSeconds] = useState(1491);
  const [elapsed, setElapsed] = useState(0);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(initialNotice);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [hostToolsOpen, setHostToolsOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [reaction, setReaction] = useState("");
  const [shareStream, setShareStream] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const toastTimer = useRef(null);

  const visiblePeople = useMemo(() => people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [people, search]);
  const self = people.find((p) => p.isYou);
  const meetingCode = String(meetingId).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24) || "demo-meeting";

  const notify = useCallback((message, tone = 660) => {
    setToast(message);
    playUiTone(tone);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2500);
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

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    shareStream?.getTracks().forEach((track) => track.stop());
  }, [shareStream]);

  function updateSelf(changes) {
    setPeople((current) => current.map((p) => p.isYou ? { ...p, ...changes } : p));
  }

  async function toggleCamera() {
    if (cameraOn) {
      setCameraOn(false);
      updateSelf({ cameraOn: false });
      notify("Camera turned off", 520);
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not supported in this browser.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraOn(true);
      updateSelf({ cameraOn: true });
      notify("Camera permission granted", 740);
    } catch {
      notify("Camera permission was not granted", 430);
    }
  }

  async function toggleMic() {
    if (muted) {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone is not supported.");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        notify("Microphone permission was not granted", 430);
        return;
      }
    }
    const next = !muted;
    setMuted(next);
    updateSelf({ muted: next });
    notify(next ? "Microphone muted" : "Microphone unmuted", next ? 520 : 740);
  }

  async function toggleShare() {
    if (shareStream) {
      shareStream.getTracks().forEach((track) => track.stop());
      setShareStream(null);
      notify("Screen sharing stopped");
      return;
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing is not supported.");
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getVideoTracks()[0].addEventListener("ended", () => setShareStream(null), { once: true });
      setShareStream(stream);
      notify("You are presenting your screen", 740);
    } catch {
      notify("Screen sharing cancelled or unavailable", 430);
    }
  }

  async function copyInvite() {
    const link = `${window.location.origin}/meeting/${encodeURIComponent(meetingId)}`;
    try {
      await navigator.clipboard.writeText(link);
      notify("Meeting invite link copied", 740);
    } catch {
      notify(`Meeting code: ${meetingCode}`);
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: Date.now(), sender: "You", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setChatText("");
    notify("Message sent", 740);
  }

  function chooseReaction(value) {
    setReaction(value);
    setReactionOpen(false);
    notify(`Reaction ${value} sent`, 740);
    window.setTimeout(() => setReaction(""), 1800);
  }

  function leaveMeeting() {
    setLeaveOpen(false);
    if (onLeave) onLeave();
    else navigate("/");
  }

  function togglePersonMute(id) {
    setPeople((current) => current.map((p) => p.id === id ? { ...p, muted: !p.muted } : p));
    notify("Participant audio state updated (demo)");
  }

  const timeLabel = useMemo(() => {
    const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const secs = (elapsed % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [elapsed]);

  const recordLabel = `${Math.floor(recordSeconds / 60).toString().padStart(2, "0")}:${(recordSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="mr-app">
      <header className="mr-header">
        <div className="mr-brand">
          <button className="mr-logo" onClick={() => navigate("/")} aria-label="Return to dashboard">E</button>
          <div className="mr-brand-copy"><strong>Euodoo Meet</strong><span>Meeting ID: {meetingCode}</span></div>
        </div>
        <div className="mr-encrypted"><LockKeyhole size={14} /> Encrypted</div>
        <div className="mr-header-actions">
          <button className={`mr-record-pill ${recording ? "" : "is-off"}`} onClick={() => { setRecording((value) => !value); notify(recording ? "Recording stopped" : "Recording started", 740); }}>
            <i /> {recording ? "Recording" : "Recording off"} {recording && <span>{recordLabel}</span>}
          </button>
          <div className="mr-view-switch" role="tablist" aria-label="Meeting layout">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><Grid2X2 size={14}/> Grid</button>
            <button className={view === "speaker" ? "active" : ""} onClick={() => setView("speaker")}>Speaker</button>
            <button className={view === "sidebar" ? "active" : ""} onClick={() => setView("sidebar")}><LayoutPanelLeft size={14}/> Sidebar</button>
          </div>
          <button className={`mr-count-pill ${sidebar ? "active" : ""}`} onClick={() => { setSidebar((v) => !v); setSidebarTab("people"); }}><Users size={16}/>{people.length}</button>
        </div>
      </header>

      <main className={`mr-workspace ${sidebar ? "with-sidebar" : ""} ${view === "speaker" ? "speaker-view" : ""} ${view === "sidebar" ? "filmstrip-view" : ""}`}>
        <section className="mr-stage">
          <div className={`mr-grid ${view === "speaker" ? "mr-speaker-grid" : ""} ${view === "sidebar" ? "mr-filmstrip-grid" : ""}`}>
            {(view === "speaker" ? [...people].sort((a, b) => Number(b.isYou) - Number(a.isYou)) : people).map((person, index) => (
              <AvatarTile key={person.id} person={{ ...person, muted: person.isYou ? muted : person.muted, cameraOn: person.isYou ? cameraOn : person.cameraOn, handRaised: person.isYou ? handRaised : person.handRaised }} active={index === 1} onClick={() => { setView("speaker"); notify(`${person.name} is in speaker focus`); }} />
            ))}
          </div>
          {reaction && <div className="mr-floating-reaction" role="status">{reaction}</div>}
          {shareStream && <div className="mr-share-indicator"><MonitorUp size={15}/> Screen sharing is active in this browser</div>}
          {captionOn && <div className="mr-caption-banner"><span className="mr-cc">CC</span><div><strong>{messages[messages.length - 1]?.sender || "Rithu Singh"}</strong><p>{captions || "Live captions will appear here."}</p></div><button onClick={() => setCaptionOn(false)} aria-label="Hide captions"><X size={14}/></button><label><select aria-label="Caption language" defaultValue="English"><option>English</option><option>Hindi</option><option>Telugu</option></select></label></div>}
        </section>

        {sidebar && <aside className="mr-sidebar">
          <div className="mr-sidebar-head"><div><h2>{sidebarTab === "people" ? "People" : "In-meeting chat"} <span>{sidebarTab === "people" ? people.length : messages.length}</span></h2></div><button className="mr-icon-button" onClick={() => setSidebar(false)} aria-label="Close sidebar"><X size={18}/></button></div>
          <div className="mr-sidebar-tabs"><button className={sidebarTab === "people" ? "active" : ""} onClick={() => setSidebarTab("people")}><Users size={15}/> People</button><button className={sidebarTab === "chat" ? "active" : ""} onClick={() => setSidebarTab("chat")}><MessageSquare size={15}/> Chat</button></div>
          {sidebarTab === "people" ? <>
            <label className="mr-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search participants"/></label>
            <p className="mr-section-label">IN THE MEETING</p>
            <div className="mr-people-list">{visiblePeople.map((person) => <div className="mr-person-row" key={person.id}>
              <span className={`mr-mini-avatar mr-${person.color}`}>{person.initials}</span>
              <span className="mr-person-copy"><strong>{person.name}{person.isYou ? " (You)" : ""}</strong><small>{person.isYou ? "You (Host)" : person.handRaised ? "Raised hand" : person.role}</small></span>
              {person.handRaised && <Hand size={15} className="mr-hand-icon"/>}
              <button className="mr-mini-action" onClick={() => togglePersonMute(person.id)} title={person.muted ? "Unmute participant (demo)" : "Mute participant (demo)"}>{person.muted ? <MicOff size={16}/> : <Mic size={16}/>}</button>
              <Video size={16} className="mr-muted-icon"/>
            </div>)}</div>
            <div className="mr-sidebar-footer"><button className="mr-primary-button" onClick={() => { setPeople((current) => current.map((p) => p.isYou ? p : { ...p, muted: true })); notify("Participants muted (demo)"); }}><MicOff size={15}/> Mute all</button><button className="mr-outline-button" onClick={copyInvite}><UserRoundPlus size={15}/> Invite</button></div>
          </> : <>
            <div className="mr-chat-list">{messages.map((message) => <div className="mr-chat-message" key={message.id}><strong>{message.sender}</strong><small>{message.time}</small><p>{message.text}</p></div>)}</div>
            <form className="mr-chat-composer" onSubmit={sendMessage}><input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Send a message..." aria-label="Chat message"/><button type="submit" aria-label="Send message"><MessageSquare size={16}/></button></form>
          </>}
        </aside>}
      </main>

      <footer className="mr-toolbar">
        <div className="mr-connection"><span/> Excellent connection</div>
        <div className="mr-controls">
          <Control icon={muted ? <MicOff/> : <Mic/>} label={muted ? "Unmute" : "Mic"} active={muted} onClick={toggleMic}/>
          <Control icon={cameraOn ? <Camera/> : <CameraOff/>} label={cameraOn ? "Camera on" : "Camera"} active={cameraOn} onClick={toggleCamera}/>
          <Control icon={<MonitorUp/>} label={shareStream ? "Stop share" : "Share screen"} active={Boolean(shareStream)} onClick={toggleShare}/>
          <Control icon={<Subtitles/>} label="Captions" active={captionOn} onClick={() => { setCaptionOn((v) => !v); notify(captionOn ? "Captions hidden" : "Captions enabled"); }}/>
          <div className="mr-control-wrap"><button className={`mr-control ${reactionOpen ? "active" : ""}`} onClick={() => setReactionOpen((v) => !v)} aria-label="Reactions"><Smile/></button><small>Reactions</small>{reactionOpen && <div className="mr-reaction-picker">{["👍", "❤️", "😂", "👏", "🎉", "🤔"].map((item) => <button key={item} onClick={() => chooseReaction(item)}>{item}</button>)}</div>}</div>
          <Control icon={<Hand/>} label={handRaised ? "Lower hand" : "Raise hand"} active={handRaised} onClick={() => { setHandRaised((v) => !v); updateSelf({ handRaised: !handRaised }); notify(handRaised ? "Hand lowered" : "Hand raised", 740); }}/>
          <Control icon={<Clock3/>} label="Waiting room" onClick={() => notify("Waiting room controls are available to the host (demo)")}/>
          <Control icon={<ShieldCheck/>} label="Host tools" active={hostToolsOpen} onClick={() => setHostToolsOpen(true)}/>
          <Control icon={<PanelsTopLeft/>} label="Whiteboard" onClick={() => notify("Whiteboard can be connected to your whiteboard module")}/>
          <Control icon={<Users/>} label="People" active={sidebar && sidebarTab === "people"} onClick={() => { setSidebar((v) => !(v && sidebarTab === "people")); setSidebarTab("people"); }}/>
          <Control icon={<MessageSquare/>} label="Chat" active={sidebar && sidebarTab === "chat"} onClick={() => { setSidebar(true); setSidebarTab("chat"); }}/>
          <Control icon={<Grid2X2/>} label="View" active={view !== "grid"} onClick={() => setView(view === "grid" ? "speaker" : "grid")}/>
        </div>
        <button className="mr-leave-button" onClick={() => setLeaveOpen(true)}><PhoneOff size={17}/> Leave</button>
      </footer>

      {hostToolsOpen && <div className="mr-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setHostToolsOpen(false)}><section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-host-title"><button className="mr-modal-close" onClick={() => setHostToolsOpen(false)} aria-label="Close"><X size={18}/></button><span className="mr-modal-icon"><ShieldCheck size={22}/></span><h2 id="mr-host-title">Host tools</h2><p>Manage the demo meeting controls.</p><button className="mr-modal-row" onClick={() => { setPeople((current) => current.map((p) => p.isYou ? p : { ...p, muted: true })); setHostToolsOpen(false); notify("All participants muted (demo)"); }}><MicOff size={17}/> Mute all participants</button><button className="mr-modal-row" onClick={() => { setRecording((v) => !v); setHostToolsOpen(false); notify(recording ? "Recording stopped" : "Recording started"); }}><CircleHelp size={17}/> {recording ? "Stop recording" : "Start recording"}</button><button className="mr-modal-row" onClick={copyInvite}><Copy size={17}/> Copy meeting invite</button><button className="mr-primary-button mr-modal-done" onClick={() => setHostToolsOpen(false)}>Done</button></section></div>}

      {showSettings && <div className="mr-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowSettings(false)}><section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-settings-title"><button className="mr-modal-close" onClick={() => setShowSettings(false)} aria-label="Close"><X size={18}/></button><span className="mr-modal-icon"><Settings size={22}/></span><h2 id="mr-settings-title">Meeting settings</h2><p>Device controls request browser permissions; live call media needs a meeting service.</p><button className="mr-modal-row" onClick={toggleMic}>{muted ? <Mic size={17}/> : <MicOff size={17}/>} {muted ? "Unmute microphone" : "Mute microphone"}</button><button className="mr-modal-row" onClick={toggleCamera}>{cameraOn ? <CameraOff size={17}/> : <Camera size={17}/>} {cameraOn ? "Turn camera off" : "Turn camera on"}</button><button className="mr-primary-button mr-modal-done" onClick={() => setShowSettings(false)}>Done</button></section></div>}

      {leaveOpen && <div className="mr-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setLeaveOpen(false)}><section className="mr-modal" role="dialog" aria-modal="true" aria-labelledby="mr-leave-title"><button className="mr-modal-close" onClick={() => setLeaveOpen(false)} aria-label="Close"><X size={18}/></button><span className="mr-modal-icon mr-danger-icon"><PhoneOff size={22}/></span><h2 id="mr-leave-title">Leave this meeting?</h2><p>You will return to your Euodoo Meet dashboard.</p><div className="mr-modal-actions"><button className="mr-outline-button" onClick={() => setLeaveOpen(false)}>Stay in meeting</button><button className="mr-leave-button" onClick={leaveMeeting}><PhoneOff size={16}/> Leave meeting</button></div></section></div>}

      {toast && <div className="mr-toast" role="status" aria-live="polite"><Check size={16}/>{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={14}/></button></div>}
      <span className="mr-hidden-time" aria-hidden="true">{timeLabel}</span>
    </div>
  );
}

function Control({ icon, label, active = false, onClick }) {
  return <div className="mr-control-wrap"><button type="button" className={`mr-control ${active ? "active" : ""}`} onClick={onClick} title={label} aria-label={label}>{icon}</button><small>{label}</small></div>;
}
