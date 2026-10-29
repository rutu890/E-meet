import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { meetingService } from "../services/meetingService";
import MockMeetingRoom from "../features/meeting/MockMeetingRoom";

export default function MeetingPage() {
  const { meetingId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();

  const participants = useMemo(
    () => meetingService.getParticipants(user),
    [user]
  );

  return (
    <MockMeetingRoom
      meetingId={decodeURIComponent(meetingId)}
      title={location.state?.title || "Team meeting"}
      isHost={location.state?.isHost === true}
      initialParticipants={participants}
      initialNotice={location.state?.notice || ""}
      onLeave={() =>
        navigate("/", {
          replace: true,
          state: { meetingLeft: true },
        })
      }
    />
  );
}