
const STORAGE_KEY = "euodoo-meet-demo-store-v1";
const CHANGE_EVENT = "euodoo-meet-store-change";

const makeId = () =>
  `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

function normalizeId(value = "") {
  const raw = String(value).trim();
  const match = raw.match(/\/meeting\/([^/?#]+)/i);
  return decodeURIComponent(match ? match[1] : raw).trim().toUpperCase();
}

function readStore() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{"meetings":{}}'
    );
  } catch {
    return { meetings: {} };
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function updateMeeting(meetingId, updater) {
  const store = readStore();
  const id = normalizeId(meetingId);
  const meeting = store.meetings[id];

  if (!meeting || meeting.status !== "active") {
    throw new Error("This meeting is invalid or no longer available.");
  }

  store.meetings[id] = updater(meeting);
  writeStore(store);
  return store.meetings[id];
}

export const meetingService = {
  async createMeeting({ title = "Quick meeting", hostName = "Host" } = {}) {
    const meetingId = makeId();
    const store = readStore();

    store.meetings[meetingId] = {
      meetingId,
      title,
      hostName,
      status: "active",
      createdAt: Date.now(),
      participants: [],
    };

    writeStore(store);
    return { meetingId, title, hostName, mode: "demo" };
  },

  async joinMeeting(value) {
    const id = normalizeId(value);
    const meeting = readStore().meetings[id];

    if (!id || !meeting || meeting.status !== "active") {
      throw new Error("Invalid meeting code or link.");
    }

    return {
      meetingId: id,
      title: meeting.title,
      mode: "demo",
    };
  },

  async getParticipants(meetingId) {
    // mock data until LiveKit / real backend is wired in
    return [
      { id: "host", name: "You", isHost: true, muted: false, videoOff: false },
      { id: "p2", name: "Sneha", isHost: false, muted: true, videoOff: false },
    ];
  },


  getMeeting(meetingId) {
    return readStore().meetings[normalizeId(meetingId)] || null;
  },

  requestToJoin(meetingId, { name = "Guest", email = "" } = {}) {
    const participantId = `guest-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    updateMeeting(meetingId, (meeting) => ({
      ...meeting,
      participants: [
        ...(meeting.participants || []).filter(
          (person) => person.id !== participantId
        ),
        {
          id: participantId,
          name: name.trim() || "Guest",
          email: email.trim(),
          initials:
            (name.trim() || "Guest")
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase(),
          color: "teal",
          status: "waiting",
          requestedAt: Date.now(),
        },
      ],
    }));

    return participantId;
  },

  getParticipantStatus(meetingId, participantId) {
    return (
      this.getMeeting(meetingId)?.participants?.find(
        (person) => person.id === participantId
      ) || null
    );
  },

  setParticipantStatus(meetingId, participantId, status) {
    if (!["waiting", "admitted", "denied"].includes(status)) {
      throw new Error("Invalid participant status.");
    }

    return updateMeeting(meetingId, (meeting) => ({
      ...meeting,
      participants: (meeting.participants || []).map((person) =>
        person.id === participantId
          ? { ...person, status, updatedAt: Date.now() }
          : person
      ),
    }));
  },

  setParticipantsStatus(meetingId, participantIds, status) {
    const ids = new Set(participantIds);

    return updateMeeting(meetingId, (meeting) => ({
      ...meeting,
      participants: (meeting.participants || []).map((person) =>
        ids.has(person.id)
          ? { ...person, status, updatedAt: Date.now() }
          : person
      ),
    }));
  },

  subscribe(meetingId, callback) {
    const refresh = () => callback(this.getMeeting(meetingId));

    const onStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, refresh);
    refresh();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, refresh);
    };
  },
};
