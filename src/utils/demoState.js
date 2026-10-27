const PROFILE_KEY = "euodoo.profile.v1";
const STATUS_KEY = "euodoo.status.v1";
const NOTIFICATIONS_KEY = "euodoo.notifications.v1";

export const defaultProfile = { name: "Kiran S", email: "kiran@euodoo.com", timezone: "Asia/Kolkata", role: "User", bio: "", photo: "" };
export const defaultNotifications = [
  { id: "meeting-reminder", title: "Meeting reminder", message: "Project Discussion starts soon.", detail: "Your Project Discussion meeting is scheduled to begin shortly. Open Home to review the meeting details.", category: "Meeting", time: "Today · 10:00 AM", read: false, color: "green" },
  { id: "workspace-ready", title: "Workspace ready", message: "Your meeting space is ready to use.", detail: "Your Euodoo Meet workspace is ready. You can create a meeting, join with a code, or update your preferences in Settings.", category: "Workspace", time: "Today · 9:15 AM", read: false, color: "purple" },
  { id: "profile-tip", title: "Complete your profile", message: "Add a profile photo and a short bio.", detail: "A profile photo and short bio help teammates recognise you in your workspace.", category: "Account", time: "Yesterday · 4:30 PM", read: true, color: "blue" },
  { id: "settings-saved", title: "Settings updated", message: "Your workspace preferences were saved.", detail: "Your demo preferences were saved in this browser. They are not synced to other devices until a backend is connected.", category: "Settings", time: "Yesterday · 2:10 PM", read: true, color: "orange" },
];
function read(key, fallback) { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { console.warn("Could not save demo data", error); } }
export function getProfile(user) { const saved = read(PROFILE_KEY, {}); return { ...defaultProfile, name: user?.name || defaultProfile.name, email: user?.email || defaultProfile.email, ...saved }; }
export function saveProfile(profile) { write(PROFILE_KEY, profile); try { window.dispatchEvent(new Event("euodoo-profile-updated")); } catch {} }
export function getStatus() { return read(STATUS_KEY, "Available"); }
export function saveStatus(status) { write(STATUS_KEY, status); }
export function getNotifications() { return read(NOTIFICATIONS_KEY, defaultNotifications); }
export function saveNotifications(notifications) { write(NOTIFICATIONS_KEY, notifications); }
