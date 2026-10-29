import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import Toast from "../components/Toast";
import { HomeSkeleton } from "../components/Skeletons";
import { demoMeetings } from "../data/demoData";
import { meetingService } from "../services/meetingService";
import { useApp } from "../context/AppContext";
import { useGreeting } from "../hooks/useGreeting";
import { useSkeleton } from "../hooks/useSkeleton";
import { useToast } from "../hooks/useToast";
import { useEscape } from "../hooks/useEscape";
import { getProfile } from "../utils/demoState";
import { playTone } from "../utils/feedback";

const fallbackMeetings = [
  {
    id: "project-discussion",
    title: "Project Discussion",
    date: "Today · Dev team",
    time: "10:00 AM",
    duration: "30 min",
    status: "Live now",
    participants: 7,
  },
  {
    id: "project-review",
    title: "Project Review",
    date: "Today · Design team",
    time: "2:00 PM",
    duration: "45 min",
    status: "Upcoming",
    participants: 9,
  },
  {
    id: "interns-session",
    title: "Interns Session",
    date: "Today · Design & Dev",
    time: "4:30 PM",
    duration: "1 hr",
    status: "Upcoming",
    participants: 5,
  },
  {
    id: "standup",
    title: "Standup",
    date: "Tomorrow · Dev team",
    time: "9:30 AM",
    duration: "15 min",
    status: "Upcoming",
    participants: 5,
  },
  {
    id: "frontend-planning",
    title: "Frontend Planning",
    date: "Fri, 23 Oct · Dev Team",
    time: "11:00 AM",
    duration: "1 hr 30 min",
    status: "Ended",
    participants: 8,
  },
];
const TODAY_STATIC = [
  {
    id: "s1",
    title: "Project Discussion",
    range: "10:00 – 10:30 AM",
    color: "orange",
  },
  { id: "s2", title: "Project Review", range: "2:00 – 2:45 PM", color: "teal" },
  {
    id: "s3",
    title: "Interns Session",
    range: "4:30 – 5:30 PM",
    color: "purple",
  },
];
const SCHEDULED_KEY = "euodoo.scheduled.v1";
function loadScheduled() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || "[]");
    const todayKey = keyOf(new Date());
    return saved.filter((s) => !s.dateKey || s.dateKey >= todayKey);
  } catch {
    return [];
  }
}
function saveScheduled(items) {
  try {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(items));
  } catch { }
}

const DURATIONS = [15, 30, 45, 60, 90];
const COLORS = ["orange", "teal", "purple"];
const PARTICIPANT_PRESETS = [
  [
    { initials: "SN", color: "teal" },
    { initials: "SB", color: "orange" },
    { initials: "DS", color: "blue" },
  ],
  [
    { initials: "DS", color: "blue" },
    { initials: "SN", color: "teal" },
    { initials: "SB", color: "orange" },
  ],
  [
    { initials: "SB", color: "orange" },
    { initials: "RK", color: "purple" },
    { initials: "SN", color: "teal" },
  ],
];

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (d) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const durLabel = (m) =>
  m < 60
    ? `${m} min`
    : m % 60 === 0
      ? `${m / 60} hr`
      : `${Math.floor(m / 60)} hr ${m % 60} min`;
const isEnded = (s) => s === "Ended" || s === "Completed";

