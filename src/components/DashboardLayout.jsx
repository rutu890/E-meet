import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Check, CheckCheck, ChevronDown, ChevronRight, CircleCheck, CircleX, Clock3, ExternalLink, History, Home, LifeBuoy, LogOut, Menu, MinusCircle, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Settings as SettingsIcon, UserRound, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getNotifications, getProfile, getStatus, saveNotifications, saveStatus } from "../utils/demoState";
import { playTone } from "../utils/feedback";
import { useToast } from "../hooks/useToast";
import Toast from "./Toast";
import "../pages/dashboard.css";

const COLLAPSE_KEY = "em-sidebar-collapsed";
const NAV = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/settings", label: "Settings", Icon: SettingsIcon },
  { to: "/support", label: "Support", Icon: LifeBuoy },
];
const STATUS_OPTIONS = [
  { label: "Available", color: "green", Icon: CircleCheck },
  { label: "Busy", color: "red", Icon: CircleCheck },
  { label: "Do not disturb", color: "red", Icon: MinusCircle },
  { label: "Be right back", color: "amber", Icon: Clock3 },
  { label: "Appear away", color: "amber", Icon: Clock3 },
  { label: "Appear offline", color: "gray", Icon: CircleX },
];
const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const AvatarContent = memo(function AvatarContent({ profile, initials, large = false }) {
  return profile.photo
    ? <img className={`em-avatar-photo ${large ? "large" : ""}`} src={profile.photo} alt={`${profile.name || "User"} profile`} decoding="async" />
    : <span className={`em-avatar ${large ? "large" : ""}`}>{initials}</span>;
});

