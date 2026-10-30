
import {
  memo,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import {
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Search,
  Video,
  Copy,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { showSuccess, showError } from "../utils/uiFeedback";
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

const CallRow = memo(function CallRow({ call, index }) {
  const Icon = statusIcon[call.status] || Video;

  const handleCopy = async () => {
    const details = [
      call.name,
      call.type,
      call.status,
      `${call.date}, ${call.time}`,
      call.duration,
    ].join(" | ");

    try {
      await navigator.clipboard.writeText(details);
      showSuccess("Call details copied");
    } catch {
      showError("Unable to copy call details");
    }
  };

  return (
    <article
      className="em-call-history-row"
      style={{ "--row-index": index }}
    >
      <div className="em-call-history-person">
        <span className={`em-call-history-icon ${call.status.toLowerCase()}`}>
          <Icon size={17} />
        </span>

        <div>
          <b>{call.name}</b>
          <small>
            {call.id.toString().padStart(3, "0")} · Call record
          </small>
        </div>
      </div>

      <span className="em-call-type">{call.type}</span>

      <div className="em-call-history-time">
        <b>{call.date}</b>
        <small>{call.time}</small>
      </div>

      <span className={`em-call-status ${call.status.toLowerCase()}`}>
        {call.status}
      </span>

      <span className="em-call-duration">{call.duration}</span>

      <button
        type="button"
        className="em-call-copy"
        onClick={handleCopy}
        aria-label={`Copy ${call.name} call details`}
        title="Copy call details"
      >
        <Copy size={15} />
      </button>
    </article>
  );
});

function CallsSkeleton() {
  return (
    <div className="em-call-skeleton-list" aria-label="Loading calls">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="em-call-skeleton-row" key={index}>
          <div className="em-skeleton-person">
            <span className="em-skeleton em-skeleton-avatar" />
            <div>
              <span className="em-skeleton em-skeleton-name" />
              <span className="em-skeleton em-skeleton-subtitle" />
            </div>
          </div>

          <span className="em-skeleton em-skeleton-text" />
          <span className="em-skeleton em-skeleton-text" />
          <span className="em-skeleton em-skeleton-badge" />
          <span className="em-skeleton em-skeleton-text" />
        </div>
      ))}
    </div>
  );
}

export default function CallsPage({ loading = false }) {
  const [query, setQuery] = useState("");

  const deferredQuery = useDeferredValue(query);

  const calls = useMemo(() => {
    const search = deferredQuery.trim().toLowerCase();

    if (!search) return demoCalls;

    return demoCalls.filter((call) =>
      `${call.name} ${call.type} ${call.date} ${call.time} ${call.status} ${call.duration}`
        .toLowerCase()
        .includes(search)
    );
  }, [deferredQuery]);

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <DashboardLayout page="calls">
      <main className="em-page em-calls-page">

        <header className="em-page-heading">
          <div>
            <h1>Calls</h1>
            <p>
              Your incoming and outgoing call history, with status and time.
            </p>
          </div>
        </header>

        <section className="em-call-history-card">

          <div className="em-call-history-toolbar">

            <div className="em-call-history-title">
              <b>All calls</b>
              <span>{calls.length} calls</span>
            </div>

            <label className="em-call-history-search">
              <Search size={16} />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search calls..."
                aria-label="Search calls"
              />

              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="em-search-clear"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </label>

          </div>

          <div className="em-call-history-heading">
            <span>CALL / CONTACT</span>
            <span>TYPE</span>
            <span>DATE & TIME</span>
            <span>STATUS</span>
            <span>DURATION</span>
            <span />
          </div>

          {loading ? (
            <CallsSkeleton />
          ) : calls.length ? (
            <div className="em-call-history-list">
              {calls.map((call, index) => (
                <CallRow
                  key={call.id}
                  call={call}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="em-call-history-empty">
              <Search size={25} />
              <b>No calls found</b>
              <span>Try another name or search term.</span>
              {query && (
                <button onClick={clearSearch} type="button">
                  Clear search
                </button>
              )}
            </div>
          )}

        </section>

        <p className="em-call-history-note">
          Demo call history · Connect a call-history API to show real account activity.
        </p>

      </main>
    </DashboardLayout>
  );
}
