import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import EventRegisterButton from "@/components/public/EventRegisterButton";
import type { Metadata } from "next";
import { IconCalendar, IconPin } from "@/components/shared/Icons";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const R  = "var(--font-righteous,'Righteous',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: e } = await (supabase.from("events") as any).select("title, description").eq("id", params.id).single();
  return { title: (e as any)?.title ?? "Event", description: (e as any)?.description ?? "" };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { userId, sessionClaims } = auth();
  const user = userId ? { id: userId } : null;
  const role = (sessionClaims?.metadata as any)?.role ?? "member";
  const isSponsor = ["sponsor", "admin", "super_admin"].includes(role);

  const [{ data: event }, { count: regCount }] = await Promise.all([
    (supabase.from("events") as any).select("*").eq("id", params.id).single(),
    (supabase as any).from("event_tickets").select("id", { count: "exact", head: true }).eq("event_id", params.id).neq("status", "cancelled"),
  ]);

  if (!event) notFound();

  const { data: tiers } = await (supabase as any).from("event_tiers").select("*").eq("event_id", params.id).eq("is_active", true).order("price", { ascending: true });

  let isRegistered = false;
  let existingTicketId: string | null = null;
  if (user) {
    const { data: reg } = await (supabase as any).from("event_tickets").select("id").eq("event_id", params.id).eq("user_id", userId).single();
    isRegistered = !!reg;
    existingTicketId = reg?.id ?? null;
  }

  const isFull = !!(event.capacity && (regCount ?? 0) >= event.capacity);
  const spotsLeft = event.capacity ? event.capacity - (regCount ?? 0) : null;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const statusColors: Record<string, string> = { upcoming: "#1A8040", ongoing: "#156530", completed: "#4A7C59", cancelled: "#CC3344" };
  const statusColor = statusColors[event.status] ?? "#4A7C59";

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      {/* Hero */}
      <div style={{ background: C.cream, borderBottom: `1px solid ${C.border}`, padding: "48px 64px", position: "relative", overflow: "hidden", minHeight: "320px", display: "flex", alignItems: "center" }}>
        {event.banner_url && (
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${event.banner_url})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2 }} />
        )}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(44,72,32,0.05) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
          <Link href="/events" style={{ fontFamily: B, fontSize: "11px", color: C.sage, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
            <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke={C.sage} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            Back to Events
          </Link>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", justifyContent: "center" }}>
              <span style={{ fontFamily: B, fontSize: "10px", fontWeight: 700, color: statusColor, background: statusColor + "18", border: `1px solid ${statusColor}40`, borderRadius: "20px", padding: "3px 12px", letterSpacing: "1px" }}>
                {event.status.toUpperCase()}
              </span>
              {event.is_members_only && (
                <span style={{ fontFamily: B, fontSize: "10px", fontWeight: 700, color: "#156530", background: "#FFF8E1", border: "1px solid #1A804040", borderRadius: "20px", padding: "3px 12px" }}>
                  MEMBERS ONLY
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: S, fontSize: "clamp(1.8rem,5vw,3rem)", color: C.forest, lineHeight: 1.05, marginBottom: "20px" }}>
              {event.title}
            </h1>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconCalendar size={18} color="#4A7C59" />
                <div>
                  <div style={{ fontFamily: B, fontSize: "14px", color: C.forest, fontWeight: 600 }}>
                    {eventDate.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
                  </div>
                  <div style={{ fontFamily: B, fontSize: "12px", color: C.muted }}>
                    {eventDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}
                  </div>
                </div>
              </div>
              {event.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IconPin size={18} color="#4A7C59" />
                  <div style={{ fontFamily: B, fontSize: "14px", color: C.forest, fontWeight: 600 }}>{event.location}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="event-detail-grid" style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 64px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "32px", alignItems: "start" }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {event.description && (
            <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ background: C.forest, padding: "16px 24px" }}>
                <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "3px" }}>ABOUT THIS EVENT</div>
              </div>
              <div style={{ padding: "24px" }}>
                <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: C.muted, lineHeight: 1.9, margin: 0 }}>{event.description}</p>
              </div>
            </div>
          )}

          <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background: C.forest, padding: "16px 24px" }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "3px" }}>EVENT DETAILS</div>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {[
                  { label: "Date", value: eventDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) },
                  { label: "Time", value: eventDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) },
                  { label: "Location", value: event.location || "TBA" },
                  { label: "Price", value: event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "FREE" },
                  { label: "Capacity", value: event.capacity ? `${event.capacity} slots` : "Unlimited" },
                  { label: "Registered", value: `${regCount ?? 0}${event.capacity ? ` / ${event.capacity}` : ""} people` },
                  ...(event.sponsor_access_at ? [{ label: "Early Access", value: new Date(event.sponsor_access_at).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) + " PHT" }] : []),
                  ...(event.member_access_at ? [{ label: "General Registration", value: new Date(event.member_access_at).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) + " PHT" }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily: B, fontSize: "10px", color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                    <div style={{ fontFamily: B, fontSize: "14px", color: C.forest, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="event-register-card" style={{ position: "sticky", top: "90px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background: C.sage, padding: "16px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: S, fontSize: "2rem", color: event.price > 0 ? "#1A8040" : C.green, lineHeight: 1 }}>
                {event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "FREE"}
              </div>
              {event.price > 0 && <div style={{ fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>per person</div>}
            </div>
            <div style={{ padding: "20px" }}>
              {event.capacity && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontFamily: B, fontSize: "12px", color: C.muted }}>
                      {spotsLeft !== null && spotsLeft > 0 ? `${spotsLeft} spots left` : "All spots taken"}
                    </span>
                    <span style={{ fontFamily: B, fontSize: "12px", color: C.sage }}>{regCount ?? 0}/{event.capacity}</span>
                  </div>
                  <div style={{ background: C.mist, borderRadius: "20px", height: "8px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(((regCount ?? 0) / event.capacity) * 100, 100)}%`, background: isFull ? "#CC3344" : C.green, borderRadius: "20px", transition: "width 0.5s" }} />
                  </div>
                </div>
              )}
              {!isPast && event.status !== "cancelled" ? (
                <EventRegisterButton event={event} isLoggedIn={!!user} isRegistered={isRegistered} isFull={isFull} tiers={tiers ?? []} existingTicketId={existingTicketId} isSponsor={isSponsor} />
              ) : (
                <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "14px", textAlign: "center", fontFamily: B, fontSize: "13px", color: C.muted, letterSpacing: "1px" }}>
                  {event.status === "cancelled" ? "EVENT CANCELLED" : "EVENT HAS ENDED"}
                </div>
              )}
            </div>
          </div>
          <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2px", marginBottom: "10px" }}>SHARE THIS EVENT</div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {["Twitter", "Facebook", "Copy Link"].map(s => (
                <button key={s} style={{ fontFamily: B, fontSize: "10px", color: C.muted, background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>
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
