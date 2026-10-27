# Euodoo meet static demo

## Run
Install Node.js, then run:
```bash
npm install
npm run dev
```
Open the local URL shown by Vite.

Build for deployment:
```bash
npm run build
npm run preview
```

This is a frontend-only prototype. Login, meetings, participants, chat, waiting-room approval, host actions, screen sharing, and bandwidth controls are simulated locally. It does not connect remote users or transmit actual meeting media.

## Upgrade later
- Replace `src/services/authService.js` with your real authentication API.
- Replace `src/services/meetingService.js` with backend meeting APIs.
- Replace `src/features/meeting/MockMeetingRoom.jsx` with a LiveKit room implementation.
- Enforce admission and host permissions on the backend, not only in React.
