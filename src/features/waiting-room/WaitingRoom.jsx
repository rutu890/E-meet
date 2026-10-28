import { Check, Clock3, ShieldCheck, X, Users, UserCheck, LockKeyhole } from "lucide-react";

export default function WaitingRoom({
  isOpen = true,
  people = [],
  isLocked = false,
  onAdmit,
  onDeny,
  onAdmitAll,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="mr-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mr-waiting-title"
    >
      <section className="mr-modal mr-modal-wide">
        {/* Modal Header */}
        <div className="mr-waiting-head">
          <div className="mr-waiting-head-copy">
            <span className="mr-modal-icon-badge">
              <Clock3 size={20} />
            </span>
            <div>
              <div className="mr-waiting-title-row">
                <h2 id="mr-waiting-title">Waiting room</h2>
                <span className="mr-waiting-count-badge">
                  {people.length} {people.length === 1 ? "waiting" : "waiting"}
                </span>
                {isLocked && (
                  <span className="mr-waiting-locked-pill">
                    <LockKeyhole size={11} /> Locked
                  </span>
                )}
              </div>
              <p>Review who wants to join your corporate meeting.</p>
            </div>
          </div>
          <button
            type="button"
            className="mr-modal-close"
            onClick={onClose}
            aria-label="Close waiting room"
          >
            <X size={18} />
          </button>
        </div>

        {/* Locked Alert if active */}
        {isLocked && (
          <div className="mr-waiting-locked-alert" role="alert">
            <LockKeyhole size={15} />
            <span>
              <strong>Meeting is locked:</strong> Attendees cannot join right now. Unlock the meeting in Host Tools to admit participants.
            </span>
          </div>
        )}

        {/* Security & Summary Bar */}
        <div className="mr-waiting-summary">
          <div className="mr-waiting-summary-text">
            <ShieldCheck size={16} />
            <span>
              <strong>Host admission required:</strong> Only admit attendees verified by your team.
            </span>
          </div>
          {people.length > 1 && onAdmitAll && (
            <button
              type="button"
              className="mr-waiting-admit-all"
              onClick={onAdmitAll}
              title={isLocked ? "Meeting is locked" : undefined}
            >
              <UserCheck size={14} /> Admit all ({people.length})
            </button>
          )}
        </div>

        {/* Participant list or Empty state */}
        <div className="mr-waiting-list">
          {people.length > 0 ? (
            people.map((p, idx) => (
              <div className="mr-waiting-row" key={p.id}>
                <span
                  className={`mr-mini-avatar ${
                    p.color === "orange" || idx % 2 === 1 ? "mr-orange" : "mr-teal"
                  }`}
                >
                  {p.initials || "U"}
                </span>
                <div className="mr-waiting-person-info">
                  <div className="mr-waiting-name-line">
                    <strong>{p.name}</strong>
                    {p.time && <small className="mr-waiting-time">{p.time}</small>}
                  </div>
                  <span className="mr-waiting-email">
                    {p.email || `${p.name.toLowerCase().replace(/\s+/g, ".")}@euodoo.com`}
                  </span>
                </div>

                <div className="mr-waiting-actions">
                  <button
                    type="button"
                    className="mr-waiting-deny-btn"
                    onClick={() => onDeny && onDeny(p.id)}
                    title={`Deny entry to ${p.name}`}
                  >
                    <X size={14} /> Deny
                  </button>
                  <button
                    type="button"
                    className="mr-waiting-admit-btn"
                    onClick={() => onAdmit && onAdmit(p.id)}
                    title={isLocked ? "Meeting is locked" : `Admit ${p.name}`}
                  >
                    <Check size={14} /> Admit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="mr-waiting-empty">
              <span className="mr-empty-icon-wrap">
                <Users size={32} />
              </span>
              <h3>No participants waiting</h3>
              <p>When someone requests to join this meeting room, they will appear here for host approval.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mr-waiting-footer">
          <button
            type="button"
            className="mr-outline-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
