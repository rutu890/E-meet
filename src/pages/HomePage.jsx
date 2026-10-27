import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Link2, Plus, ShieldCheck, Users, Video, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { demoMeetings } from "../data/demoData";
import { meetingService } from "../services/meetingService";
import DashboardLayout from "../components/DashboardLayout";
import { useApp } from "../context/AppContext";

const fallbackMeetings = [
  { id: "project-discussion", title: "Project Discussion", date: "Today · Dev team", time: "10:00 AM", duration: "30 min", status: "Live now", participants: 4, color: "orange" },
  { id: "project-review", title: "Project Review", date: "Today · Design team", time: "2:00 PM", duration: "45 min", status: "Upcoming", participants: 6, color: "teal" },
  { id: "interns-session", title: "Interns Session", date: "Today · Design & Dev", time: "4:30 PM", duration: "1 hr", status: "Upcoming", participants: 8, color: "purple" },
  { id: "standup", title: "Standup", date: "Tomorrow · Dev team", time: "9:30 AM", duration: "15 min", status: "Upcoming", participants: 5, color: "teal" },
  { id: "frontend-planning", title: "Frontend Planning", date: "Fri, 23 Oct · Dev Team", time: "11:00 AM", duration: "1 hr 30 min", status: "Ended", participants: 8, color: "blue" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [joinCode, setJoinCode] = useState("");
  const [title, setTitle] = useState("Team catch-up");
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const meetings = useMemo(() => {
    const source = Array.isArray(demoMeetings) && demoMeetings.length ? demoMeetings.map((m, i) => ({ ...fallbackMeetings[i % fallbackMeetings.length], ...m, time: m.time || fallbackMeetings[i % fallbackMeetings.length].time, date: m.date || fallbackMeetings[i % fallbackMeetings.length].date, color: fallbackMeetings[i % fallbackMeetings.length].color })) : fallbackMeetings;
    return source.filter((m) => `${m.title || ""} ${m.date || ""}`.toLowerCase().includes(search.toLowerCase()) && (tab === "Recent" ? m.status === "Ended" : tab === "Missed" ? m.status === "Missed" : m.status !== "Ended" && m.status !== "Missed"));
  }, [search, tab]);
  const calendarDate = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1), [monthOffset]);
  const monthTitle = calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const today = new Date();

  async function create(event) {
    event.preventDefault();
    try {
      const meeting = await meetingService.createMeeting({ title: title.trim() || "Team catch-up", hostName: user?.name });
      setShowCreate(false);
      navigate(`/meeting/${encodeURIComponent(meeting.meetingId)}`, {
        state: { title: meeting.title || title.trim() || "Team catch-up", isHost: true },
      });
    } catch (err) { setError(err?.message || "Could not create the meeting. Please try again."); }
  }
  async function join(event) {
    event.preventDefault(); setError("");
    if (!joinCode.trim()) { setError("Enter a meeting code or link to continue."); return; }
    try { const meeting = await meetingService.joinMeeting(joinCode.trim()); navigate(`/meeting/${encodeURIComponent(meeting.meetingId)}`, { state: { title: "Quick meeting", isHost: false } }); }
    catch (err) { setError(err?.message || "We couldn't find that meeting. Check the code and try again."); }
  }
  async function copyMeetingLink() {
    if (!created?.meetingId) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/meeting/${created.meetingId}`); setToast("Meeting link copied"); }
    catch { setToast(`Meeting code: ${created.meetingId}`); }
  }
  return <DashboardLayout page="home" onSearch={setSearch}>
    <div className="em-dashboard-grid">
      <section className="em-primary-column">
        <div className="em-welcome"><h1>Good afternoon, {(user?.name || "there").split(" ")[0]}</h1><p>You have <strong>3 meetings</strong> today. Ready to jump in?</p></div>
        <section className="em-action-grid" aria-label="Meeting actions">
          <article className="em-create-card"><span className="em-action-icon"><Video size={19}/></span><h2>Create meeting</h2><p>Start an instant meeting or schedule one for later.</p><button onClick={() => { setError(""); setShowCreate(true); }}><Plus size={15}/> New meeting</button></article>
          <article className="em-join-card"><span className="em-action-icon"><Link2 size={18}/></span><h2>Join meeting</h2><p>Enter a meeting code or paste an invite link.</p><form className="em-join-form" onSubmit={join}><label className="em-join-input"><Video size={15}/><input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="abc-defg-hij" aria-label="Meeting code or link"/></label><button type="submit">Join</button></form></article>
        </section>
        {error && <div className="em-inline-error" role="alert"><X size={16}/>{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={14}/></button></div>}
        <section className="em-calls-card"><div className="em-calls-head"><div><h2>Calls</h2><p>Your upcoming and recent meetings</p></div><div className="em-tabs" role="tablist" aria-label="Meeting filter">{["Upcoming", "Recent", "Missed"].map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div></div>
          <div className="em-call-list">{meetings.map((meeting, index) => <article className="em-call-row" key={meeting.id || meeting.title}><span className={`em-call-icon ${index % 3 === 0 ? "orange" : index % 3 === 1 ? "teal" : "purple"}`}><Video size={17}/></span><div className="em-call-details"><b>{meeting.title}</b><small>{meeting.date}</small></div><div className="em-participant-stack"><Avatar initials="SN" color="mint" size="xs"/><Avatar initials="SB" color="peach" size="xs"/><Avatar initials="DS" color="blue" size="xs"/><span>+{Math.max(1, (meeting.participants || 4) - 3)}</span></div><div className="em-call-time"><b>{meeting.time || (index === 0 ? "10:00 AM" : index === 1 ? "2:00 PM" : "4:30 PM")}</b><small>{meeting.duration || "30 min"}</small></div><span className={`em-status ${meeting.status === "Live now" ? "live" : meeting.status === "Ended" ? "ended" : ""}`}>{meeting.status || "Upcoming"}</span><button className={`em-row-action ${meeting.status === "Ended" ? "outline" : ""}`} onClick={() => navigate(`/meeting/${encodeURIComponent(meeting.id || meeting.meetingId || "demo-meeting")}`, { state: { title: meeting.title, isHost: false } })}>{meeting.status === "Ended" ? "Details" : "Join"}</button></article>)}
          {meetings.length === 0 && <div className="em-empty-state"><CalendarDays size={24}/><b>No meetings found</b><span>Try another filter or search term.</span></div>}</div>
        </section>
      </section>
      <aside className="em-right-column"><section className="em-calendar-card"><div className="em-calendar-heading"><div><h2>{monthTitle}</h2><p>{monthOffset === 0 ? "Today is " + today.toLocaleDateString("en-US", { weekday: "long", day: "numeric" }) : "Your meeting calendar"}</p></div><div className="em-calendar-arrows"><button aria-label="Previous month" onClick={() => setMonthOffset((v) => v - 1)}><ChevronLeft size={16}/></button><button aria-label="Next month" onClick={() => setMonthOffset((v) => v + 1)}><ChevronRight size={16}/></button></div></div><div className="em-calendar-grid">{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => <span className="em-weekday" key={day}>{day}</span>)}{Array.from({ length: (firstDay + 6) % 7 }, (_, i) => <span key={`blank-${i}`} className="em-day muted"/>)}{Array.from({ length: daysInMonth }, (_, i) => { const day = i + 1; const isToday = monthOffset === 0 && day === today.getDate(); const hasMeeting = [6, 9, 14, 23, 26, 27].includes(day); return <button key={day} className={`em-day ${isToday ? "today" : ""} ${selectedDay === day ? "selected" : ""}`} onClick={() => setSelectedDay(day)} aria-label={`${day} ${monthTitle}`}>{day}{hasMeeting && <i/>}</button>; })}</div><div className="em-calendar-legend"><i/> Days with scheduled meetings</div></section>
        <section className="em-schedule-card"><div className="em-schedule-head"><h2>Today's schedule</h2><span>3 meetings</span></div>{[{ title: "Project Discussion", time: "10:00 – 10:30 AM", color: "orange" }, { title: "Project Review", time: "2:00 – 2:45 PM", color: "teal" }, { title: "Interns Session", time: "4:30 – 5:30 PM", color: "purple" }].map((item) => <div className={`em-schedule-item ${item.color}`} key={item.title}><div><b>{item.title}</b><small>{item.time}</small></div><Video size={15}/></div>)}</section>
      </aside>
    </div>
    {showCreate && <div className="em-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><section className="em-modal" role="dialog" aria-modal="true" aria-labelledby="em-create-title"><button className="em-modal-close" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18}/></button><span className="em-modal-icon"><Video size={22}/></span><h2 id="em-create-title">Create a meeting</h2><p>Set up a space for your next conversation.</p><form onSubmit={create}><label htmlFor="meeting-title">Meeting name</label><input id="meeting-title" className="em-text-input" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required autoFocus/><div className="em-host-note"><ShieldCheck size={18}/><span><b>You're the host</b><small>You can manage participants in the demo room.</small></span></div><button className="em-button-primary" type="submit"><Plus size={17}/> Create meeting</button></form></section></div>}
    {created && <div className="em-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreated(null); }}><section className="em-modal em-created-modal" role="dialog" aria-modal="true" aria-labelledby="em-created-title"><button className="em-modal-close" onClick={() => setCreated(null)} aria-label="Close"><X size={18}/></button><span className="em-success-mark"><Check size={24}/></span><h2 id="em-created-title">Your meeting is ready</h2><p>Share this meeting code with attendees.</p><div className="em-code-box"><b>{created.meetingId}</b><button onClick={copyMeetingLink} aria-label="Copy meeting link">Copy link</button></div><button className="em-button-primary" onClick={() => navigate(`/meeting/${encodeURIComponent(created.meetingId)}`, { state: { title: created.title, isHost: true } })}>Start meeting <ArrowRight size={16}/></button><button className="em-button-secondary" onClick={copyMeetingLink}>Copy meeting link</button></section></div>}
    {toast && <div className="em-toast" role="status"><Check size={17}/>{toast}<button onClick={() => setToast("")} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </DashboardLayout>;
}
