import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Info,
  Mic,
  MicOff,
  Sparkles,
  TriangleAlert,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { meetingService } from "../../services/meetingService";
import { useApp } from "../../context/AppContext";
import { playTone } from "../../utils/tones";
import "./waiting-room-page.css";

const initialsFor = (name = "Guest") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();

// getUserMedia only exists on https:// or http://localhost
const mediaOK = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
const constraintFor = (id) => (id ? { deviceId: { exact: id } } : true);

/* ------------------------------------------------------------------ */
/* Hooks                                                              */
/* ------------------------------------------------------------------ */

// Keeps the latest value in a ref so effects don't re-run when callbacks change.
function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function useDevices() {
  const [devices, setDevices] = useState({ mic: [], speaker: [], cam: [] });

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const pick = (kind, fallback) => {
        const seen = new Set();
        return list
          .filter((d) => d.kind === kind && d.deviceId && !seen.has(d.deviceId) && seen.add(d.deviceId))
          .map((d, i) => ({ id: d.deviceId, label: d.label || `${fallback} ${i + 1}` }));
      };
      setDevices({
        mic: pick("audioinput", "Microphone"),
        speaker: pick("audiooutput", "Speaker"),
        cam: pick("videoinput", "Camera"),
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const md = navigator.mediaDevices;
    md?.addEventListener?.("devicechange", refresh);
    return () => md?.removeEventListener?.("devicechange", refresh);
  }, [refresh]);

  return [devices, refresh];
}

