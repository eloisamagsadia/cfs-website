import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"My Events" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const statusColors:Record<string,string> = { paid:"#3CCE2A", free:"#8EE440", pending:"#F5C82A", cancelled:"#F04060" };

export default async function MyEventsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("*, events(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const display = registrations ?? [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>MY EVENTS</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#8AAA78" }}>{display.length} registration{display.length !== 1 ? "s" : ""}</p>
      </div>

      {display.length === 0 ? (
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🎫</div>
          <div style={{ fontFamily:R, fontSize:"14px", color:"#5A7A50", letterSpacing:"2px", marginBottom:"16px" }}>NO EVENT REGISTRATIONS YET</div>
          <a href="/events" style={{ fontFamily:R, fontSize:"12px", color:"#3CCE2A", textDecoration:"none", border:"1.5px solid #2C4820", borderRadius:"6px", padding:"8px 18px", letterSpacing:"1.5px" }}>BROWSE EVENTS →</a>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {display.map((reg: any) => {
            const event = reg.events;
            const statusColor = statusColors[reg.payment_status] ?? "#5A7A50";
            return (
              <div key={reg.id} style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"18px 20px", display:"flex", gap:"16px", alignItems:"center" }}>
                <div style={{ background:"#1A3D14", border:"2px solid #2C4820", borderRadius:"8px", padding:"10px 14px", textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontFamily:R, fontSize:"1.4rem", color:"#3CCE2A", lineHeight:1 }}>
                    {event ? new Date(event.date).getDate() : "?"}
                  </div>
                  <div style={{ fontFamily:B, fontSize:"10px", color:"#5A7A50", letterSpacing:"1px" }}>
                    {event ? new Date(event.date).toLocaleDateString("en-PH",{month:"short"}) : "—"}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:R, fontSize:"14px", color:"#F0EAD6", letterSpacing:"1.5px", marginBottom:"4px" }}>{event?.title ?? "Event"}</div>
                  <div style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78", marginBottom:"6px" }}>{event?.location ?? ""}</div>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                    <span style={{ fontFamily:R, fontSize:"10px", color:statusColor, background:`${statusColor}20`, border:`1px solid ${statusColor}40`, borderRadius:"20px", padding:"2px 10px", letterSpacing:"1px" }}>
                      {reg.payment_status.toUpperCase()}
                    </span>
                    {reg.ticket_type && (
                      <span style={{ fontFamily:B, fontSize:"11px", color:"#8AAA78" }}>{reg.ticket_type}</span>
                    )}
                  </div>
                </div>
                {reg.qr_code && (
                  <div style={{ flexShrink:0 }}>
                    <span style={{ fontFamily:R, fontSize:"10px", color:"#3CCE2A", border:"1.5px solid #2C4820", borderRadius:"6px", padding:"6px 12px", letterSpacing:"1px", cursor:"pointer" }}>
                      🎟 TICKET
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}