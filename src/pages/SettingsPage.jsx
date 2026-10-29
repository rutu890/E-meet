import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bell,
  Camera,
  Loader2,
  LockKeyhole,
  Monitor,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserRound,
  Video,
  Volume2,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import Toast from "../components/Toast";
import { SettingsSkeleton } from "../components/Skeletons";
import { useApp } from "../context/AppContext";
import { useSkeleton } from "../hooks/useSkeleton";
import { useToast } from "../hooks/useToast";
import { getPhotoCooldown, getProfile, saveProfile } from "../utils/demoState";
import { fileToAvatar, validateImage } from "../utils/imageUtils";
import { isSoundOn, playTone, setSoundOn } from "../utils/feedback";

const settingTabs = [
  { id: "profile", label: "Profile & Account", icon: UserRound },
  { id: "devices", label: "Audio & Video", icon: Video },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
];
const TIMEZONES = [
  ["Asia/Kolkata", "India Standard Time (IST)"],
  ["Europe/London", "London"],
  ["America/New_York", "Eastern Time"],
  ["UTC", "UTC"],
];
const LANGUAGES = [
  "English (United States)",
  "Español",
  "Français",
  "Deutsch",
  "हिन्दी (Hindi)",
];
const PREF_KEY = "em-preferences";
const DEFAULT_PREFS = {
  meetingReminders: true,
  emailUpdates: false,
  joinSounds: true,
  cameraOnJoin: false,
  micOnJoin: false,
  showPresence: true,
  allowGuestJoin: true,
};

