import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  CircleHelp,
  Mic,
  MicOff,
  Sparkles,
  Video,
  Volume2,
} from "lucide-react";
import { meetingService } from "../../services/meetingService";
import { useApp } from "../../context/AppContext";
import "./waiting-room-page.css";

const initialsFor = (name = "Guest") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();

export default function WaitingRoomPage() {
  const { meetingId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const [meeting, setMeeting] = useState(null);
  const [participantId, setParticipantId] = useState("");
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [effect, setEffect] = useState("None");

  const displayName = user?.name || user?.fullName || user?.email?.split("@")[0] || "Guest";
  const initials = useMemo(() => initialsFor(displayName), [displayName]);
  const title = meeting?.title || location.state?.title || "Team meeting";
  const hostName = meeting?.hostName || "The host";

  useEffect(() => {
    let id = "";
    try {
      const existingMeeting = meetingService.getMeeting(meetingId);
      if (!existingMeeting || existingMeeting.status !== "active") {
        setError("This meeting link is invalid or unavailable.");
        return undefined;
      }
      setMeeting(existingMeeting);

      const sessionKey = `euodoo-wait-${meetingId}`;
      const savedId = sessionStorage.getItem(sessionKey);
      const savedPerson = savedId
        ? meetingService.getParticipantStatus(meetingId, savedId)
        : null;

      if (savedPerson && savedPerson.status !== "denied") {
        id = savedId;
      } else {
        id = meetingService.requestToJoin(meetingId, {
          name: displayName,
          email: user?.email || "",
        });
        sessionStorage.setItem(sessionKey, id);
      }

      setParticipantId(id);
      return meetingService.subscribe(meetingId, (updatedMeeting) => {
        if (!updatedMeeting) {
          setError("This meeting is no longer available.");
          return;
        }
        setMeeting(updatedMeeting);
        const person = updatedMeeting.participants?.find((item) => item.id === id);
        if (person) setStatus(person.status);
      });
    } catch (err) {
      setError(err?.message || "Could not request entry.");
      return undefined;
    }
  }, [meetingId, displayName, user?.email]);

  useEffect(() => {
    if (status === "admitted") {
      navigate(`/meeting/${encodeURIComponent(meetingId)}`, {
        replace: true,
        state: { title, isHost: false, admitted: true },
      });
    }
  }, [status, meetingId, navigate, title]);

  const cancelRequest = () => {
    // A cancellation is not a denial. Keep the request record, but mark it as cancelled
    // by using the existing denied state until the service adds a dedicated cancelled status.
    if (participantId) {
      try {
        meetingService.setParticipantStatus(meetingId, participantId, "denied");
      } catch {
        // The meeting may already have ended.
      }
    }
    navigate("/", { replace: true });
  };

  if (error || status === "denied") {
    return (
      <main className="em-prejoin-shell">
        <header className="em-prejoin-header">
          <a className="em-prejoin-brand" href="/" onClick={(event) => { event.preventDefault(); navigate("/"); }}>
            <span className="em-prejoin-brand-mark">E</span><span>Euodoo <b>Meet</b></span>
          </a>
        </header>
        <section className="em-prejoin-error">
          <div className="em-prejoin-error-mark">!</div>
          <h1>{status === "denied" ? "Entry not approved" : "Meeting unavailable"}</h1>
          <p>{status === "denied" ? "The host has denied your request to join this meeting." : error}</p>
          <button className="em-prejoin-primary" onClick={() => navigate("/")}>Back to dashboard</button>
        </section>
      </main>
    );
  }

  const peopleInMeeting = [
    { name: hostName, role: "Host", initials: initialsFor(hostName), color: "teal" },
    ...(meeting?.participants || [])
      .filter((person) => person.status === "admitted")
      .map((person, index) => ({
        name: person.name,
        role: "",
        initials: person.initials || initialsFor(person.name),
        color: ["orange", "blue", "purple", "teal"][index % 4],
      })),
  ];

  return (
    <main className="em-prejoin-shell">
      <header className="em-prejoin-header">
        <a className="em-prejoin-brand" href="/" onClick={(event) => { event.preventDefault(); navigate("/"); }}>
          <span className="em-prejoin-brand-mark">E</span><span>Euodoo <b>Meet</b></span>
        </a>
        <div className="em-prejoin-header-right">
          <button className="em-prejoin-help" type="button" onClick={() => window.alert("Your request is waiting for the meeting host.")}>
            {/* <CircleHelp size={17} /> Need help? */}
          </button>
          <div className="em-prejoin-user">
            <span className="em-prejoin-user-avatar">{initials}</span>
            <span><b>{displayName}</b><small>Signed in</small></span>
          </div>
        </div>
      </header>

      <div className="em-prejoin-layout">
        <section className="em-prejoin-left">
          <div className={`em-prejoin-video ${cameraOn ? "is-camera-on" : ""}`}>
            <div className="em-prejoin-name-tag">{displayName}</div>
            <div className="em-prejoin-audio-indicator">
              {micOn ? <Mic size={15} /> : <MicOff size={15} />}
              <span className={micOn ? "em-audio-bars" : "em-audio-bars is-muted"}><i /><i /><i /><i /></span>
            </div>
            <div className="em-prejoin-video-center">
              {cameraOn ? (
                <div className="em-prejoin-camera-placeholder">
                  <div className="em-prejoin-avatar-large">{initials}</div>
                  <span>Camera preview enabled</span>
                </div>
              ) : (
                <>
                  <div className="em-prejoin-avatar-large">{initials}</div>
                  <span>Your camera is off</span>
                </>
              )}
            </div>
            <div className="em-prejoin-controls">
              <button className={`em-prejoin-control ${micOn ? "" : "is-off"}`} onClick={() => setMicOn((value) => !value)} aria-label={micOn ? "Mute microphone" : "Turn microphone on"}>
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button className={`em-prejoin-control ${cameraOn ? "" : "is-off"}`} onClick={() => setCameraOn((value) => !value)} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}>
                {cameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
              </button>
              <button className="em-prejoin-control" onClick={() => setEffect((value) => value === "None" ? "Soft blur" : "None")} aria-label="Toggle video effect">
                <Sparkles size={19} />
              </button>
            </div>
          </div>

          <div className="em-prejoin-device-row">
            <div className="em-prejoin-device">
              <Mic size={18} /><span><small>Microphone</small><b>Built-in microphone</b></span><ChevronDown size={16} />
            </div>
            <div className="em-prejoin-device">
              <Volume2 size={18} /><span><small>Speakers</small><b>Built-in speakers</b></span><ChevronDown size={16} />
            </div>
            <div className="em-prejoin-device">
              <Video size={18} /><span><small>Camera</small><b>{cameraOn ? "Camera preview on" : "Camera off"}</b></span><ChevronDown size={16} />
            </div>
          </div>
          {effect !== "None" && <p className="em-prejoin-effect-note">{effect} effect selected (demo preview).</p>}
        </section>

        <aside className="em-prejoin-side-card">
          <div className="em-prejoin-waiting-pill"><span /> Waiting for host</div>
          <div className="em-prejoin-round-icon"><Video size={28} /></div>
          <h1>Waiting to be let in</h1>
          <p className="em-prejoin-subtitle">{hostName} will admit you shortly.<br />Please keep this page open.</p>

          <div className="em-prejoin-meeting-summary">
            <span className="em-prejoin-summary-icon"><Video size={19} /></span>
            <span><b>{title}</b><small>{meeting?.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "Meeting is live now"}</small></span>
          </div>

          <div className="em-prejoin-people-heading">
            <b>In the meeting</b><span>{peopleInMeeting.length} {peopleInMeeting.length === 1 ? "person" : "people"}</span>
          </div>
          <div className="em-prejoin-people">
            {peopleInMeeting.slice(0, 3).map((person, index) => (
              <div className="em-prejoin-person" key={`${person.name}-${index}`}>
                <span className={`em-prejoin-person-avatar ${person.color}`}>{person.initials}</span>
                <span className="em-prejoin-person-name">{person.name}</span>
                {person.role === "Host" && <span className="em-prejoin-host-badge">Host</span>}
                <span className="em-prejoin-person-mic"><Mic size={15} /></span>
              </div>
            ))}
            {peopleInMeeting.length > 3 && <div className="em-prejoin-more">+{peopleInMeeting.length - 3} more</div>}
          </div>

          <div className="em-prejoin-divider" />
          <button className="em-prejoin-cancel" onClick={cancelRequest}>Cancel request</button>
          <button className="em-prejoin-back" onClick={() => navigate("/", { replace: true })}><ArrowLeft size={15} /> Back to dashboard</button>
        </aside>
      </div>
    </main>
  );
}