const CallRow = memo(function CallRow({ meeting, index, onOpen }) {
  const tone = COLORS[index % 3];
  const ended = isEnded(meeting.status);
  const avatars = PARTICIPANT_PRESETS[index % PARTICIPANT_PRESETS.length];
  const extra = Math.max(1, (meeting.participants || 4) - avatars.length);

  return (
    <article className="em-call-row" style={{ "--i": index }}>
      <span className={`em-call-icon ${tone}`}>
        <Video size={17} />
      </span>
      <div className="em-call-details">
        <b>{meeting.title}</b>
        <small>{meeting.date}</small>
      </div>
      <div className="em-participant-stack" aria-label="Meeting participants">
        {avatars.map((p, i) => (
          <span
            key={i}
            className={`em-participant-avatar em-avatar-${p.color}`}
            title={p.initials}
          >
            {p.initials}
          </span>
        ))}
        <span className="em-participant-count">+{extra}</span>
      </div>
      <div className="em-call-time">
        <b>{meeting.time}</b>
        <small>{meeting.duration || "30 min"}</small>
      </div>
      <span
        className={`em-status ${meeting.status === "Live now" ? "live" : ended ? "ended" : ""}`}
      >
        {meeting.status || "Upcoming"}
      </span>
      <button
        className={`em-row-action ${ended ? "outline" : ""}`}
        onClick={() => onOpen(meeting)}
      >
        {ended ? "Details" : "Join"}
      </button>
    </article>
  );
});

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [profile, setProfile] = useState(() => getProfile(user));
  useEffect(() => {
    const refresh = () => setProfile(getProfile(user));
    refresh();
    window.addEventListener("euodoo-profile-updated", refresh);
    return () => window.removeEventListener("euodoo-profile-updated", refresh);
  }, [user]);

  const greeting = useGreeting();
  const loading = useSkeleton(600);
  const { toast, show, hide } = useToast();

  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState("instant");
  const [title, setTitle] = useState("");
  const [form, setForm] = useState({ date: "", time: "", duration: 30 });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [scheduled, setScheduled] = useState(loadScheduled);

  const [tab, setTab] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const today = useMemo(() => new Date(), []);
  const todayKey = keyOf(today);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const closeModals = () => {
    setShowCreate(false);
    setCreated(null);
  };
  useEscape(showCreate || !!created, closeModals);

  const baseMeetings = useMemo(() => {
    if (!Array.isArray(demoMeetings) || !demoMeetings.length)
      return fallbackMeetings;
    return demoMeetings.map((m, i) => {
      const f = fallbackMeetings[i % fallbackMeetings.length];
      return { ...f, ...m, time: m.time || f.time, date: m.date || f.date };
    });
  }, []);

  const meetings = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    return [...scheduled, ...baseMeetings].filter((m) => {
      if (!`${m.title || ""} ${m.date || ""}`.toLowerCase().includes(q))
        return false;
      if (tab === "Recent") return isEnded(m.status);
      if (tab === "Missed") return m.status === "Missed";
      return !isEnded(m.status) && m.status !== "Missed";
    });
  }, [deferredSearch, tab, baseMeetings, scheduled]);

  // Calendar
  const calendarDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );
  const monthTitle = calendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = calendarDate.getDay();
  const onToday = monthOffset === 0 && selectedKey === todayKey;

  const scheduledDateMap = useMemo(() => {
    const map = new Map();
    // Today's meetings (TODAY_STATIC + any user-created meetings for today)
    const forToday = [
      ...TODAY_STATIC,
      ...scheduled.filter((s) => s.dateKey === todayKey),
    ];
    if (forToday.length > 0) {
      map.set(todayKey, forToday);
    }
    // Meetings on other days
    scheduled.forEach((s) => {
      if (!s.dateKey || s.dateKey === todayKey) return;
      const list = map.get(s.dateKey) || [];
      map.set(s.dateKey, [...list, s]);
    });
    return map;
  }, [scheduled, todayKey]);

  // The right-side schedule is intentionally limited to today's meetings.
  const dayItems = useMemo(
    () => scheduledDateMap.get(selectedKey) || [],
    [scheduledDateMap, selectedKey],
  );

  const scheduleTitle = "Today's schedule";

  function goToToday() {
    setMonthOffset(0);
    setSelectedKey(todayKey);
    playTone("pop");
  }

  function openCreate() {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    setForm({ date: keyOf(d), time: `${pad(d.getHours())}:00`, duration: 30 });
    setMode("instant");
    setTitle("");
    setFormError("");
    setError("");
    setShowCreate(true);
  }
  function switchMode(next) {
    if (next !== mode) {
      setMode(next);
      setFormError("");
      playTone("pop");
    }
  }

  async function submitMeeting(event) {
    event.preventDefault();
    setFormError("");
    const cleanTitle = title.trim();
    try {
      if (mode === "instant") {
        setSubmitting(true);

        const meeting = await meetingService.createMeeting({
          title: cleanTitle || "Quick meeting",
          hostName: user?.name,
        });

        const now = new Date();
        const end = new Date(now.getTime() + 30 * 60000);
        setScheduled((list) => {
          const next = [
            {
              id: meeting.meetingId,
              meetingId: meeting.meetingId,
              title: cleanTitle || "Quick meeting",
              dateKey: keyOf(now),
              date: "Today · Hosted by you",
              time: fmtTime(now),
              range: `${fmtTime(now)} – ${fmtTime(end)}`,
              duration: "30 min",
              status: "Live now",
              participants: 1,
              isHost: true,
              color: COLORS[list.length % 3],
            },
            ...list,
          ];
          saveScheduled(next);
          return next;
        });

        playTone("confirm");
        setShowCreate(false);
        setCreated({ ...meeting, scheduled: false, whenLabel: "Your meeting is ready" });
        return;
      }
      const when = new Date(`${form.date}T${form.time}`);
      if (Number.isNaN(when.getTime()) || when <= new Date()) {
        setFormError("Pick a date and time in the future.");
        playTone("error");
        return;
      }
      setSubmitting(true);
      const finalTitle = cleanTitle || "Scheduled meeting";
      const meeting = await meetingService.createMeeting({
        title: finalTitle,
        hostName: user?.name,
        scheduledFor: when.toISOString(),
        duration: form.duration,
      });
      const end = new Date(when.getTime() + form.duration * 60000);
      setScheduled((list) => {
        const next = [
          {
            id: meeting.meetingId,
            meetingId: meeting.meetingId,
            title: finalTitle,
            dateKey: keyOf(when),
            date: `${when.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} · Hosted by you`,
            time: fmtTime(when),
            range: `${fmtTime(when)} – ${fmtTime(end)}`,
            duration: durLabel(form.duration),
            status: "Upcoming",
            participants: 1,
            isHost: true,
            color: COLORS[list.length % 3],
          },
          ...list,
        ];
        saveScheduled(next);
        return next;
      });
      setTab("Upcoming");
      setSelectedKey(keyOf(when));
      setMonthOffset(
        (when.getFullYear() - today.getFullYear()) * 12 +
        when.getMonth() -
        today.getMonth(),
      );
      setShowCreate(false);
      setCreated({
        ...meeting,
        scheduled: true,
        whenLabel: `${when.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} at ${fmtTime(when)}`,
      });
      show("Meeting scheduled");
    } catch (err) {
      setFormError(
        err?.message || "Could not create the meeting. Please try again.",
      );
      playTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function join(event) {
    event.preventDefault();
    setError("");

    if (!joinCode.trim()) {
      setError("Enter a meeting code or link to continue.");
      return;
    }

    setJoining(true);

    try {
      const meeting = await meetingService.joinMeeting(joinCode);

      navigate(`/waiting-room/${encodeURIComponent(meeting.meetingId)}`, {
        state: {
          title: meeting.title || "Quick meeting",
          isHost: false,
        },
      });
    } catch (err) {
      setError(err.message || "Could not find that meeting.");
    } finally {
      setJoining(false);
    }
  }

  async function copyMeetingLink() {
    if (!created?.meetingId) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/meeting/${created.meetingId}`,
      );
      show("Meeting link copied");
    } catch {
      show(`Meeting code: ${created.meetingId}`, "info");
    }
  }

  const openMeeting = (m) =>
    navigate(
      `/meeting/${encodeURIComponent(m.id || m.meetingId || "demo-meeting")}`,
      { state: { title: m.title, isHost: !!m.isHost } },
    );

  return (
    <DashboardLayout page="home" onSearch={setSearch}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <div className="em-dashboard-grid">
          <section className="em-primary-column">
            <div className="em-welcome">
              <h1>
                {greeting}, {(profile.name || user?.name || "there").split(" ")[0]}
              </h1>
            </div>

            <section className="em-action-grid" aria-label="Meeting actions">
              <article className="em-create-card">
                <span className="em-action-icon">
                  <Video size={19} />
                </span>
                <h2>Create meeting</h2>
                <p>Start an instant meeting or schedule one for later.</p>
                <button onClick={openCreate}>
                  <Plus size={15} /> New meeting
                </button>
              </article>
              <article className="em-join-card">
                <span className="em-action-icon">
                  <Link2 size={18} />
                </span>
                <h2>Join meeting</h2>
                <p>Enter a meeting code or paste an invite link.</p>
                <form className="em-join-form" onSubmit={join}>
                  <label className="em-join-input">
                    <Video size={15} />
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="abc-defg-hij"
                      aria-label="Meeting code or link"
                    />
                  </label>
                  <button type="submit" disabled={joining}>
                    {joining ? (
                      <Loader2 size={15} className="em-spin" />
                    ) : (
                      "Join"
                    )}
                  </button>
                </form>
              </article>
            </section>

            {error && (
              <div className="em-inline-error" role="alert">
                <X size={16} />
                {error}
                <button onClick={() => setError("")} aria-label="Dismiss error">
                  <X size={14} />
                </button>
              </div>
            )}

            <section className="em-schedule-card em-home-schedule" aria-label="Today’s schedule">
              <div className="em-schedule-head">
                <div>
                  <h2>Today's schedule</h2>
                  <p className="em-schedule-subtitle">Meetings planned for today</p>
                </div>
                <span>{dayItems.length} meeting{dayItems.length === 1 ? "" : "s"}</span>
              </div>
              {dayItems.length > 0 ? (
                <div className="em-schedule-list">
                  {dayItems.map((item) => (
                    <div className={`em-schedule-item ${item.color || "teal"}`} key={item.id}>
                      <div>
                        <b>{item.title}</b>
                        <small>{item.range || item.time || "Time not set"}</small>
                      </div>
                      <Video size={15} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="em-schedule-empty">
                  ...
                </div>
              )}
            </section>
          </section>

          <aside className="em-right-column">
            <section className="em-calendar-card">
              <div className="em-calendar-heading">
                <div>
                  <h2>{monthTitle}</h2>
                  <p>
                    {monthOffset === 0
                      ? `Today is ${today.toLocaleDateString("en-US", { weekday: "long", day: "numeric" })}`
                      : "Your meeting calendar"}
                  </p>
                </div>
                <div className="em-calendar-arrows">
                  <button
                    type="button"
                    className="em-today-btn"
                    onClick={goToToday}
                    disabled={onToday}
                    aria-label="Go to today"
                  >
                    Today
                  </button>
                  <button
                    aria-label="Previous month"
                    onClick={() => setMonthOffset((v) => v - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Next month"
                    onClick={() => setMonthOffset((v) => v + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div
                className="em-calendar-grid em-calendar-fade"
                key={monthTitle}
              >
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span className="em-weekday" key={d}>
                    {d}
                  </span>
                ))}
                {Array.from({ length: (firstDay + 6) % 7 }, (_, i) => (
                  <span key={`b${i}`} className="em-day muted" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const k = keyOf(
                    new Date(
                      calendarDate.getFullYear(),
                      calendarDate.getMonth(),
                      day,
                    ),
                  );
                  const hasMeeting = Boolean(scheduledDateMap.get(k)?.length);
                  return (
                    <button
                      key={day}
                      className={`em-day ${k === todayKey ? "today" : ""} ${k === selectedKey ? "selected" : ""}`}
                      onClick={() => setSelectedKey(k)}
                      aria-pressed={k === selectedKey}
                      aria-label={`${day} ${monthTitle}`}
                    >
                      {day}
                      {hasMeeting && <i />}
                    </button>
                  );
                })}
              </div>
              <div className="em-calendar-legend">
                <i /> Days with scheduled meetings
              </div>
            </section>


          </aside>
        </div>
      )}

      {showCreate && (
        <div
          className="em-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <section
            className="em-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="em-create-title"
          >
            <button
              className="em-modal-close"
              onClick={() => setShowCreate(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h2 id="em-create-title">New meeting</h2>
            <p>Start right away or plan something for later.</p>

            <div
              className="em-segmented"
              data-mode={mode}
              role="tablist"
              aria-label="Meeting type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "instant"}
                className={mode === "instant" ? "active" : ""}
                onClick={() => switchMode("instant")}
              >
                <Video size={15} /> Start instant
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "schedule"}
                className={mode === "schedule" ? "active" : ""}
                onClick={() => switchMode("schedule")}
              >
                <CalendarClock size={15} /> Schedule for later
              </button>
            </div>

            <form onSubmit={submitMeeting}>
              <label className="em-field">
                Meeting title <span className="em-optional">(optional)</span>
                <input
                  className="em-text-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. Quick sync"
                  autoFocus
                />
              </label>

              <div className="em-mode-panel" key={mode}>
                {mode === "instant" ? (
                  <small className="em-form-hint">
                    We'll create a meeting link you can copy and share. You can
                    join straight away.
                  </small>
                ) : (
                  <>
                    <div className="em-field-row">
                      <label className="em-field">
                        Date
                        <input
                          className="em-text-input"
                          type="date"
                          min={keyOf(new Date())}
                          value={form.date}
                          onChange={(e) =>
                            setForm({ ...form, date: e.target.value })
                          }
                          required
                        />
                      </label>
                      <label className="em-field">
                        Time
                        <input
                          className="em-text-input"
                          type="time"
                          value={form.time}
                          onChange={(e) =>
                            setForm({ ...form, time: e.target.value })
                          }
                          required
                        />
                      </label>
                    </div>
                    <small className="em-form-hint">
                      It will appear in Calls and on your calendar. Share the
                      link whenever you're ready.
                    </small>
                  </>
                )}
              </div>

              {formError && (
                <div className="em-form-error" role="alert">
                  <X size={14} />
                  {formError}
                </div>
              )}
              <div className="em-host-note">
                <ShieldCheck size={18} />
                <span>
                  <b>You're the host</b>
                  <small>You can manage participants in the demo room.</small>
                </span>
              </div>

              <div className="em-modal-actions">
                <button
                  type="button"
                  className="em-button-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="em-button-orange"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 size={16} className="em-spin" />
                  ) : mode === "instant" ? (
                    <Video size={16} />
                  ) : (
                    <CalendarClock size={16} />
                  )}
                  {mode === "instant" ? "Start meeting" : "Schedule meeting"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {created && (
        <div
          className="em-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreated(null);
          }}
        >
          <section
            className="em-modal em-created-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="em-created-title"
          >
            <button
              className="em-modal-close"
              onClick={() => setCreated(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="em-success-mark">
              <Check size={24} />
            </span>
            <p>
              {created.scheduled
                ? `${created.whenLabel}. Share this code with attendees.`
                : "Your meeting is ready. Copy the invite link or share the meeting code."}
            </p>
            <div className="em-code-box">
              <b>{created.meetingId}</b>
              <button onClick={copyMeetingLink} aria-label="Copy meeting link">
                Copy link
              </button>
            </div>
            <button
              type="button"
              className="em-button-primary"
              onClick={() => {
                if (!created?.meetingId) return;

                const meeting = created;

                setCreated(null);

                navigate(`/meeting/${encodeURIComponent(meeting.meetingId)}`, {
                  replace: false,
                  state: {
                    title: meeting.title || "Quick meeting",
                    isHost: true,
                  },
                });
              }}
            >
              Join meeting
            </button>
            <button className="em-button-secondary" onClick={copyMeetingLink}>
              Copy meeting link
            </button>
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={hide} />
    </DashboardLayout>
  );
}
