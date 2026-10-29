import { useMemo, useState } from "react";
import { PhoneIncoming, PhoneMissed, PhoneOff, Search, Video } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import "./calls.css";

const demoCalls = [
  { id: 1, name: "Sanjay N", type: "Incoming", status: "Received", date: "Today", time: "11:42 AM", duration: "18 min" },
  { id: 2, name: "Design Team", type: "Incoming", status: "Missed", date: "Today", time: "10:18 AM", duration: "—" },
  { id: 3, name: "Rohit K", type: "Outgoing", status: "Declined", date: "Yesterday", time: "4:36 PM", duration: "—" },
  { id: 4, name: "Interns Session", type: "Outgoing", status: "Received", date: "Yesterday", time: "2:00 PM", duration: "42 min" },
  { id: 5, name: "Priya S", type: "Incoming", status: "Missed", date: "Mon, 26 Oct", time: "9:15 AM", duration: "—" },
  { id: 6, name: "Project Discussion", type: "Outgoing", status: "Received", date: "Fri, 23 Oct", time: "3:20 PM", duration: "31 min" },
];

const statusIcon = {
  Received: PhoneIncoming,
  Declined: PhoneOff,
  Missed: PhoneMissed,
};

export default function CallsPage() {
  const [filter, setFilter] = useState("All calls");
  const [query, setQuery] = useState("");
  const calls = useMemo(() => demoCalls.filter((call) => {
    const matchesFilter = filter === "All calls" || call.status === filter;
    const matchesQuery = `${call.name} ${call.type} ${call.date} ${call.status}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  return (
    <DashboardLayout page="calls">
      <main className="em-page em-calls-page">
        <header className="em-page-heading">
          <div>
            {/* <span className="em-page-kicker">COMMUNICATION</span> */}
            <h1>Calls</h1>
            <p>Your incoming and outgoing call history, with status and time.</p>
          </div>
        </header>

        <section className="em-call-history-card">
          <div className="em-call-history-toolbar">
            <div className="em-call-history-tabs" role="group" aria-label="Filter calls">
              {["All calls", "Received", "Declined", "Missed"].map((item) => (
                <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
                  {item}
                  {item === "All calls" && <span>{demoCalls.length}</span>}
                </button>
              ))}
            </div>
            <label className="em-call-history-search">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search calls..." aria-label="Search calls" />
            </label>
          </div>

          <div className="em-call-history-heading">
            <span>CALL / CONTACT</span><span>TYPE</span><span>DATE & TIME</span><span>STATUS</span><span>DURATION</span>
          </div>
          {calls.length ? calls.map((call) => {
            const Icon = statusIcon[call.status] || Video;
            return (
              <article className="em-call-history-row" key={call.id}>
                <div className="em-call-history-person">
                  <span className={`em-call-history-icon ${call.status.toLowerCase()}`}><Icon size={17} /></span>
                  <div><b>{call.name}</b><small>{call.id.toString().padStart(3, "0")} · Call record</small></div>
                </div>
                <span className="em-call-type">{call.type}</span>
                <div className="em-call-history-time"><b>{call.date}</b><small>{call.time}</small></div>
                <span className={`em-call-status ${call.status.toLowerCase()}`}>{call.status}</span>
                <span className="em-call-duration">{call.duration}</span>
              </article>
            );
          }) : <div className="em-call-history-empty"><PhoneIncoming size={24} /><b>No calls found</b><span>Try a different status or search term.</span></div>}
        </section>
        <p className="em-call-history-note">Demo call history · connect a call-history API to show real account activity.</p>
      </main>
    </DashboardLayout>
  );
}
