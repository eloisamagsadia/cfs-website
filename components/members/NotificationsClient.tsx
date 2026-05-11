"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const TC:Record<string,{icon:string;color:string;label:string}>={
  event_reminder:{icon:"🎫",color:"#3CCE2A",label:"Events"},
  order_update:{icon:"🛍",color:"#F07228",label:"Orders"},
  community_reply:{icon:"💬",color:"#F5C82A",label:"Community"},
  community_mention:{icon:"📢",color:"#F5C82A",label:"Community"},
  badge_earned:{icon:"⭐",color:"#8EE440",label:"Badges"},
  new_follower:{icon:"👤",color:"#3CCE2A",label:"Social"},
  donation_ack:{icon:"♥",color:"#F04060",label:"Donations"},
  new_report:{icon:"📋",color:"#3CCE2A",label:"Reports"},
  announcement:{icon:"📣",color:"#F07228",label:"Announcements"},
};
const FILTERS=["ALL","Events","Orders","Community","Badges","Social","Donations","Announcements"];
const GROUP_ORDER=["TODAY","YESTERDAY","THIS WEEK","OLDER"];
function getGroup(d:string){
  const date=new Date(d),now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const yesterday=new Date(today.getTime()-86400000);
  const weekAgo=new Date(today.getTime()-6*86400000);
  const nd=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  if(nd>=today)return"TODAY";
  if(nd>=yesterday)return"YESTERDAY";
  if(nd>=weekAgo)return"THIS WEEK";
  return"OLDER";
}
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
  const supabase=createClient();
  const router=useRouter();
  useEffect(()=>{setSoundOn(localStorage.getItem("cfs_notif_sound")==="true");},[]);
  useEffect(()=>{
    const ch=supabase.channel(`np_${userId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${userId}`},
        p=>{setNotifications(prev=>[p.new as any,...prev]);if(localStorage.getItem("cfs_notif_sound")==="true")playSound();})
      .subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[userId]);
  function toggleSound(){const n=!soundOn;setSoundOn(n);localStorage.setItem("cfs_notif_sound",String(n));if(n)playSound();}
  async function markRead(id:string){
    setNotifications(prev=>prev.map(n=>n.id===id?{...n,is_read:true}:n));
    await supabase.from("notifications").update({is_read:true}).eq("id",id);
  }
  async function markAllRead(){
    setMarkingAll(true);
    setNotifications(prev=>prev.map(n=>({...n,is_read:true})));
    await supabase.from("notifications").update({is_read:true}).eq("user_id",userId).eq("is_read",false);
    setMarkingAll(false);
  }
  async function deleteNotification(id:string){
    setNotifications(prev=>prev.filter(n=>n.id!==id));
    await supabase.from("notifications").delete().eq("id",id);
  }
  async function clearRead(){
    setNotifications(prev=>prev.filter(n=>!n.is_read));
    await supabase.from("notifications").delete().eq("user_id",userId).eq("is_read",true);
  }
  async function handleView(notif:any){
    if(!notif.is_read)await markRead(notif.id);
    if(notif.link)router.push(notif.link);
  }
  const filtered=notifications.filter(n=>filter==="ALL"||TC[n.type]?.label===filter);
  const groups:Record<string,any[]>={};
  filtered.forEach(n=>{const g=getGroup(n.created_at);if(!groups[g])groups[g]=[];groups[g].push(n);});
  const unreadCount=notifications.filter(n=>!n.is_read).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h1 style={{fontFamily:R,fontSize:"1.6rem",color:"#F0EAD6",letterSpacing:"3px",marginBottom:"4px"}}>NOTIFICATIONS</h1>
          <p style={{fontFamily:B,fontSize:"13px",color:"#8AAA78"}}>
            {unreadCount>0?<span style={{color:"#F04060"}}>{unreadCount} unread</span>:"All caught up!"}
            {" · "}{notifications.length} total
          </p>
        </div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={toggleSound} style={{display:"flex",alignItems:"center",gap:"5px",fontFamily:R,fontSize:"11px",letterSpacing:"1px",background:soundOn?"#1A3D14":"transparent",color:soundOn?"#3CCE2A":"#5A7A50",border:`1.5px solid ${soundOn?"#3CCE2A":"#2C4820"}`,borderRadius:"20px",padding:"6px 12px",cursor:"pointer"}}>
            <span style={{fontSize:"13px"}}>{soundOn?"🔔":"🔕"}</span>{soundOn?"SOUND ON":"SOUND OFF"}
          </button>
          {unreadCount>0&&<button onClick={markAllRead} disabled={markingAll} style={{fontFamily:R,fontSize:"11px",color:"#3CCE2A",background:"transparent",border:"1.5px solid #2C4820",borderRadius:"20px",padding:"6px 14px",cursor:"pointer",letterSpacing:"1px"}}>{markingAll?"...":"MARK ALL READ ✓"}</button>}
          {notifications.some(n=>n.is_read)&&<button onClick={clearRead} style={{fontFamily:R,fontSize:"11px",color:"#5A7A50",background:"transparent",border:"1.5px solid #2C4820",borderRadius:"20px",padding:"6px 14px",cursor:"pointer",letterSpacing:"1px"}}>CLEAR READ</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {FILTERS.map(f=>{
          const count=f==="ALL"?notifications.filter(n=>!n.is_read).length:notifications.filter(n=>!n.is_read&&TC[n.type]?.label===f).length;
          const isActive=filter===f;
          return(
            <button key={f} onClick={()=>setFilter(f)} style={{fontFamily:R,fontSize:"10px",letterSpacing:"1px",background:isActive?"#1A3D14":"transparent",border:`1.5px solid ${isActive?"#3CCE2A":"#2C4820"}`,color:isActive?"#3CCE2A":"#5A7A50",borderRadius:"20px",padding:"5px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"}}>
              {f.toUpperCase()}
              {count>0&&<span style={{background:"#F04060",color:"#F0EAD6",borderRadius:"20px",padding:"0 5px",fontSize:"9px",fontFamily:R,lineHeight:"16px",display:"inline-block"}}>{count}</span>}
            </button>
          );
        })}
      </div>
      {filtered.length===0?(
        <div style={{background:"#1A2614",border:"2px solid #2C4820",borderRadius:"12px",padding:"56px 24px",textAlign:"center"}}>
          <div style={{fontSize:"48px",marginBottom:"14px"}}>🔔</div>
          <div style={{fontFamily:R,fontSize:"14px",color:"#5A7A50",letterSpacing:"2px",marginBottom:"8px"}}>NO NOTIFICATIONS</div>
          <div style={{fontFamily:B,fontSize:"13px",color:"#3A5030"}}>{filter==="ALL"?"You're all caught up!":` No ${filter.toLowerCase()} notifications`}</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
          {GROUP_ORDER.filter(g=>groups[g]?.length>0).map(group=>{
            const gn=groups[group]??[];
            const gu=gn.filter((n:any)=>!n.is_read).length;
            return(
              <div key={group}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <span style={{fontFamily:R,fontSize:"11px",color:"#5A7A50",letterSpacing:"2px"}}>{group}</span>
                  {gu>0&&<span style={{background:"#F04060",color:"#F0EAD6",borderRadius:"20px",padding:"1px 8px",fontSize:"10px",fontFamily:R}}>{gu} unread</span>}
                  <div style={{flex:1,height:"1px",background:"#2C4820"}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {gn.map((notif:any)=>{
                    const cfg=TC[notif.type]??{icon:"🔔",color:"#5A7A50",label:"General"};
                    return(
                      <div key={notif.id} style={{background:notif.is_read?"#1A2614":"#1E3018",border:`2px solid ${notif.is_read?"#2C4820":cfg.color+"60"}`,borderRadius:"10px",padding:"12px 16px",display:"flex",gap:"12px",alignItems:"flex-start",opacity:notif.is_read?0.75:1,transition:"all 0.2s"}}>
                        <div style={{width:"36px",height:"36px",borderRadius:"8px",background:cfg.color+"20",border:`1.5px solid ${cfg.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{cfg.icon}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px",marginBottom:"3px"}}>
                            <span style={{fontFamily:R,fontSize:"12px",color:notif.is_read?"#5A7A50":cfg.color,letterSpacing:"1px"}}>{notif.title}</span>
                            <span style={{fontFamily:B,fontSize:"11px",color:"#5A7A50",flexShrink:0}}>{timeAgo(notif.created_at)}</span>
                          </div>
                          <div style={{fontFamily:B,fontSize:"13px",color:notif.is_read?"#5A7A50":"#C8C0A8",lineHeight:1.6}}>{notif.message}</div>
                          {notif.link&&<button onClick={()=>handleView(notif)} style={{fontFamily:R,fontSize:"10px",color:cfg.color,background:"transparent",border:"none",cursor:"pointer",letterSpacing:"1.5px",padding:"0",marginTop:"6px"}}>VIEW →</button>}
                          {!notif.is_read&&!notif.link&&<button onClick={()=>markRead(notif.id)} style={{fontFamily:B,fontSize:"11px",color:"#5A7A50",background:"transparent",border:"none",cursor:"pointer",padding:"0",marginTop:"4px"}}>mark as read</button>}
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