function loadPrefs() {
  try {
    return {
      ...DEFAULT_PREFS,
      ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}"),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function SettingsPage() {
  const { user } = useApp();
  const location = useLocation();
  const loading = useSkeleton(500);
  const { toast, show, hide } = useToast();
  const fileRef = useRef(null);

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "profile",
  );
  const [profile, setProfile] = useState(() => ({
    name: "",
    email: "",
    role: "",
    timezone: "Asia/Kolkata",
    language: "English (United States)",
    bio: "",
    photo: "",
    photoUpdatedAt: null,
    ...getProfile(user),
  }));
  const [prefs, setPrefs] = useState(loadPrefs);
  const [sounds, setSounds] = useState(isSoundOn);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const photoCooldown = useMemo(() => getPhotoCooldown(profile), [profile]);
  const isPhotoLocked = photoCooldown.isLocked;
  const daysRemaining = photoCooldown.daysRemaining;

  const initials = useMemo(
    () =>
      (profile.name || "User")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase(),
    [profile.name],
  );
  const setField = (key) => (e) => {
    setProfile((p) => ({ ...p, [key]: e.target.value }));
    setDirty(true);
  };
  const togglePref = (key) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  };
  const toggleSounds = () => {
    const next = !sounds;
    setSounds(next);
    setSoundOn(next);
    if (next) playTone("success");
  };

  useEffect(() => {
    setProfile(getProfile(user));
    setDirty(false);
  }, [user]);

  // Your demoState.saveProfile(profile) stores the whole object, so merge the patch first.
  const persist = useCallback(
    (patch) => {
      saveProfile({ ...getProfile(user), ...patch }, user);
    },
    [user],
  );

  const handleFile = useCallback(
    async (file) => {
      if (isPhotoLocked) {
        show(
          `Profile photo can only be changed once every 7 days. You can change it again in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}.`,
          "error",
        );
        playTone("error");
        return;
      }
      const problem = validateImage(file);
      if (problem) {
        show(problem, "error");
        return;
      }
      setPhotoBusy(true);
      try {
        const photo = await fileToAvatar(file);
        const photoUpdatedAt = new Date().toISOString();
        persist({ photo, photoUpdatedAt }); // applies instantly in the sidebar and top bar
        if (getProfile(user).photo !== photo)
          throw new Error(
            "Your browser's storage is full, so the photo couldn't be saved.",
          );
        setProfile((p) => ({ ...p, photo, photoUpdatedAt }));
        show("Profile photo updated. It can be changed again in 7 days.");
      } catch (err) {
        show(err?.message || "Couldn't update your photo. Try again.", "error");
      } finally {
        setPhotoBusy(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [user, persist, show, isPhotoLocked, daysRemaining],
  );

  function removePhoto() {
    if (isPhotoLocked) {
      show(
        `Profile photo cannot be removed for ${daysRemaining} more day${daysRemaining > 1 ? "s" : ""}.`,
        "error",
      );
      playTone("error");
      return;
    }
    try {
      persist({ photo: "", photoUpdatedAt: null });
      setProfile((p) => ({ ...p, photo: "", photoUpdatedAt: null }));
      show("Profile photo removed", "info");
    } catch (err) {
      show(err?.message || "Couldn't remove your photo.", "error");
    }
  }

  async function save(event) {
    event?.preventDefault();
    if (!dirty) {
      show("You're all caught up. Nothing to save.", "info");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400)); // simulates the API call; remove when the backend is connected
      persist({
        name: profile.name.trim(),
        email: profile.email.trim(),
        role: profile.role.trim(),
        timezone: profile.timezone,
        language: profile.language || "English (United States)",
        bio: profile.bio.trim(),
        photo: profile.photo || "",
        photoUpdatedAt: profile.photoUpdatedAt || null,
      });
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
      setDirty(false);
      show("Settings saved");
    } catch (err) {
      show(err?.message || "Couldn't save your settings. Try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  const dropHandlers = {
    onDragOver: (e) => {
      if (isPhotoLocked) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      if (isPhotoLocked) {
        show(
          `Profile photo cannot be changed for ${daysRemaining} more day${daysRemaining > 1 ? "s" : ""}.`,
          "error",
        );
        playTone("error");
        return;
      }
      handleFile(e.dataTransfer.files?.[0]);
    },
  };

  return (
    <DashboardLayout
      page="settings"
      searchPlaceholder="Search settings, devices, or preferences"
    >
      {loading ? (
        <SettingsSkeleton />
      ) : (
        <>
          <div className="em-page-heading">
            <div>
              <span className="em-page-kicker">WORKSPACE PREFERENCES</span>
              <h1>Settings</h1>
              <p>
                Manage your account, meeting experience, notifications, and
                privacy.
              </p>
            </div>
            <button
              type="submit"
              form="settings-form"
              className="em-button-primary em-save-top"
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={16} className="em-spin" />
              ) : (
                <Save size={16} />
              )}{" "}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          <nav className="em-settings-tabs" aria-label="Settings categories">
            {settingTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={activeTab === id ? "active" : ""}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>

          <form
            id="settings-form"
            className="em-settings-content"
            onSubmit={save}
          >
            {activeTab === "profile" && (
              <>
                <section className="em-settings-card">
                  <div className="em-personal-profile-head">
                    <h2>Personal Profile</h2>
                    <p>
                      Your public details visible to teammates and participants
                      in meetings.
                    </p>
                  </div>

                  <div className="em-profile-picture-row" {...dropHandlers}>
                    <div className="em-profile-picture-left">
                      <div className="em-avatar em-picture-avatar">
                        {profile.photo ? (
                          <img
                            src={profile.photo}
                            alt="Profile"
                            decoding="async"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="em-picture-meta">
                        <b>Profile Picture</b>
                        <small>
                          PNG, JPG or WebP up to 5MB. Circular cropped.
                        </small>
                        {isPhotoLocked && (
                          <span
                            className="em-photo-lock-notice"
                            title={
                              photoCooldown.nextDate instanceof Date &&
                              !Number.isNaN(photoCooldown.nextDate.getTime())
                                ? `Next photo change available on ${photoCooldown.nextDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                                : undefined
                            }
                          >
                            <LockKeyhole size={11} /> Photo locked · Next change availablein {daysRemaining} day{daysRemaining > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="em-picture-actions">
                      <button
                        type="button"
                        className={`em-change-photo-btn ${isPhotoLocked ? "locked" : ""}`}
                        onClick={() => {
                          if (isPhotoLocked) {
                            show(
                              `Profile photo can only be changed once every 7 days. You can change it again in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}.`,
                              "error",
                            );
                            playTone("error");
                            return;
                          }
                          fileRef.current?.click();
                        }}
                        disabled={photoBusy || isPhotoLocked}
                        title={
                          isPhotoLocked
                            ? `Profile photo is locked for ${daysRemaining} more day${daysRemaining > 1 ? "s" : ""}`
                            : "Change photo"
                        }
                      >
                        {photoBusy ? (
                          <>
                            <Loader2 size={13} className="em-spin" /> Uploading…
                          </>
                        ) : isPhotoLocked ? (
                          <>
                            <LockKeyhole size={13} /> Change Photo
                          </>
                        ) : (
                          "Change Photo"
                        )}
                      </button>
                      {profile.photo && (
                        <button
                          type="button"
                          className="em-remove-photo-link"
                          onClick={removePhoto}
                          disabled={isPhotoLocked}
                          title={
                            isPhotoLocked
                              ? `Cannot remove photo during 7-day cooldown (${daysRemaining}d remaining)`
                              : "Remove photo"
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      disabled={isPhotoLocked}
                    />
                  </div>

                  <div className="em-settings-fields">
                    <label>
                      Full name
                      <input
                        value={profile.name}
                        onChange={setField("name")}
                        required
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        type="email"
                        value={profile.email}
                        onChange={setField("email")}
                        required
                      />
                    </label>
                    <label className="wide">
                      Role / job title
                      <input
                        value={profile.role}
                        onChange={setField("role")}
                        placeholder="e.g. Full Stack Developer"
                      />
                    </label>
                    <label>
                      Time zone
                      <select
                        value={profile.timezone}
                        onChange={setField("timezone")}
                      >
                        {TIMEZONES.map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Interface Language
                      <select
                        value={profile.language || "English (United States)"}
                        onChange={setField("language")}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="em-bio-field wide">
                      About
                      <textarea
                        value={profile.bio}
                        onChange={setField("bio")}
                        maxLength={200}
                        placeholder="A short line about you"
                      />
                    </label>
                  </div>
                </section>

                <section className="em-settings-card">
                  <div className="em-settings-card-head">
                    <span className="em-settings-icon teal">
                      <LockKeyhole size={19} />
                    </span>
                    <div>
                      <h2>Account security</h2>
                      <p>Keep your workspace account protected.</p>
                    </div>
                  </div>
                  <div className="em-settings-row">
                    <div>
                      <b>Password</b>
                      <small>
                        Change your password to keep your account secure.
                      </small>
                    </div>
                    <button
                      type="button"
                      className="em-button-secondary"
                      onClick={() =>
                        show(
                          "Password changes need the backend. Not available in this demo yet.",
                          "info",
                        )
                      }
                    >
                      Change password
                    </button>
                  </div>
                </section>
              </>
            )}

            {activeTab === "devices" && (
              <>
                <section className="em-settings-card">
                  <div className="em-settings-card-head">
                    <span className="em-settings-icon blue">
                      <Monitor size={19} />
                    </span>
                    <div>
                      <h2>Audio & video devices</h2>
                      <p>Choose the devices used when you join a meeting.</p>
                    </div>
                  </div>
                  <div className="em-settings-fields">
                    <label>
                      Camera
                      <select defaultValue="default">
                        <option value="default">System default camera</option>
                        <option value="camera">Integrated camera</option>
                      </select>
                    </label>
                    <label>
                      Microphone
                      <select defaultValue="default">
                        <option value="default">
                          System default microphone
                        </option>
                        <option value="mic">Integrated microphone</option>
                      </select>
                    </label>
                    <label>
                      Speaker
                      <select defaultValue="default">
                        <option value="default">System default speaker</option>
                        <option value="speaker">Built-in speakers</option>
                      </select>
                    </label>
                  </div>
                  <div className="em-device-preview">
                    <span className="em-device-preview-icon">
                      <Video size={21} />
                    </span>
                    <div>
                      <b>Device preview</b>
                      <small>
                        Real device selection becomes available when meeting
                        media is connected.
                      </small>
                    </div>
                    <span className="em-coming-soon">Demo mode</span>
                  </div>
                </section>
                <section className="em-settings-card">
                  <div className="em-settings-card-head">
                    <span className="em-settings-icon orange">
                      <SlidersHorizontal size={19} />
                    </span>
                    <div>
                      <h2>Join preferences</h2>
                      <p>Set your default microphone and camera state.</p>
                    </div>
                  </div>
                  <ToggleRow
                    label="Turn on camera when joining"
                    description="Join meetings with your camera enabled."
                    checked={prefs.cameraOnJoin}
                    onChange={() => togglePref("cameraOnJoin")}
                  />
                  <ToggleRow
                    label="Turn on microphone when joining"
                    description="Join meetings with your microphone enabled."
                    checked={prefs.micOnJoin}
                    onChange={() => togglePref("micOnJoin")}
                  />
                </section>
              </>
            )}

            {activeTab === "notifications" && (
              <section className="em-settings-card">
                <div className="em-settings-card-head">
                  <span className="em-settings-icon purple">
                    <Bell size={19} />
                  </span>
                  <div>
                    <h2>Notification preferences</h2>
                    <p>
                      Choose which reminders and updates you want to receive.
                    </p>
                  </div>
                </div>
                <ToggleRow
                  label="Meeting reminders"
                  description="Get a reminder before a scheduled meeting."
                  checked={prefs.meetingReminders}
                  onChange={() => togglePref("meetingReminders")}
                />
                <ToggleRow
                  label="Email updates"
                  description="Receive product and workspace updates by email."
                  checked={prefs.emailUpdates}
                  onChange={() => togglePref("emailUpdates")}
                />
                <ToggleRow
                  label="Join and leave sounds"
                  description="Play a subtle sound for meeting entry and exit events."
                  checked={prefs.joinSounds}
                  onChange={() => togglePref("joinSounds")}
                />
                <ToggleRow
                  label="Interface sounds"
                  description="Short tones for confirmations, errors and notifications. Applies immediately."
                  checked={sounds}
                  onChange={toggleSounds}
                />
                <div className="em-info-banner">
                  <Volume2 size={18} />
                  <span>
                    Sound preferences are local demo settings and do not yet
                    sync across devices.
                  </span>
                </div>
              </section>
            )}

            {activeTab === "privacy" && (
              <section className="em-settings-card">
                <div className="em-settings-card-head">
                  <span className="em-settings-icon green">
                    <ShieldCheck size={19} />
                  </span>
                  <div>
                    <h2>Privacy & permissions</h2>
                    <p>Control how your presence and meetings are shared.</p>
                  </div>
                </div>
                <ToggleRow
                  label="Show availability status"
                  description="Let teammates see when you're available."
                  checked={prefs.showPresence}
                  onChange={() => togglePref("showPresence")}
                />
                <ToggleRow
                  label="Allow guests to join with a link"
                  description="Anyone with a valid meeting link can request to join."
                  checked={prefs.allowGuestJoin}
                  onChange={() => togglePref("allowGuestJoin")}
                />
                <div className="em-privacy-note">
                  <ShieldCheck size={19} />
                  <div>
                    <b>Your privacy matters</b>
                    <p>
                      These controls currently update the demo interface.
                      Enforcing permissions requires backend support.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <div className="em-settings-bottom">
              <span>{dirty ? "You have unsaved changes." : ""}</span>
              {/* <button
                className="em-button-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 size={16} className="em-spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                Save changes
              </button> */}
            </div>
          </form>
        </>
      )}
      <Toast toast={toast} onClose={hide} />
    </DashboardLayout>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="em-settings-row">
      <div>
        <b>{label}</b>
        <small>{description}</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`em-switch ${checked ? "on" : ""}`}
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  );
}
