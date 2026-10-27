import { Bell, ChevronDown, HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import Avatar from "./Avatar";
export default function Topbar() {
  const {user,logout}=useApp(); const [open,setOpen]=useState(false);
  return <header className="topbar"><a className="brand" href="/"><span className="brand-mark">▣</span><span>Meet<span className="brand-accent">Space</span></span></a><div className="topbar-actions"><button className="icon-btn" title="Help"><HelpCircle size={18}/></button><button className="icon-btn" title="Notifications"><Bell size={18}/></button><div className="profile-wrap"><button className="profile-btn" onClick={()=>setOpen(!open)}><Avatar initials={user?.initials} size="sm"/><span>{user?.name}</span><ChevronDown size={15}/></button>{open&&<div className="profile-menu"><strong>{user?.email}</strong><button onClick={logout}><LogOut size={15}/> Sign out</button></div>}</div></div></header>;
}