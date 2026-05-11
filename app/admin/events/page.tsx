import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Manage Events" };
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SC: any = { upcoming: "#3CCE2A", ongoing: "#F5C82A", completed: "#5A7A50", cancelled: "#F04060" };

export default async function AdminEventsPage() {
  const supabase = createAdminClient();
  const { data: eventsRaw } = await (((supabase.from("events") as any) as any) as any).select("*, event_registrations(id)").order("date", { ascending: false });
  const events = eventsRaw as any;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>EVENTS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>{events?.length ?? 0} total events</p>
        </div>
        <Link href="/admin/events/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#080F06", padding: "8px 18px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>+ CREATE EVENT</span>
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {(events ?? []).map((event: any) => {
          const color = SC[event.status] ?? "#5A7A50";
          const regCount = event.event_registrations?.length ?? 0;
          return (
            <div key={event.id} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ background: color + "20", border: `2px solid ${color}40`, borderRadius: "8px", padding: "10px 14px", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: R, fontSize: "1.2rem", color, lineHeight: 1 }}>{new Date(event.date).getDate()}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{new Date(event.date).toLocaleDateString("en-PH", { month: "short" })}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "4px" }}>{event.title}</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>📍 {event.location ?? "TBD"}</span>
                  <span style={{ fontFamily: R, fontSize: "11px", color, background: color + "20", borderRadius: "20px", padding: "1px 8px", letterSpacing: "1px" }}>{event.status.toUpperCase()}</span>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50" }}>{regCount} registered</span>
                  {event.price > 0 ? <span style={{ fontFamily: R, fontSize: "11px", color: "#F07228" }}>₱{Number(event.price).toLocaleString()}</span> : <span style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A" }}>FREE</span>}
                </div>
              </div>
              <Link href={`/admin/events/${event.id}/edit`} style={{ textDecoration: "none", fontFamily: B, fontSize: "11px", color: "#8AAA78", border: "1px solid #2C4820", borderRadius: "6px", padding: "6px 12px", letterSpacing: "1px", flexShrink: 0 }}>
                ✏ EDIT
              </Link>
            </div>
          );
        })}
        {!events?.length && <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50", letterSpacing: "2px" }}>NO EVENTS YET — CREATE ONE!</div>}
      </div>
    </div>
  );
}
