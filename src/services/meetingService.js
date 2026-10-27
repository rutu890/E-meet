const makeId = () => Math.random().toString(36).slice(2,6).toUpperCase() + "-" + Math.random().toString(36).slice(2,6).toUpperCase();
export const meetingService = {
  async createMeeting({ title = "Team sync", hostName = "You" } = {}) { return { meetingId: makeId(), title, hostName, mode: "demo" }; },
  async joinMeeting(meetingId) { const id = String(meetingId || "").trim().toUpperCase().replace(/^.*\/meeting\//, ""); if (!id) throw new Error("Enter a meeting code or link."); return { meetingId: id, mode: "demo" }; },
  getParticipants(user) { return [
    {id:"p1",name:user?.name||"You",initials:user?.initials||"YO",color:"lavender",isYou:true,muted:false,cameraOn:true,role:"Host"},
    {id:"p2",name:"Aarav Mehta",initials:"AM",color:"blue",muted:false,cameraOn:true,role:"Participant"},
    {id:"p3",name:"Priya Sharma",initials:"PS",color:"peach",muted:true,cameraOn:true,role:"Participant"},
    {id:"p4",name:"Rohan Patel",initials:"RP",color:"mint",muted:false,cameraOn:false,role:"Participant"}
  ]; }
};
