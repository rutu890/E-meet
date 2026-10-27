import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { meetingService } from "../services/meetingService";
import MockMeetingRoom from "../features/meeting/MockMeetingRoom";

/**
 * Meeting route adapter.
 * Reads the meeting title/host status from router state and passes a small
 * success toast to the room when the homepage just created or joined a meeting.
 */
export default function MeetingPage() {
  const { meetingId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();

  const participants = useMemo(
    () => meetingService.getParticipants(user),
    [user]
  );

  const notice = location.state?.notice || "";
  const isHost = location.state?.isHost === true;

  return (
    <MockMeetingRoom
      meetingId={decodeURIComponent(meetingId)}
      title={location.state?.title || "Team meeting"}
      isHost={isHost}
      initialParticipants={participants}
      initialNotice={notice}
      onLeave={() => navigate("/", { replace: true, state: { meetingLeft: true } })}
    />
  );
}