// Real microphone + level meter. Bars are updated through refs (no React re-renders).
function useMicLevel({ enabled, deviceId, barsRef, onReady, onError }) {
  const cb = useLatest({ onReady, onError });

  useEffect(() => {
    const bars = barsRef.current;
    if (!enabled) return undefined;

    let cancelled = false;
    let raf = 0;
    let stream;
    let audioCtx;

    (async () => {
      try {
        if (!mediaOK) throw new Error("unsupported");
        stream = await navigator.mediaDevices.getUserMedia({ audio: constraintFor(deviceId) });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cb.current.onReady?.();

        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const els = bars ? Array.from(bars.children) : [];
        let last = 0;

        const tick = (t) => {
          raf = requestAnimationFrame(tick);
          if (t - last < 70) return; // ~14fps is plenty for a meter
          last = t;
          analyser.getByteFrequencyData(data);
          els.forEach((el, i) => {
            const v = data[i * 3 + 1] / 255;
            el.style.height = `${4 + Math.round(v * 12)}px`;
          });
        };
        raf = requestAnimationFrame(tick);
      } catch (err) {
        if (!cancelled) cb.current.onError("mic", err);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close().catch(() => {});
      if (bars) Array.from(bars.children).forEach((el) => { el.style.height = ""; });
    };
  }, [enabled, deviceId, barsRef, cb]);
}

// Real camera preview. Tracks are stopped when switched off (camera light goes out).
function useCamera({ enabled, deviceId, videoRef, onReady, onError }) {
  const [live, setLive] = useState(false);
  const cb = useLatest({ onReady, onError });

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled) {
      setLive(false);
      return undefined;
    }

    let cancelled = false;
    let stream;

    (async () => {
      try {
        if (!mediaOK) throw new Error("unsupported");
        stream = await navigator.mediaDevices.getUserMedia({ video: constraintFor(deviceId) });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setLive(true);
        cb.current.onReady?.();
      } catch (err) {
        if (!cancelled) cb.current.onError("camera", err);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
      setLive(false);
    };
  }, [enabled, deviceId, videoRef, cb]);

  return live;
}

/* ------------------------------------------------------------------ */
/* Small memoised components                                          */
/* ------------------------------------------------------------------ */

const Toast = memo(function Toast({ toast, onClose }) {
  const Icon = toast.type === "success" ? Check : toast.type === "error" ? TriangleAlert : Info;
  return (
    <div className={`em-prejoin-toast is-${toast.type}`} role="status" aria-live="polite">
      <span className="em-toast-icon"><Icon size={15} /></span>
      <span className="em-toast-text">{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={15} /></button>
    </div>
  );
});

// Own state, so the 1-second tick never re-renders the whole page.
const WaitTimer = memo(function WaitTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="em-prejoin-timer">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
});

const DeviceSelect = memo(function DeviceSelect({ icon: Icon, label, options, value, onChange, valueText, emptyText }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value) || options[0];

  return (
    <div className={`em-prejoin-device ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="em-prejoin-device-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={18} />
        <span><small>{label}</small><b>{valueText || selected?.label || "Default"}</b></span>
        <ChevronDown size={16} className="em-chevron" />
      </button>

      {open && (
        <ul className="em-prejoin-menu" role="listbox" aria-label={label}>
          {options.length === 0 && <li className="em-prejoin-menu-empty">{emptyText}</li>}
          {options.map((o) => {
            const active = o.id === selected?.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={active ? "is-active" : ""}
                  onClick={() => { onChange(o.id); setOpen(false); }}
                >
                  <span>{o.label}</span>
                  {active && <Check size={15} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const PeopleList = memo(function PeopleList({ people }) {
  return (
    <>
      <div className="em-prejoin-people-heading">
        <b>In the meeting</b><span>{people.length} {people.length === 1 ? "person" : "people"}</span>
      </div>
      <div className="em-prejoin-people">
        {people.slice(0, 3).map((person, index) => (
          <div className="em-prejoin-person" key={`${person.name}-${index}`}>
            <span className={`em-prejoin-person-avatar ${person.color}`}>{person.initials}</span>
            <span className="em-prejoin-person-name">{person.name}</span>
            {person.role === "Host" && <span className="em-prejoin-host-badge">Host</span>}
            <span className="em-prejoin-person-mic"><Mic size={15} /></span>
          </div>
        ))}
        {people.length > 3 && <div className="em-prejoin-more">+{people.length - 3} more</div>}
      </div>
    </>
  );
});

const PrejoinSkeleton = memo(function PrejoinSkeleton() {
  return (
    <div className="em-prejoin-layout" aria-busy="true" aria-label="Loading meeting">
      <section className="em-prejoin-left">
        <div className="em-skel em-skel-video" />
        <div className="em-prejoin-device-row">
          <div className="em-skel em-skel-device" />
          <div className="em-skel em-skel-device" />
          <div className="em-skel em-skel-device" />
        </div>
      </section>
      <aside className="em-prejoin-side-card">
        <div className="em-skel em-skel-pill" />
        <div className="em-skel em-skel-circle" />
        <div className="em-skel em-skel-line em-w60" />
        <div className="em-skel em-skel-line em-w80" />
        <div className="em-skel em-skel-box" />
        <div className="em-skel em-skel-line em-w40" />
        <div className="em-skel em-skel-row" />
        <div className="em-skel em-skel-btn" />
      </aside>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function WaitingRoomPage() {
  const { meetingId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const [meeting, setMeeting] = useState(null);
  const [participantId, setParticipantId] = useState("");
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [effect, setEffect] = useState("None");
  const [micId, setMicId] = useState("");
  const [camId, setCamId] = useState("");
  const [speakerId, setSpeakerId] = useState("");

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(0);
  const videoRef = useRef(null);
  const barsRef = useRef(null);

  const displayName = user?.name || user?.fullName || user?.email?.split("@")[0] || "Guest";
  const initials = useMemo(() => initialsFor(displayName), [displayName]);
  const title = meeting?.title || location.state?.title || "Team meeting";
  const hostName = meeting?.hostName || "The host";

  /* ---------- notifications (toast + tone) ---------- */
  const notify = useCallback((message, type = "info", tone) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, type });
    if (tone !== false) playTone(tone || type);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  const closeToast = useCallback(() => setToast(null), []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- devices / camera / mic ---------- */
  const [devices, refreshDevices] = useDevices();

  const handleMediaError = useCallback((kind, err) => {
    const what = kind === "mic" ? "microphone" : "camera";
    const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
    const missing = err?.name === "NotFoundError" || err?.name === "OverconstrainedError";
    let message = `Couldn't start your ${what}.`;
    if (denied) message = `Allow ${what} access in your browser to use it.`;
    else if (missing) message = `No ${what} found. Check that it's plugged in.`;
    else if (!mediaOK) message = "Camera and mic need a secure (https) connection.";
    notify(message, "error");
    if (kind === "mic") setMicOn(false);
    else setCameraOn(false);
  }, [notify]);

  useMicLevel({ enabled: micOn, deviceId: micId, barsRef, onReady: refreshDevices, onError: handleMediaError });
  const cameraLive = useCamera({ enabled: cameraOn, deviceId: camId, videoRef, onReady: refreshDevices, onError: handleMediaError });

  const toggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    notify(next ? "Microphone on" : "Microphone muted", "info", next ? "on" : "off");
  }, [micOn, notify]);

  const toggleCamera = useCallback(() => {
    const next = !cameraOn;
    setCameraOn(next);
    notify(next ? "Camera on" : "Camera off", "info", next ? "on" : "off");
  }, [cameraOn, notify]);

  const toggleEffect = useCallback(() => {
    const next = effect === "None" ? "Soft blur" : "None";
    setEffect(next);
    notify(next === "None" ? "Effect removed" : "Soft blur on (demo preview)", "success");
  }, [effect, notify]);

  const chooseMic = useCallback((id) => { setMicId(id); notify("Microphone changed", "success"); }, [notify]);
  const chooseCam = useCallback((id) => { setCamId(id); notify("Camera changed", "success"); }, [notify]);
  const chooseSpeaker = useCallback((id) => {
    setSpeakerId(id);
    notify("Speaker changed. Playing a test sound.", "success", false);
    playTone("test", { sinkId: id });
  }, [notify]);

  /* ---------- join request ---------- */
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
      const savedPerson = savedId ? meetingService.getParticipantStatus(meetingId, savedId) : null;

      if (savedPerson && savedPerson.status !== "denied") {
        id = savedId;
      } else {
        id = meetingService.requestToJoin(meetingId, { name: displayName, email: user?.email || "" });
        sessionStorage.setItem(sessionKey, id);
      }

      setParticipantId(id);
      const unsubscribe = meetingService.subscribe(meetingId, (updatedMeeting) => {
        if (!updatedMeeting) {
          setError("This meeting is no longer available.");
          return;
        }
        setMeeting(updatedMeeting);
        const person = updatedMeeting.participants?.find((item) => item.id === id);
        if (person) setStatus(person.status);
      });

      // Short minimum so the skeleton doesn't flash for a few milliseconds.
      const readyTimer = setTimeout(() => setReady(true), 500);
      return () => { unsubscribe(); clearTimeout(readyTimer); };
    } catch (err) {
      setError(err?.message || "Could not request entry.");
      return undefined;
    }
  }, [meetingId, displayName, user?.email]);

  /* ---------- admitted / denied feedback ---------- */
  useEffect(() => {
    if (status !== "admitted") return undefined;
    notify("You're in! Joining the meeting…", "success", "admitted");
    const timer = setTimeout(() => {
      navigate(`/meeting/${encodeURIComponent(meetingId)}`, {
        replace: true,
        state: { title, isHost: false, admitted: true },
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [status, meetingId, navigate, title, notify]);

  useEffect(() => {
    if (status === "denied") playTone("error");
  }, [status]);

  const cancelRequest = useCallback(() => {
    // Cancel isn't a denial, but the service has no "cancelled" status yet.
    if (participantId) {
      try {
        meetingService.setParticipantStatus(meetingId, participantId, "denied");
      } catch {
        /* meeting may already have ended */
      }
    }
    playTone("off");
    navigate("/", { replace: true });
  }, [participantId, meetingId, navigate]);

  const goHome = useCallback((event) => {
    event?.preventDefault();
    navigate("/");
  }, [navigate]);

  const peopleInMeeting = useMemo(() => [
    { name: hostName, role: "Host", initials: initialsFor(hostName), color: "teal" },
    ...(meeting?.participants || [])
      .filter((person) => person.status === "admitted")
      .map((person, index) => ({
        name: person.name,
        role: "",
        initials: person.initials || initialsFor(person.name),
        color: ["orange", "blue", "purple", "teal"][index % 4],
      })),
  ], [hostName, meeting?.participants]);

  /* ---------- error / denied screen ---------- */
  if (error || status === "denied") {
    return (
      <main className="em-prejoin-shell">
        <header className="em-prejoin-header">
          <a className="em-prejoin-brand" href="/" onClick={goHome}>
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

  const admitted = status === "admitted";
  const cameraStarting = cameraOn && !cameraLive;

  return (
    <main className="em-prejoin-shell">
      {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}

      <header className="em-prejoin-header">
        <a className="em-prejoin-brand" href="/" onClick={goHome}>
          <span className="em-prejoin-brand-mark">E</span><span>Euodoo <b>Meet</b></span>
        </a>
        <div className="em-prejoin-header-right">
          <div className="em-prejoin-user">
            <span className="em-prejoin-user-avatar">{initials}</span>
            <span><b>{displayName}</b><small>{user?.isGuest ? "Guest" : "Signed in"}</small></span>
          </div>
        </div>
      </header>

      {!ready ? (
        <PrejoinSkeleton />
      ) : (
        <div className="em-prejoin-layout em-reveal">
          <section className="em-prejoin-left">
            <div className={`em-prejoin-video ${cameraLive ? "is-camera-on" : ""} ${effect !== "None" ? "has-soft" : ""}`}>
              <video ref={videoRef} className="em-prejoin-video-el" autoPlay muted playsInline />

              <div className="em-prejoin-name-tag">{displayName}</div>
              <div className="em-prejoin-audio-indicator">
                {micOn ? <Mic size={15} /> : <MicOff size={15} />}
                <span ref={barsRef} className={micOn ? "em-audio-bars" : "em-audio-bars is-muted"}><i /><i /><i /><i /></span>
              </div>

              {!cameraLive && (
                <div className="em-prejoin-video-center">
                  <div className="em-prejoin-avatar-large">{initials}</div>
                  {cameraStarting ? (
                    <span className="em-prejoin-starting"><i className="em-prejoin-spinner" /> Starting camera…</span>
                  ) : (
                    <span>Your camera is off</span>
                  )}
                </div>
              )}

              <div className="em-prejoin-controls">
                <button className={`em-prejoin-control ${micOn ? "" : "is-off"}`} onClick={toggleMic} aria-pressed={micOn} aria-label={micOn ? "Mute microphone" : "Turn microphone on"}>
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button className={`em-prejoin-control ${cameraOn ? "" : "is-off"}`} onClick={toggleCamera} aria-pressed={cameraOn} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}>
                  {cameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                </button>
                <button className={`em-prejoin-control ${effect !== "None" ? "is-active" : ""}`} onClick={toggleEffect} aria-pressed={effect !== "None"} aria-label="Toggle video effect">
                  <Sparkles size={19} />
                </button>
              </div>
            </div>

            <div className="em-prejoin-device-row">
              <DeviceSelect
                icon={Mic}
                label="Microphone"
                options={devices.mic}
                value={micId}
                onChange={chooseMic}
                emptyText="Allow microphone access to see devices"
              />
              <DeviceSelect
                icon={Volume2}
                label="Speakers"
                options={devices.speaker}
                value={speakerId}
                onChange={chooseSpeaker}
                valueText={devices.speaker.length ? undefined : "System default"}
                emptyText="Your browser uses the system default speaker"
              />
              <DeviceSelect
                icon={Video}
                label="Camera"
                options={devices.cam}
                value={camId}
                onChange={chooseCam}
                valueText={cameraOn ? undefined : "Camera off"}
                emptyText="Turn on your camera to see available cameras"
              />
            </div>
            {effect !== "None" && <p className="em-prejoin-effect-note">{effect} effect selected (demo preview).</p>}
          </section>

          <aside className="em-prejoin-side-card">
            <div className={`em-prejoin-waiting-pill ${admitted ? "is-admitted" : ""}`}>
              <span />
              {admitted ? "Admitted" : <>Waiting for host <WaitTimer /></>}
            </div>

            <div className={`em-prejoin-round-icon ${admitted ? "is-admitted" : ""}`}>
              {!admitted && <i className="em-prejoin-ring" />}
              {admitted ? <Check size={32} /> : <Video size={28} />}
            </div>

            <h1>{admitted ? "You're in!" : "Waiting to be let in"}</h1>
            <p className="em-prejoin-subtitle">
              {admitted ? <>Joining the meeting now…</> : <>{hostName} will admit you shortly.<br />Please keep this page open.</>}
            </p>

            <div className="em-prejoin-meeting-summary">
              <span className="em-prejoin-summary-icon"><Video size={19} /></span>
              <span><b>{title}</b><small>{meeting?.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString() : "Meeting is live now"}</small></span>
            </div>

            <PeopleList people={peopleInMeeting} />

            <div className="em-prejoin-divider" />
            <button className="em-prejoin-cancel" onClick={cancelRequest} disabled={admitted}>Cancel request</button>
            <button className="em-prejoin-back" onClick={() => navigate("/", { replace: true })}><ArrowLeft size={15} /> Back to dashboard</button>
          </aside>
        </div>
      )}
    </main>
  );
}
