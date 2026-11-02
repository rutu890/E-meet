const PROFILE_KEY = "euodoo.profile.v1";
const AUTH_KEY = "euodoomeet-demo-user";
const STATUS_KEY = "euodoo.status.v1";
const NOTIFICATIONS_KEY = "euodoo.notifications.v1";

export const defaultProfile = { name: "User", email: "user@euodoo.com", timezone: "Asia/Kolkata", role: "User", bio: "", photo: "", photoUpdatedAt: null };
export const PHOTO_COOLDOWN_DAYS = 7;
export const PHOTO_COOLDOWN_MS = PHOTO_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function getPhotoCooldown(profile) {
  if (!profile?.photo || !profile?.photoUpdatedAt) {
    return { isLocked: false, daysRemaining: 0, nextDate: null };
  }
  const lastUpdated = new Date(profile.photoUpdatedAt).getTime();
  if (isNaN(lastUpdated)) {
    return { isLocked: false, daysRemaining: 0, nextDate: null };
  }
  const diff = Date.now() - lastUpdated;
  if (diff >= PHOTO_COOLDOWN_MS) {
    return { isLocked: false, daysRemaining: 0, nextDate: null };
  }
  const msRemaining = PHOTO_COOLDOWN_MS - diff;
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  const nextDate = new Date(lastUpdated + PHOTO_COOLDOWN_MS);
  return { isLocked: true, daysRemaining, nextDate };
}

export const defaultNotifications = [
  { id: "meeting-reminder", title: "Meeting reminder", message: "Project Discussion starts soon.", detail: "Your Project Discussion meeting is scheduled to begin shortly. Open Home to review the meeting details.", category: "Meeting", time: "Today · 10:00 AM", read: false, color: "green" },
  { id: "workspace-ready", title: "Workspace ready", message: "Your meeting space is ready to use.", detail: "Your Euodoo Meet workspace is ready. You can create a meeting, join with a code, or update your preferences in Settings.", category: "Workspace", time: "Today · 9:15 AM", read: false, color: "purple" },
  { id: "profile-tip", title: "Complete your profile", message: "Add a profile photo and a short bio.", detail: "A profile photo and short bio help teammates recognise you in your workspace.", category: "Account", time: "Yesterday · 4:30 PM", read: true, color: "blue" },
  { id: "settings-saved", title: "Settings updated", message: "Your workspace preferences were saved.", detail: "Your demo preferences were saved in this browser. They are not synced to other devices until a backend is connected.", category: "Settings", time: "Yesterday · 2:10 PM", read: true, color: "orange" },
];
function read(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { console.warn("Could not save demo data", error); } }

function getCurrentUserFallback() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

export function getProfileKey(user) {
  const u = user || getCurrentUserFallback();
  const email = u?.email?.trim().toLowerCase();
  if (email) {
    return `euodoo.profile.${email}`;
  }
  return PROFILE_KEY;
}

export function getProfile(user) {
  const u = user || getCurrentUserFallback();
  const email = u?.email?.trim().toLowerCase();
  const key = getProfileKey(u);
  let saved = read(key, null);

  if (!saved && email) {
    const legacy = read(PROFILE_KEY, null);
    if (legacy?.email?.trim().toLowerCase() === email) {
      saved = legacy;
      write(key, saved);
    }
  }

  const data = saved || {};
  if (data.photo && !data.photoUpdatedAt) {
    data.photoUpdatedAt = new Date().toISOString();
    write(key, data);
  }

  const fallbackName = u?.name?.trim() || defaultProfile.name;
  const fallbackEmail = u?.email?.trim() || defaultProfile.email;

  return {
    ...defaultProfile,
    role: "User",
    timezone: "Asia/Kolkata",
    language: "English (United States)",
    bio: "",
    photo: "",
    photoUpdatedAt: null,
    ...data,
    name: data.name || fallbackName,
    email: fallbackEmail,
  };
}

export function saveProfile(profile, user) {
  const u = user || getCurrentUserFallback();
  const key = getProfileKey(u);
  write(key, profile);
  try {
    window.dispatchEvent(new Event("euodoo-profile-updated"));
  } catch {}
}
export function getStatus() { return read(STATUS_KEY, "Available"); }
export function saveStatus(status) { write(STATUS_KEY, status); }
export function getNotifications() { return read(NOTIFICATIONS_KEY, defaultNotifications); }
export function saveNotifications(notifications) { write(NOTIFICATIONS_KEY, notifications); }