export default function DashboardLayout({ children, page = "home", searchPlaceholder = "Search meetings, people or recordings", onSearch }) {
  const app = useApp();
  const user = app?.user;
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [noticeDetail, setNoticeDetail] = useState(null);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState(() => getProfile(user));
  const [status, setStatus] = useState(getStatus);
  const [notifications, setNotifications] = useState(getNotifications);

  // Profile stays in sync when Settings saves a new name / photo
  useEffect(() => {
    const refresh = () => setProfile(getProfile(user));
    refresh();
    window.addEventListener("euodoo-profile-updated", refresh);
    return () => window.removeEventListener("euodoo-profile-updated", refresh);
  }, [user]);

  // Esc closes everything, Ctrl/Cmd+K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setProfileOpen(false); setNotificationsOpen(false); setStatusOpen(false); setConfirmSignOut(false); setNoticeDetail(null); setMobileOpen(false); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes popovers
  useEffect(() => {
    if (!profileOpen && !notificationsOpen) return undefined;
    const onDown = (e) => {
      if (!e.target.closest?.(".em-popover-wrap")) { setProfileOpen(false); setNotificationsOpen(false); setStatusOpen(false); }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileOpen, notificationsOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
    playTone("pop");
  }, []);

  const fullName = profile.name || "Euodoo Meet user";
  const initials = useMemo(() => fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "EM", [fullName]);
  const dateLabel = useMemo(() => DATE_FORMAT.format(new Date()), []);
  const selectedStatus = STATUS_OPTIONS.find((item) => item.label === status) || STATUS_OPTIONS[0];
  const StatusIcon = selectedStatus.Icon;
  const unreadCount = notifications.filter((item) => !item.read).length;

  function signOut() { setConfirmSignOut(true); setProfileOpen(false); setNotificationsOpen(false); setMobileOpen(false); playTone("confirm"); }
  function confirmLogout() {
    if (typeof app?.logout === "function") app.logout(); else if (typeof app?.signOut === "function") app.signOut();
    setConfirmSignOut(false);
    navigate("/login", { replace: true });
  }
  function chooseStatus(next) { setStatus(next); saveStatus(next); setStatusOpen(false); showToast(`Status changed to ${next}`); }
  function markAllRead() {
    if (!unreadCount) return;
    const next = notifications.map((item) => ({ ...item, read: true }));
    setNotifications(next); saveNotifications(next); showToast("All notifications marked as read");
  }
  function openNotice(item) {
    const next = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n));
    setNotifications(next); saveNotifications(next); setNoticeDetail({ ...item, read: true }); playTone("notify");
  }

  return (
    <div className={`em-layout ${collapsed ? "is-collapsed" : ""}`}>
      {mobileOpen && <button className="em-sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`em-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div>
          <div className="em-sidebar-head">
            <NavLink to="/" className="em-brand" onClick={() => setMobileOpen(false)}>
              <span className="em-brand-mark">E</span>
              <span className="em-brand-text">Euodoo<span className="em-brand-accent">Meet</span></span>
            </NavLink>
            <button className="em-collapse-btn" onClick={toggleCollapsed} aria-pressed={collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
          <div className="em-nav-label">MENU</div>
          <nav className="em-nav" aria-label="Main navigation">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} title={label} onClick={() => setMobileOpen(false)} className={({ isActive }) => `em-nav-link ${isActive ? "active" : ""}`}>
                <Icon size={17} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="em-sidebar-user">
          <button className="em-sidebar-user-main" onClick={() => navigate("/profile")} title="View profile">
            <AvatarContent profile={profile} initials={initials} />
            <span className="em-user-meta"><b>{fullName}</b><small>{status}</small></span>
          </button>
          <button className="em-logout-btn" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="em-main-wrapper">
        <header className="em-topbar">
          <div className="em-topbar-left">
            <button className="em-icon-button em-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <form className="em-search" onSubmit={(e) => { e.preventDefault(); onSearch?.(query); }}>
              <Search size={17} />
              <input ref={searchRef} value={query} onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }} placeholder={searchPlaceholder} aria-label="Search" />
              <kbd>Ctrl K</kbd>
            </form>
          </div>

          <div className="em-topbar-actions">
            <div className="em-date-pill"><CalendarDays size={15} /><span>{dateLabel}</span></div>

            <div className="em-popover-wrap">
              <button className={`em-icon-button ${notificationsOpen ? "selected" : ""}`} onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications" aria-expanded={notificationsOpen}>
                <Bell size={18} />{unreadCount > 0 && <i className="em-notification-dot" />}
              </button>
              {notificationsOpen && (
                <div className="em-popover em-notifications">
                  <div className="em-popover-title"><b>Notifications</b><span className="em-unread-pill">{unreadCount} unread</span></div>
                  <button className="em-popover-action em-mark-all" onClick={markAllRead}><CheckCheck size={14} /> Mark all as read</button>
                  <div className="em-notification-list">
                    {notifications.map((item) => (
                      <button className={`em-notice ${item.read ? "is-read" : "is-unread"}`} key={item.id} onClick={() => openNotice(item)}>
                        <span className={`em-notice-dot ${item.color || ""} ${item.read ? "read" : ""}`} />
                        <span className="em-notice-copy"><b>{item.title}</b><small>{item.message}</small><small className="em-notice-time">{item.time}</small></span>
                        {!item.read && <i className="em-unread-indicator" />}
                      </button>
                    ))}
                  </div>
                  <button className="em-notification-history-link" onClick={() => { setNotificationsOpen(false); navigate("/notifications"); }}><History size={15} /> View notification history <ChevronRight size={15} /></button>
                </div>
              )}
            </div>

            <div className="em-popover-wrap">
              <button className="em-profile-trigger" onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false); setStatusOpen(false); }} aria-expanded={profileOpen} aria-label="Open personal profile">
                <AvatarContent profile={profile} initials={initials} /><b>{fullName}</b><ChevronDown size={15} />
              </button>
              {profileOpen && (
                <div className="em-popover em-profile-popover" role="dialog" aria-label="Personal profile">
                  <div className="em-profile-popover-title"><b>Personal</b><button className="em-text-action" onClick={signOut}>Sign out</button></div>
                  <div className="em-profile-popover-head">
                    <AvatarContent profile={profile} initials={initials} large />
                    <div className="em-profile-identity"><b>{fullName}</b><small>{profile.email || "Add your email address"}</small><span className="em-account-link-static">My Euodoo account <ExternalLink size={12} /></span></div>
                  </div>
                  <div className="em-status-area">
                    <button className={`em-status-current status-${selectedStatus.color}`} onClick={() => setStatusOpen((v) => !v)} aria-expanded={statusOpen}>
                      <StatusIcon size={19} /><span>{status}</span><ChevronDown className={statusOpen ? "rotated" : ""} size={17} />
                    </button>
                    {statusOpen && (
                      <div className="em-status-menu" role="listbox" aria-label="Change availability status">
                        {STATUS_OPTIONS.map(({ label, color, Icon }) => (
                          <button key={label} role="option" aria-selected={status === label} className={`em-status-option status-${color} ${status === label ? "current" : ""}`} onClick={() => chooseStatus(label)}>
                            <Icon size={18} /><span>{label}</span>{status === label && <Check size={16} />}
                          </button>
                        ))}
                        <div className="em-status-divider" />
                        <button className="em-status-option reset" onClick={() => chooseStatus("Available")}><RotateCcw size={17} /><span>Reset status</span></button>
                      </div>
                    )}
                  </div>
                  <div className="em-profile-shortcuts">
                    <button onClick={() => { setProfileOpen(false); setStatusOpen(false); navigate("/profile"); }}><UserRound size={16} /><span>View profile</span><ChevronRight className="shortcut-arrow" size={15} /></button>
                    <NavLink to="/settings" onClick={() => { setProfileOpen(false); setStatusOpen(false); }}><SettingsIcon size={16} /><span>Personal settings</span><ChevronRight className="shortcut-arrow" size={15} /></NavLink>
                  </div>
                  <button className="em-signout" onClick={signOut}><LogOut size={16} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className={`em-page em-page-${page}`}>{children}</main>
      </div>

      {confirmSignOut && (
        <div className="em-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSignOut(false); }}>
          <section className="em-modal em-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="em-signout-title">
            <button className="em-modal-close" onClick={() => setConfirmSignOut(false)} aria-label="Close"><X size={18} /></button>
            <span className="em-modal-icon em-warning-icon"><LogOut size={21} /></span>
            <h2 id="em-signout-title">Sign out of Euodoo Meet?</h2>
            <p>You'll need to sign in again to access your meetings and workspace.</p>
            <div className="em-confirm-actions">
              <button className="em-button-secondary" onClick={() => setConfirmSignOut(false)}>Cancel</button>
              <button className="em-button-danger" onClick={confirmLogout}><LogOut size={16} /> Sign out</button>
            </div>
          </section>
        </div>
      )}

      {noticeDetail && (
        <div className="em-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setNoticeDetail(null); }}>
          <section className="em-modal em-notice-detail-modal" role="dialog" aria-modal="true" aria-labelledby="em-notice-detail-title">
            <button className="em-modal-close" onClick={() => setNoticeDetail(null)} aria-label="Close"><X size={18} /></button>
            <span className="em-modal-icon"><Bell size={21} /></span>
            <span className="em-page-kicker">{noticeDetail.category || "NOTIFICATION"}</span>
            <h2 id="em-notice-detail-title">{noticeDetail.title}</h2>
            <p>{noticeDetail.detail || noticeDetail.message}</p>
            <div className="em-notice-history-meta"><span>{noticeDetail.time}</span><span className="em-read-label"><Check size={13} /> Read</span></div>
            <button className="em-button-primary" onClick={() => setNoticeDetail(null)}>Done</button>
          </section>
        </div>
      )}

      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
}
