import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import EventRegisterButton from "@/components/public/EventRegisterButton";
import type { Metadata } from "next";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: event } = await supabase.from("events").select("title, description").eq("id", params.id).single();
  return { title: event?.title ?? "Event", description: event?.description ?? "" };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  const user = userId ? { id: userId } : null;

  const [{ data: event }, { count: regCount }] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).single(),
    supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("event_id", params.id),
  ]);

  if (!event) notFound();

  let isRegistered = false;
  if (user) {
    const { data: reg } = await supabase
      .from("event_registrations").select("id").eq("event_id", params.id).eq("user_id", userId).single();
    isRegistered = !!reg;
  }

  const isFull = !!(event.capacity && (regCount ?? 0) >= event.capacity);
  const spotsLeft = event.capacity ? event.capacity - (regCount ?? 0) : null;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  const statusColors: Record<string, string> = {
    upcoming: "#3CCE2A", ongoing: "#F5C82A", completed: "#5A7A50", cancelled: "#F04060",
  };
  const statusColor = statusColors[event.status] ?? "#5A7A50";

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>

      {/* Hero */}
      <div style={{ background: "#1A2614", borderBottom: "2px solid #2C4820", padding: "48px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.1) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }}/>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/events" style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", textDecoration: "none", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
            <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="#5A7A50" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            BACK TO EVENTS
          </Link>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
            <span style={{ fontFamily: R, fontSize: "11px", color: statusColor, background: statusColor + "20", border: `1px solid ${statusColor}40`, borderRadius: "20px", padding: "3px 12px", letterSpacing: "1px" }}>
              {event.status.toUpperCase()}
            </span>
            {event.is_members_only && (
              <span style={{ fontFamily: R, fontSize: "11px", color: "#F5C82A", background: "#3D3000", border: "1px solid #F5C82A40", borderRadius: "20px", padding: "3px 12px", letterSpacing: "1px" }}>
                MEMBERS ONLY
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(1.8rem,5vw,3rem)", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "16px" }}>
            {event.title}
          </h1>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>📅</span>
              <div>
                <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px" }}>
                  {eventDate.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>
                <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>
                  {eventDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
            {event.location && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>📍</span>
                <div>
                  <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px" }}>{event.location}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>

        {/* Left: Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {event.description && (
            <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "14px" }}>ABOUT THIS EVENT</div>
              <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#C8C0A8", lineHeight: 1.9 }}>{event.description}</p>
            </div>
          )}

          {/* Event details grid */}
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "14px" }}>EVENT DETAILS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { label: "Date", value: eventDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) },
                { label: "Time", value: eventDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) },
                { label: "Location", value: event.location || "TBA" },
                { label: "Price", value: event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "FREE" },
                { label: "Capacity", value: event.capacity ? `${event.capacity} slots` : "Unlimited" },
                { label: "Registered", value: `${regCount ?? 0} ${event.capacity ? `/ ${event.capacity}` : ""} people` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Registration card */}
        <div style={{ position: "sticky", top: "90px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px" }}>

            {/* Price display */}
            <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #2C4820" }}>
              <div style={{ fontFamily: R, fontSize: "2rem", color: event.price > 0 ? "#F07228" : "#3CCE2A", letterSpacing: "2px" }}>
                {event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "FREE"}
              </div>
              {event.price > 0 && <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>per person</div>}
            </div>

            {/* Capacity bar */}
            {event.capacity && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>
                    {spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} spots left` : "All spots taken"}
                  </span>
                  <span style={{ fontFamily: R, fontSize: "12px", color: "#5A7A50" }}>
                    {regCount ?? 0}/{event.capacity}
                  </span>
                </div>
                <div style={{ background: "#243520", borderRadius: "20px", height: "8px", overflow: "hidden", border: "1px solid #2C4820" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(((regCount ?? 0) / event.capacity) * 100, 100)}%`,
                    background: isFull ? "#F04060" : "#3CCE2A",
                    borderRadius: "20px", transition: "width 0.5s",
                  }}/>
                </div>
              </div>
            )}

            {/* Register button */}
            {!isPast && event.status !== "cancelled" ? (
              <EventRegisterButton event={event} isLoggedIn={!!user} isRegistered={isRegistered} isFull={isFull}/>
            ) : (
              <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "8px", padding: "14px", textAlign: "center", fontFamily: R, fontSize: "13px", color: "#5A7A50", letterSpacing: "1px" }}>
                {event.status === "cancelled" ? "EVENT CANCELLED" : "EVENT HAS ENDED"}
              </div>
            )}
          </div>

          {/* Share */}
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", letterSpacing: "2px", marginBottom: "10px" }}>SHARE THIS EVENT</div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {["Twitter", "Facebook", "Copy Link"].map(s => (
                <button key={s} style={{ fontFamily: R, fontSize: "10px", color: "#8AAA78", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", letterSpacing: "1px" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
