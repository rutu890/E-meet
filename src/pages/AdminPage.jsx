import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileVideo,
  Filter,
  History,
  PieChart,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminSessionService } from "../services/adminSessionService";
import "./AdminPage.css";

const FILTERS = ["All", "Scheduled", "In progress", "Completed", "Interrupted"];

const initials = (name = "User") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

const dateLabel = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const duration = (start, end) => {
  if (!start) return "—";
  const seconds = Math.max(
    0,
    Math.floor(((end ? new Date(end) : new Date()) - new Date(start)) / 1000)
  );
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const MOCK_SESSIONS = [
  {
    meetingId: "EM-1001",
    title: "Product Team Weekly Sync",
    hostName: "Riya Sharma",
    status: "Completed",
    scheduledStart: "2026-10-27T09:00:00",
    startedAt: "2026-10-27T09:02:00",
    endedAt: "2026-10-27T09:45:00",
    attendees: [
      { id: "p1", name: "Riya Sharma", role: "Host" },
      { id: "p2", name: "Arjun Mehta", role: "Participant" },
      { id: "p3", name: "Priya Shah", role: "Participant" },
      { id: "p4", name: "Aman Verma", role: "Participant" },
    ],
  },
  {
    meetingId: "EM-1002",
    title: "Client Experience Review",
    hostName: "Arjun Mehta",
    status: "In progress",
    scheduledStart: "2026-10-28T10:00:00",
    startedAt: "2026-10-28T10:03:00",
    attendees: [
      { id: "p5", name: "Arjun Mehta", role: "Host" },
      { id: "p6", name: "Neha Rao", role: "Participant" },
      { id: "p7", name: "Karan Patel", role: "Participant" },
    ],
  },
  {
    meetingId: "EM-1003",
    title: "Engineering Sprint Planning",
    hostName: "Priya Shah",
    status: "Scheduled",
    scheduledStart: "2026-10-29T11:00:00",
    attendees: [
      { id: "p8", name: "Priya Shah", role: "Host" },
      { id: "p9", name: "Aman Verma", role: "Participant" },
    ],
  },
  {
    meetingId: "EM-1004",
    title: "Design Handover",
    hostName: "Neha Rao",
    status: "Interrupted",
    scheduledStart: "2026-10-26T14:00:00",
    startedAt: "2026-10-26T14:01:00",
    endedAt: "2026-10-26T14:16:00",
    attendees: [
      { id: "p10", name: "Neha Rao", role: "Host" },
      { id: "p11", name: "Karan Patel", role: "Participant" },
    ],
  },
  {
    meetingId: "EM-1005",
    title: "Marketing Campaign Review",
    hostName: "Aman Verma",
    status: "Completed",
    scheduledStart: "2026-10-25T15:00:00",
    startedAt: "2026-10-25T15:02:00",
    endedAt: "2026-10-25T15:50:00",
    attendees: [
      { id: "p12", name: "Aman Verma", role: "Host" },
      { id: "p13", name: "Riya Sharma", role: "Participant" },
      { id: "p14", name: "Neha Rao", role: "Participant" },
    ],
  },
  {
    meetingId: "EM-1006",
    title: "Customer Support Training",
    hostName: "Karan Patel",
    status: "Completed",
    scheduledStart: "2026-10-24T12:00:00",
    startedAt: "2026-10-24T12:00:00",
    endedAt: "2026-10-24T12:35:00",
    attendees: [
      { id: "p15", name: "Karan Patel", role: "Host" },
      { id: "p16", name: "Priya Shah", role: "Participant" },
    ],
  },
];

const MOCK_ACTIVITY = [
  {
    id: "demo-a1",
    type: "Completed",
    message: "Product Team Weekly Sync ended",
    meetingTitle: "Product Team Weekly Sync",
    actor: "Riya Sharma",
    at: "2026-10-27T09:45:00",
  },
  {
    id: "demo-a2",
    type: "Interrupted",
    message: "Design Handover was interrupted",
    meetingTitle: "Design Handover",
    actor: "Neha Rao",
    at: "2026-10-26T14:16:00",
  },
  {
    id: "demo-a3",
    type: "Created",
    message: "Engineering Sprint Planning scheduled",
    meetingTitle: "Engineering Sprint Planning",
    actor: "Priya Shah",
    at: "2026-10-25T16:10:00",
  },
];

function playNotificationTone() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.018, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => context.close().catch(() => {});
  } catch {
    // Audio can be unavailable or blocked by browser settings.
  }
}

