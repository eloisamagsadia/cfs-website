"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const ICONS:Record<string,React.ReactNode>={
  event_reminder:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  order_update:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  community_reply:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  community_mention:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>,
  badge_earned:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  new_follower:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>,
  donation_ack:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  new_report:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  announcement:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  new_message:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  support_reply:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  default:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};
const TC:Record<string,{color:string;label:string}>={
  event_reminder:{color:"#3CCE2A",label:"Events"},
  order_update:{color:"#F07228",label:"Orders"},
  community_reply:{color:"#F5C82A",label:"Community"},
  community_mention:{color:"#F5C82A",label:"Community"},
  badge_earned:{color:"#8EE440",label:"Badges"},
  new_follower:{color:"#3CCE2A",label:"Social"},
  donation_ack:{color:"#F04060",label:"Donations"},
  new_report:{color:"#3CCE2A",label:"Reports"},
  announcement:{color:"#F07228",label:"Announcements"},
  new_message:{color:"#3CCE2A",label:"Messages"},
  support_reply:{color:"#F07228",label:"Support"},
};
const FILTERS=["ALL","Events","Orders","Community","Badges","Social","Donations","Announcements"];
const TYPE_LABELS: Record<string,string> = {
  new_message: "Messages",
  community_reply: "Community",
  community_mention: "Community",
  new_follower: "Social",
  badge_earned: "Badges",
  event_reminder: "Events",
  order_update: "Orders",
  donation_ack: "Donations",
  announcement: "Announcements",
  support_reply: "Support",
  new_report: "Reports",
};
function getGroup(type:string){ return TYPE_LABELS[type] ?? "General"; }
function timeAgo(d:string){
  const diff=Date.now()-new Date(d).getTime();
  const m=Math.floor(diff/60000);
  if(m<1)return"just now";if(m<60)return`${m}m ago`;
  const h=Math.floor(m/60);if(h<24)return`${h}h ago`;
  return`${Math.floor(h/24)}d ago`;
}
function playSound(){
  try{
    const ctx=new AudioContext(),osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880,ctx.currentTime);
    osc.frequency.setValueAtTime(1100,ctx.currentTime+0.08);
    gain.gain.setValueAtTime(0.12,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
    osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.4);
  }catch{}
}
export default function NotificationsClient({initialNotifications,userId}:{initialNotifications:any[];userId:string}){
  const [notifications,setNotifications]=useState(initialNotifications);
  const [filter,setFilter]=useState("ALL");
  const [markingAll,setMarkingAll]=useState(false);
  const [soundOn,setSoundOn]=useState(false);
  const router=useRouter();
  useEffect(()=>{setSoundOn(localStorage.getItem("cfs_notif_sound")==="true");},[]);
  useEffect(()=>{
    async function poll() {
      try {
        const res = await fetch("/api/notifications");
        const d = await res.json();
        const fresh = d.notifications ?? [];
        setNotifications(prev => {
          if (fresh.length > prev.length && localStorage.getItem("cfs_notif_sound") === "true") playSound();
          return fresh;
        });
      } catch {}
    }
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  },[userId]);
  function toggleSound(){const n=!soundOn;setSoundOn(n);localStorage.setItem("cfs_notif_sound",String(n));if(n)playSound();}
  async function markRead(id:string){
    setNotifications(prev=>prev.map(n=>n.id===id?{...n,is_read:true}:n));
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  }
  async function markAllRead(){
    setMarkingAll(true);
    setNotifications(prev=>prev.map(n=>({...n,is_read:true})));
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({all:true})});
    setMarkingAll(false);
  }
  async function deleteNotification(id:string){
    setNotifications(prev=>prev.filter(n=>n.id!==id));
    await fetch("/api/notifications",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  }
  async function clearRead(){
    setNotifications(prev=>prev.filter(n=>!n.is_read));
    await fetch("/api/notifications",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({clearRead:true})});
  }
  async function handleView(notif:any){
    if(!notif.is_read)await markRead(notif.id);
    if(notif.link)router.push(notif.link);
  }
  const filtered=notifications.filter(n=>filter==="ALL"||TC[n.type]?.label===filter);
  const groups:Record<string,any[]>={};
  filtered.forEach(n=>{const g=getGroup(n.type);if(!groups[g])groups[g]=[];groups[g].push(n);});
  const unreadCount=notifications.filter(n=>!n.is_read).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h1 style={{fontFamily:R,fontSize:"1.6rem",color:"#1B3A2D",letterSpacing:"3px",marginBottom:"4px"}}>NOTIFICATIONS</h1>
          <p style={{fontFamily:B,fontSize:"13px",color:"#4A7C59"}}>
            {unreadCount>0?<span style={{color:"#F04060"}}>{unreadCount} unread</span>:"All caught up!"}
            {" · "}{notifications.length} total
          </p>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={toggleSound} style={{display:"flex",alignItems:"center",gap:"5px",fontFamily:R,fontSize:"11px",letterSpacing:"1px",background:soundOn?"#E8F0E4":"transparent",color:soundOn?"#3CCE2A":"#5A7A60",border:`1.5px solid ${soundOn?"#3CCE2A":"#DDE8DD"}`,borderRadius:"20px",padding:"6px 12px",cursor:"pointer"}}>
            <span style={{fontSize:"13px"}}>{soundOn?"🔔":"🔕"}</span>{soundOn?"SOUND ON":"SOUND OFF"}
          </button>
          {unreadCount>0&&<button onClick={markAllRead} disabled={markingAll} style={{fontFamily:R,fontSize:"11px",color:"#3CCE2A",background:"transparent",border:"1.5px solid #DDE8DD",borderRadius:"20px",padding:"6px 14px",cursor:"pointer",letterSpacing:"1px"}}>{markingAll?"...":"MARK ALL READ ✓"}</button>}
          {notifications.some(n=>n.is_read)&&<button onClick={clearRead} style={{fontFamily:R,fontSize:"11px",color:"#5A7A60",background:"transparent",border:"1.5px solid #DDE8DD",borderRadius:"20px",padding:"6px 14px",cursor:"pointer",letterSpacing:"1px"}}>CLEAR READ</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {FILTERS.map(f=>{
          const count=f==="ALL"?notifications.filter(n=>!n.is_read).length:notifications.filter(n=>!n.is_read&&TC[n.type]?.label===f).length;
          const isActive=filter===f;
          return(
            <button key={f} onClick={()=>setFilter(f)} style={{fontFamily:R,fontSize:"10px",letterSpacing:"1px",background:isActive?"#E8F0E4":"transparent",border:`1.5px solid ${isActive?"#3CCE2A":"#DDE8DD"}`,color:isActive?"#3CCE2A":"#5A7A60",borderRadius:"20px",padding:"5px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}>
              {f.toUpperCase()}
              {count>0&&<span style={{background:"#F04060",color:"#1B3A2D",borderRadius:"20px",padding:"0 5px",fontSize:"9px",fontFamily:R,lineHeight:"16px",display:"inline-block"}}>{count}</span>}
            </button>
          );
        })}
      </div>
      {filtered.length===0?(
        <div style={{background:"#FFFFFF",border:"2px solid #DDE8DD",borderRadius:"12px",padding:"56px 24px",textAlign:"center"}}>
          <div style={{fontSize:"48px",marginBottom:"14px"}}>🔔</div>
          <div style={{fontFamily:R,fontSize:"14px",color:"#5A7A60",letterSpacing:"2px",marginBottom:"8px"}}>NO NOTIFICATIONS</div>
          <div style={{fontFamily:B,fontSize:"13px",color:"#3A5030"}}>{filter==="ALL"?"You're all caught up!":` No ${filter.toLowerCase()} notifications`}</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
          {Object.keys(groups).sort().map(group=>{
            const gn=groups[group]??[];
            const gu=gn.filter((n:any)=>!n.is_read).length;
            return(
              <div key={group}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <span style={{fontFamily:R,fontSize:"11px",color:"#5A7A60",letterSpacing:"2px"}}>{group}</span>
                  {gu>0&&<span style={{background:"#F04060",color:"#1B3A2D",borderRadius:"20px",padding:"1px 8px",fontSize:"10px",fontFamily:R}}>{gu} unread</span>}
                  <div style={{flex:1,height:"1px",background:"#DDE8DD"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {gn.map((notif:any)=>{
                    const cfg=TC[notif.type]??{color:"#5A7A60",label:"General"};
                    const icon=ICONS[notif.type]??ICONS.default;
                    return(
                      <div key={notif.id} style={{background:notif.is_read?"#FFFFFF":"#1E3018",border:`2px solid ${notif.is_read?"#DDE8DD":cfg.color+"60"}`,borderRadius:"10px",padding:"12px 16px",display:"flex",gap:"12px",alignItems:"flex-start",opacity:notif.is_read?0.75:1,transition:"all 0.2s"}}>
                        <div style={{width:"36px",height:"36px",borderRadius:"8px",background:cfg.color+"20",border:`1.5px solid ${cfg.color}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:cfg.color}}>{icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px",marginBottom:"3px"}}>
                            <span style={{fontFamily:R,fontSize:"12px",color:notif.is_read?"#5A7A60":cfg.color,letterSpacing:"1px"}}>{notif.title}</span>
                            <span style={{fontFamily:B,fontSize:"11px",color:"#5A7A60",flexShrink:0}}>{timeAgo(notif.created_at)}</span>
                          </div>
                          <div style={{fontFamily:B,fontSize:"13px",color:notif.is_read?"#5A7A60":"#5A7A60",lineHeight:1.6}}>{notif.message}</div>
                          {notif.link&&<button onClick={()=>handleView(notif)} style={{fontFamily:R,fontSize:"10px",color:cfg.color,background:"transparent",border:"none",cursor:"pointer",letterSpacing:"1.5px",padding:"0",marginTop:"6px"}}>VIEW →</button>}
                          {!notif.is_read&&!notif.link&&<button onClick={()=>markRead(notif.id)} style={{fontFamily:B,fontSize:"11px",color:"#5A7A60",background:"transparent",border:"none",cursor:"pointer",padding:"0",marginTop:"4px"}}>mark as read</button>}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0}}>
                          {!notif.is_read&&<div style={{width:"7px",height:"7px",borderRadius:"50%",background:cfg.color}}/>}
                          <button onClick={()=>deleteNotification(notif.id)} style={{background:"transparent",border:"none",color:"#3A5030",cursor:"pointer",fontSize:"12px",padding:"2px",lineHeight:1}} title="Dismiss">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
