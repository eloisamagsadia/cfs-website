import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title:"My Events" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";

const STATUS_COLORS: Record<string,string> = {
  active: "#3CCE2A",
  used: "#5A7A60",
  cancelled: "#F04060",
  pending_payment: "#F5C82A",
};

const STATUS_LABELS: Record<string,string> = {
  active: "VALID",
  used: "USED",
  cancelled: "CANCELLED",
  pending_payment: "PENDING PAYMENT",
};

export default async function MyEventsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();
  const { data: tickets } = await (supabase as any)
    .from("event_tickets")
    .select("*, events:event_id(*), event_tiers:tier_id(id, name, price, color)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const display = tickets ?? [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#1B3A2D", letterSpacing:"3px", marginBottom:"4px" }}>MY EVENTS</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#4A7C59" }}>{display.length} ticket{display.length !== 1 ? "s" : ""}</p>
      </div>

      {display.length === 0 ? (
        <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🎫</div>
          <div style={{ fontFamily:R, fontSize:"14px", color:"#5A7A60", letterSpacing:"2px", marginBottom:"16px" }}>NO TICKETS YET</div>
          <a href="/events" style={{ fontFamily:R, fontSize:"12px", color:"#3CCE2A", textDecoration:"none", border:"1.5px solid #DDE8DD", borderRadius:"6px", padding:"8px 18px", letterSpacing:"1.5px" }}>BROWSE EVENTS →</a>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {display.map((ticket: any) => {
            const event = ticket.events;
            const tier = ticket.event_tiers;
            const statusColor = STATUS_COLORS[ticket.status] ?? "#5A7A60";
            return (
              <div key={ticket.id} style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"18px 20px", display:"flex", gap:"16px", alignItems:"center" }}>
                {/* Date box */}
                <div style={{ background: (tier?.color ?? "#3CCE2A") + "20", border:`2px solid ${(tier?.color ?? "#3CCE2A")}40`, borderRadius:"8px", padding:"10px 14px", textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontFamily:R, fontSize:"1.4rem", color: tier?.color ?? "#3CCE2A", lineHeight:1 }}>
                    {event ? new Date(event.date).getDate() : "?"}
                  </div>
                  <div style={{ fontFamily:B, fontSize:"10px", color:"#5A7A60", letterSpacing:"1px" }}>
                    {event ? new Date(event.date).toLocaleDateString("en-PH",{month:"short"}) : "—"}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:R, fontSize:"14px", color:"#1B3A2D", letterSpacing:"1.5px", marginBottom:"4px" }}>{event?.title ?? "Event"}</div>
                  <div style={{ fontFamily:B, fontSize:"12px", color:"#4A7C59", marginBottom:"6px" }}>{event?.location ?? "TBA"}</div>
                  <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontFamily:R, fontSize:"10px", color:statusColor, background:`${statusColor}20`, border:`1px solid ${statusColor}40`, borderRadius:"20px", padding:"2px 10px", letterSpacing:"1px" }}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                    {tier && (
                      <span style={{ fontFamily:R, fontSize:"10px", color: tier.color, background: tier.color + "20", borderRadius:"20px", padding:"2px 10px" }}>
                        {tier.name}
                      </span>
                    )}
                    <span style={{ fontFamily:R, fontSize:"11px", color:"#1B3A2D", background:"#F2F7F2", border:"1px solid #DDE8DD", borderRadius:"6px", padding:"2px 10px", letterSpacing:"1px" }}>{ticket.ticket_number}</span>
                  </div>
                </div>

                {/* View ticket */}
                <Link href={`/members/tickets/${ticket.id}`}
                  style={{ flexShrink:0, fontFamily:R, fontSize:"10px", color:"#3CCE2A", border:"1.5px solid #3CCE2A", borderRadius:"6px", padding:"6px 12px", letterSpacing:"1px", textDecoration:"none" }}>
                  🎫 TICKET
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
