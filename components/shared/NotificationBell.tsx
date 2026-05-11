"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";

export default function NotificationBell({ initialCount, userId }: { initialCount: number; userId: string }) {
  const [count, setCount] = useState(initialCount);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`notif_bell_${userId}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"notifications", filter:`user_id=eq.${userId}` },
        () => {
          setCount(c => c + 1);
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 520;
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            o.start(ctx.currentTime);
            o.stop(ctx.currentTime + 0.4);
          } catch(e) {}
        }
      )
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"notifications", filter:`user_id=eq.${userId}` },
        async () => {
          const { count: fresh } = await supabase.from("notifications").select("*",{count:"exact",head:true}).eq("user_id",userId).eq("is_read",false);
          setCount(fresh ?? 0);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <Link href="/members/notifications" style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", textDecoration:"none", width:"34px", height:"34px" }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C10 2 6 3.5 6 9V14L4 16H16L14 14V9C14 3.5 10 2 10 2Z" stroke={count > 0 ? "#F0EAD6" : "#8AAA78"} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
        <path d="M8 16C8 17.1 8.9 18 10 18C11.1 18 12 17.1 12 16" stroke={count > 0 ? "#F0EAD6" : "#8AAA78"} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
      {count > 0 && (
        <span style={{ position:"absolute", top:"0px", right:"0px", background:"#F04060", border:"1.5px solid #080F06", borderRadius:"20px", minWidth:"16px", height:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:R, fontSize:"9px", color:"#F0EAD6", padding:"0 3px", letterSpacing:"0" }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