const Skeleton = memo(function Skeleton() {
  return (
    <main className="ad-skeleton-page" role="status" aria-label="Loading admin dashboard">
      <div className="ad-skeleton-title" />
      <div className="ad-stat-grid">
        {[1, 2, 3, 4].map((item) => <div className="ad-skeleton-stat" key={item} />)}
      </div>
      <div className="ad-skeleton-chart-grid">
        <div className="ad-skeleton-chart" />
        <div className="ad-skeleton-chart" />
      </div>
      <div className="ad-skeleton-table">
        {[1, 2, 3, 4, 5].map((item) => <div key={item} />)}
      </div>
    </main>
  );
});

function getStoredOrDemoSessions() {
  try {
    const stored = adminSessionService.getSessions();
    return Array.isArray(stored) && stored.length ? stored : MOCK_SESSIONS;
  } catch {
    return MOCK_SESSIONS;
  }
}

function getStoredOrDemoActivity() {
  try {
    const stored = adminSessionService.getActivity();
    return Array.isArray(stored) && stored.length ? stored : MOCK_ACTIVITY;
  } catch {
    return MOCK_ACTIVITY;
  }
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("sessions");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setSessions(getStoredOrDemoSessions());
      setActivity(getStoredOrDemoActivity());
      setLoading(false);
    }, 350);

    const refresh = () => {
      setSessions(getStoredOrDemoSessions());
      setActivity(getStoredOrDemoActivity());
    };

    window.addEventListener("euodoo:session-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("euodoo:session-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const notify = useCallback((message) => {
    setNotice(message);
    playNotificationTone();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesStatus = filter === "All" || session.status === filter;
      const searchable = [
        session.title,
        session.hostName,
        session.meetingId,
        ...(session.attendees || []).map((attendee) => attendee.name),
      ];
      const matchesQuery =
        !normalizedQuery ||
        searchable.some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [sessions, filter, query]);

  const stats = useMemo(() => ({
    total: sessions.length,
    live: sessions.filter((session) => session.status === "In progress").length,
    interrupted: sessions.filter((session) => session.status === "Interrupted").length,
    attendees: sessions.reduce((total, session) => total + (session.attendees?.length || 0), 0),
    completed: sessions.filter((session) => session.status === "Completed").length,
    scheduled: sessions.filter((session) => session.status === "Scheduled").length,
  }), [sessions]);

  const statusData = useMemo(() => [
    { label: "Completed", value: stats.completed, color: "#0FB9AE" },
    { label: "In progress", value: stats.live, color: "#0B686D" },
    { label: "Scheduled", value: stats.scheduled, color: "#F06422" },
    { label: "Interrupted", value: stats.interrupted, color: "#C8500F" },
  ], [stats]);

  const exportCsv = useCallback(() => {
    const headers = ["Meeting", "Meeting ID", "Host", "Status", "Scheduled", "Started", "Ended", "Duration", "Attendees", "Recording URL"];
    const rows = filtered.map((session) => [
      session.title,
      session.meetingId,
      session.hostName,
      session.status,
      session.scheduledStart,
      session.startedAt,
      session.endedAt,
      duration(session.startedAt, session.endedAt),
      (session.attendees || []).map((attendee) => attendee.name).join("; "),
      session.recordingUrl || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blobUrl = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = "euodoo-meeting-history.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    notify("Meeting history exported");
  }, [filtered, notify]);

  if (loading) return <Skeleton />;

  return (
    <main className="ad-page">
      <header className="ad-header">
        <button className="ad-brand" onClick={() => navigate("/")} type="button">
          <span className="ad-logo">E</span>
          <span><b>Euodoo Meet</b><small>Admin console</small></span>
        </button>
        <div className="ad-header-title"><ShieldCheck size={18} /> Organisation dashboard</div>
        <button className="ad-back" onClick={() => navigate("/")} type="button">
          Back to meetings <ExternalLink size={14} />
        </button>
      </header>

      <section className="ad-content">
        <div className="ad-page-intro">
          <div>
            <span className="ad-eyebrow">ADMINISTRATION / OVERVIEW</span>
            <h1>Meeting operations</h1>
            <p>Review meeting hosts, attendance, recordings and session activity.</p>
          </div>
          <button className="ad-export" onClick={exportCsv} type="button">
            <Download size={16} /> Export report
          </button>
        </div>

        <div className="ad-stat-grid">
          <Stat icon={<Video />} label="Total sessions" value={stats.total} detail="Across listed sessions" />
          <Stat icon={<Activity />} label="Live now" value={stats.live} detail="Currently in progress" />
          <Stat icon={<History />} label="Interrupted" value={stats.interrupted} detail="Includes mid-meeting exits" />
          <Stat icon={<Users />} label="Attendee entries" value={stats.attendees} detail="Across listed sessions" />
        </div>

        <section className="ad-analytics-grid" aria-label="Meeting analytics">
          <article className="ad-panel ad-chart-panel">
            <div className="ad-chart-heading">
              <span className="ad-chart-icon"><BarChart3 size={19} /></span>
              <div>
                <h2>Meeting activity</h2>
                <p>Illustrative meeting volume over the last seven days</p>
              </div>
            </div>
            <div className="ad-bar-chart" role="img" aria-label="Demo meeting activity by day">
              {[
                { day: "Mon", value: 4 },
                { day: "Tue", value: 7 },
                { day: "Wed", value: 5 },
                { day: "Thu", value: 8 },
                { day: "Fri", value: 6 },
                { day: "Sat", value: 3 },
                { day: "Sun", value: 5 },
              ].map((item) => (
                <div className="ad-bar-column" key={item.day}>
                  <span className="ad-bar-value">{item.value}</span>
                  <div className="ad-bar-track">
                    <div className="ad-bar-fill" style={{ height: `${(item.value / 8) * 100}%` }} />
                  </div>
                  <span className="ad-bar-label">{item.day}</span>
                </div>
              ))}
            </div>
            <p className="ad-chart-footnote">Demo trend · Replace with API analytics for live reporting.</p>
          </article>

          <article className="ad-panel ad-chart-panel">
            <div className="ad-chart-heading">
              <span className="ad-chart-icon ad-chart-icon-orange"><PieChart size={19} /></span>
              <div>
                <h2>Session status</h2>
                <p>Distribution of the displayed session records</p>
              </div>
            </div>
            <div className="ad-status-chart">
              {statusData.map((item) => {
                const percentage = stats.total ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div className="ad-status-row" key={item.label}>
                    <span className="ad-status-color" style={{ background: item.color }} />
                    <span className="ad-status-label">{item.label}</span>
                    <div className="ad-status-track">
                      <div className="ad-status-fill" style={{ background: item.color, width: `${percentage}%` }} />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                );
              })}
            </div>
            <p className="ad-chart-footnote">Status totals update from the sessions currently loaded.</p>
          </article>
        </section>

        <section className="ad-insight-strip" aria-label="Meeting summary">
          <Insight icon={<TrendingUp size={19} />} value={stats.completed} label="Completed meetings" />
          <Insight icon={<Users size={19} />} value={stats.attendees} label="Attendee entries" />
          <Insight icon={<CalendarCheck size={19} />} value={stats.scheduled} label="Upcoming sessions" />
        </section>

        <section className="ad-panel">
          <div className="ad-panel-heading">
            <div>
              <h2>Session records</h2>
              <p>Scheduled meetings and completed or interrupted sessions</p>
            </div>
            <div className="ad-tabs" role="tablist" aria-label="Admin data views">
              <button className={tab === "sessions" ? "active" : ""} onClick={() => setTab("sessions")} type="button" role="tab" aria-selected={tab === "sessions"}>Meetings</button>
              <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")} type="button" role="tab" aria-selected={tab === "activity"}>Session activity</button>
            </div>
          </div>

          {tab === "sessions" ? (
            <>
              <div className="ad-filters">
                <label className="ad-search">
                  <Search size={16} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meeting, host or attendee" aria-label="Search meeting, host or attendee" />
                </label>
                <label className="ad-filter">
                  <Filter size={15} />
                  <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter by meeting status">
                    {FILTERS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>

              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>Meeting / ID</th><th>Host</th><th>Schedule</th><th>Attendees</th><th>Status</th><th>Recording</th><th>History</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((session) => (
                      <tr key={session.meetingId}>
                        <td>
                          <div className="ad-meeting-name">
                            <span className="ad-meeting-icon"><Video size={16} /></span>
                            <span><b>{session.title || "Meeting"}</b><small>{session.meetingId}</small></span>
                          </div>
                        </td>
                        <td><div className="ad-host"><span>{initials(session.hostName)}</span><b>{session.hostName || "Unknown host"}</b></div></td>
                        <td><span className="ad-date"><CalendarDays size={14} />{dateLabel(session.scheduledStart || session.startedAt)}</span></td>
                        <td><button className="ad-attendee-link" onClick={() => setSelected(session)} type="button"><Users size={14} />{session.attendees?.length || 0} people</button></td>
                        <td><span className={`ad-status ad-status-${(session.status || "Scheduled").toLowerCase().replaceAll(" ", "-")}`}>{session.status || "Scheduled"}</span></td>
                        <td>{session.recordingUrl ? <a className="ad-recording-link" href={session.recordingUrl} target="_blank" rel="noreferrer"><FileVideo size={15} /> Open</a> : <span className="ad-unavailable">Not available</span>}</td>
                        <td><button className="ad-details-button" onClick={() => setSelected(session)} type="button">Details <ExternalLink size={13} /></button></td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan="7"><div className="ad-empty"><CalendarDays size={24} /><b>No matching sessions</b><span>Try another search term or status filter.</span></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ad-table-foot">
                Showing {filtered.length} of {sessions.length} sessions
                <span>{sessions === MOCK_SESSIONS ? "Demo data" : "Local session data"} · Updates when this app records an event</span>
              </div>
            </>
          ) : (
            <div className="ad-activity-list">
              {!activity.length && <div className="ad-empty"><Activity size={24} /><b>No activity recorded yet</b><span>Created, joined, left and ended events will appear here.</span></div>}
              {activity.map((item) => (
                <article className="ad-activity-item" key={item.id}>
                  <span className="ad-activity-dot"><Activity size={14} /></span>
                  <div><b>{item.message}</b><p>{item.meetingTitle || item.meetingId || "Meeting"}{item.actor ? ` · ${item.actor}` : ""}</p><small>{dateLabel(item.at)}</small></div>
                  <span className="ad-status">{item.type || "Activity"}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="ad-disclaimer"><ShieldCheck size={15} /> Demo admin view. Charts and fallback records are illustrative; real recordings, attendance and organization-wide reporting require backend integration and server-side authorization.</p>
      </section>

      {selected && (
        <div className="ad-overlay" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="ad-detail-modal" role="dialog" aria-modal="true" aria-labelledby="ad-detail-title">
            <button className="ad-close" onClick={() => setSelected(null)} aria-label="Close meeting details" type="button"><X size={18} /></button>
            <span className="ad-detail-icon"><History size={20} /></span>
            <h2 id="ad-detail-title">{selected.title || "Meeting"}</h2>
            <p className="ad-detail-subtitle">Meeting ID: {selected.meetingId}</p>
            <div className="ad-detail-grid">
              <Detail label="Host" value={selected.hostName || "Unknown"} />
              <Detail label="Status" value={selected.status || "Scheduled"} />
              <Detail label="Scheduled" value={dateLabel(selected.scheduledStart)} />
              <Detail label="Started" value={dateLabel(selected.startedAt)} />
              <Detail label="Ended" value={dateLabel(selected.endedAt)} />
              <Detail label="Duration" value={duration(selected.startedAt, selected.endedAt)} />
            </div>
            <h3 className="ad-detail-section-title">Attendees & exit history</h3>
            <div className="ad-detail-attendees">
              {(selected.attendees || []).map((person, index) => (
                <div key={`${person.id || person.name}-${index}`}>
                  <span>{initials(person.name)}</span>
                  <div><b>{person.name}</b><small>{person.role || "Participant"} · {person.exitReason || (person.leftAt ? "Left meeting" : "Attendance recorded")}</small></div>
                  <time>{person.leftAt ? dateLabel(person.leftAt) : person.joinedAt ? `Joined ${dateLabel(person.joinedAt)}` : ""}</time>
                </div>
              ))}
              {!selected.attendees?.length && <p className="ad-unavailable">No attendee details recorded.</p>}
            </div>
            {selected.recordingUrl && <a className="ad-export ad-modal-recording" href={selected.recordingUrl} target="_blank" rel="noreferrer"><FileVideo size={16} /> Open recording</a>}
            <button className="ad-primary-button ad-done" onClick={() => setSelected(null)} type="button"><Check size={16} /> Done</button>
          </section>
        </div>
      )}

      {notice && <div className="ad-toast" role="status" aria-live="polite"><Check size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification" type="button"><X size={14} /></button></div>}
    </main>
  );
}

function Stat({ icon, label, value, detail }) {
  return <article className="ad-stat-card"><span className="ad-stat-icon">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function Insight({ icon, value, label }) {
  return <div className="ad-insight-card">{icon}<span><strong>{value}</strong><small>{label}</small></span></div>;
}

function Detail({ label, value }) {
  return <div className="ad-detail-cell"><span>{label}</span><b>{value}</b></div>;
}
