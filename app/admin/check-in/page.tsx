"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconCamera, IconCheck, IconWarning, IconX } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

type Tab = "scanner" | "briefing" | "attendees";
type ScanResult = { success: boolean; ticket?: any; error?: string };
type EventLite = { id: string; title: string; date: string; location: string | null };
type Attendee = {
  ticket_id: string; ticket_number: string; name: string; email: string | null;
  tier_name: string; tier_color: string; is_comp: boolean;
  checked_in: boolean; checked_in_at: string | null;
};
type EventInfo = {
  event: { id: string; title: string; date: string; location: string | null; map_url: string | null; banner_url: string | null; description: string | null; guidelines_url: string | null; guidelines_text: string | null };
  attendees: Attendee[];
  stats: { total: number; checked_in: number; per_tier: { tier: string; total: number; checked_in: number; color: string }[] };
};

const ONBOARDING_KEY = "cfs.check-in.onboarded";

export default function CheckInPage() {
  const [tab, setTab] = useState<Tab>("scanner");
  const [events, setEvents] = useState<EventLite[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [info, setInfo] = useState<EventInfo | null>(null);
  const [attendeeQuery, setAttendeeQuery] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState<"all" | "checked" | "not">("all");

  // Scanner state (existing behaviour, kept intact)
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load event list + onboarding flag on mount
  useEffect(() => {
    fetch("/api/admin/check-in/events").then(r => r.ok ? r.json() : { events: [] }).then(d => {
      setEvents(d.events ?? []);
      if (!eventId && d.events?.[0]) setEventId(d.events[0].id);
    });
    if (typeof window !== "undefined" && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload event info whenever the picked event changes
  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/admin/check-in/event-info?event_id=${eventId}`).then(r => r.ok ? r.json() : null).then(setInfo);
  }, [eventId]);

  async function checkIn(ticket_id: string) {
    setLoading(true);
    const res = await fetch("/api/admin/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id }),
    });
    const data = await res.json();
    setResult({ success: res.ok, ticket: data.ticket, error: data.error });
    setLoading(false);
    // Refresh attendee list so status reflects the new check-in.
    if (res.ok && eventId) {
      fetch(`/api/admin/check-in/event-info?event_id=${eventId}`).then(r => r.ok ? r.json() : null).then(setInfo);
    }
  }

  async function startScanner() {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          await scanner.stop();
          setScanning(false);
          try {
            const data = JSON.parse(text);
            await checkIn(data.ticket_id ?? data.id ?? text);
          } catch {
            await checkIn(text);
          }
        },
        () => {}
      );
      setScanning(true);
    } catch {
      toast.error("Camera access denied. Please use manual entry.");
    }
  }
  async function stopScanner() {
    if (scannerRef.current) { try { await scannerRef.current.stop(); } catch {} }
    setScanning(false);
  }
  useEffect(() => { return () => { stopScanner(); }; }, []);
  function reset() { setResult(null); setManualId(""); }

  function dismissOnboarding() {
    setShowOnboarding(false);
    if (typeof window !== "undefined") localStorage.setItem(ONBOARDING_KEY, new Date().toISOString());
  }
  function reopenOnboarding() { setShowOnboarding(true); }

  const filteredAttendees = useMemo(() => {
    const list = info?.attendees ?? [];
    const q = attendeeQuery.trim().toLowerCase();
    return list.filter(a => {
      if (attendeeFilter === "checked" && !a.checked_in) return false;
      if (attendeeFilter === "not" && a.checked_in) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        a.ticket_number.toLowerCase().includes(q) ||
        a.tier_name.toLowerCase().includes(q)
      );
    });
  }, [info, attendeeQuery, attendeeFilter]);

  const selectedEvent = events.find(e => e.id === eventId) ?? null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header + event picker */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: 3, marginBottom: 4 }}>CHECK-IN</h1>
          <p style={{ fontFamily: B, fontSize: 13, color: "#4A7C59" }}>Scan tickets, browse the event brief, and search attendees.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={reopenOnboarding} title="Show the volunteer walkthrough" style={{ fontFamily: R, fontSize: 10, letterSpacing: 1.5, background: "#FFFFFF", color: "#1E4A7A", border: "1.5px solid #B7C7D9", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>? HELP</button>
        </div>
      </div>

      {events.length > 1 && (
        <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: R, fontSize: 10, color: "#5A7A60", letterSpacing: 1.5 }}>EVENT</span>
          <select value={eventId ?? ""} onChange={e => setEventId(e.target.value)}
            style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", background: "#F7FAF5", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "6px 10px", flex: 1, minWidth: 200 }}>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title} · {new Date(e.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["scanner", "briefing", "attendees"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ fontFamily: R, fontSize: 11, letterSpacing: 1.5, background: tab === t ? "#1B3A2D" : "#FFFFFF", color: tab === t ? "#FFFFFF" : "#1B3A2D", border: "1.5px solid #1B3A2D", borderRadius: 999, padding: "7px 16px", cursor: "pointer" }}>
            {t.toUpperCase()}
          </button>
        ))}
        {tab === "attendees" && info?.stats && (
          <div style={{ marginLeft: "auto", alignSelf: "center", fontFamily: B, fontSize: 12, color: "#5A7A60" }}>
            {info.stats.checked_in} of {info.stats.total} checked in
          </div>
        )}
      </div>

      {/* SCANNER TAB (unchanged behaviour) */}
      {tab === "scanner" && (
        <>
          {!result ? (
            <>
              <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: 16, overflow: "hidden" }}>
                <div id="qr-reader" style={{ width: "100%" }} />
                {!scanning && (
                  <div style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <IconCamera size={48} color="#DDE8DD" />
                    <div style={{ fontFamily: B, fontSize: 13, color: "#5A7A60" }}>Camera not started</div>
                  </div>
                )}
                <div style={{ padding: 16, display: "flex", gap: 10 }}>
                  {!scanning ? (
                    <button onClick={startScanner} style={{ flex: 1, fontFamily: R, fontSize: 12, background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", letterSpacing: 1.5 }}>START CAMERA</button>
                  ) : (
                    <button onClick={stopScanner} style={{ flex: 1, fontFamily: R, fontSize: 12, background: "transparent", color: "#CC3344", border: "1.5px solid #CC3344", borderRadius: 8, padding: 12, cursor: "pointer", letterSpacing: 1.5 }}>STOP CAMERA</button>
                  )}
                </div>
              </div>
              <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: 12, padding: 16 }}>
                <div style={{ fontFamily: R, fontSize: 12, color: "#5A7A60", letterSpacing: 2, marginBottom: 12 }}>MANUAL ENTRY</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={manualId} onChange={e => setManualId(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && manualId.trim()) checkIn(manualId.trim()); }}
                    placeholder="Enter CFS-1000 or ticket UUID"
                    style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none" }} />
                  <button onClick={() => { if (manualId.trim()) checkIn(manualId.trim()); }} disabled={!manualId.trim() || loading}
                    style={{ fontFamily: R, fontSize: 11, background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", letterSpacing: 1, opacity: (!manualId.trim() || loading) ? 0.5 : 1 }}>
                    {loading ? "..." : "CHECK IN"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: "#FFFFFF", border: `2px solid ${result.success ? "#1A8040" : "#CC3344"}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center" }}>{result.success ? <IconCheck size={56} color="#1A8040" /> : result.error?.includes("already") ? <IconWarning size={56} color="#CC9900" /> : <IconX size={56} color="#CC3344" />}</div>
                <div style={{ fontFamily: R, fontSize: "1.2rem", color: result.success ? "#1A8040" : "#CC3344", letterSpacing: 2, marginTop: 8 }}>
                  {result.success ? "CHECKED IN!" : result.error?.includes("already") ? "ALREADY USED" : "INVALID TICKET"}
                </div>
                {result.error && <div style={{ fontFamily: B, fontSize: 12, color: "#4A7C59", marginTop: 6 }}>{result.error}</div>}
              </div>
              {result.ticket && (
                <div style={{ background: "#F7FAF5", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F0E4", border: "2px solid #DDE8DD", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {result.ticket.profiles?.avatar_url ? <img src={result.ticket.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: R, fontSize: 18, color: "#1A8040" }}>{(result.ticket.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{ fontFamily: R, fontSize: 15, color: "#1B3A2D" }}>{result.ticket.profiles?.display_name ?? result.ticket.qr_data?.member_name ?? "Member"}</div>
                      <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>{result.ticket.ticket_number}</div>
                    </div>
                  </div>
                  {[
                    { label: "Event", value: result.ticket.events?.title ?? result.ticket.qr_data?.event_name },
                    { label: "Tier", value: result.ticket.event_tiers?.name ?? result.ticket.qr_data?.tier_name },
                    { label: "Date", value: result.ticket.events?.date ? new Date(result.ticket.events.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: B, fontSize: 12, color: "#5A7A60" }}>{label}</span>
                      <span style={{ fontFamily: B, fontSize: 12, color: "#1B3A2D" }}>{value ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={reset} style={{ fontFamily: R, fontSize: 12, background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", letterSpacing: 1.5 }}>SCAN NEXT TICKET</button>
            </div>
          )}
        </>
      )}

      {/* BRIEFING TAB */}
      {tab === "briefing" && (
        !info ? (
          <div style={{ padding: 40, textAlign: "center", fontFamily: B, color: "#7A8E7A" }}>Loading event…</div>
        ) : (
          <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {info.event.banner_url && (
              <img src={info.event.banner_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10 }} />
            )}
            <div>
              <div style={{ fontFamily: R, fontSize: 10, color: "#1A8040", letterSpacing: 2, marginBottom: 4 }}>EVENT</div>
              <h2 style={{ fontFamily: S, fontSize: "1.4rem", color: "#1B3A2D", margin: 0 }}>{info.event.title}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontFamily: B, fontSize: 13, color: "#1B3A2D" }}>
              <span style={{ color: "#5A7A60" }}>When</span>
              <span>{new Date(info.event.date).toLocaleString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })}</span>
              <span style={{ color: "#5A7A60" }}>Where</span>
              <span>{info.event.location ?? "TBA"}{info.event.map_url && <> · <a href={info.event.map_url} target="_blank" rel="noreferrer" style={{ color: "#1A8040" }}>Map</a></>}</span>
            </div>

            {/* Live check-in stats */}
            <div style={{ background: "#F7FAF5", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontFamily: R, fontSize: 11, color: "#5A7A60", letterSpacing: 1.5 }}>CHECK-IN PROGRESS</div>
                <div style={{ fontFamily: R, fontSize: 18, color: "#1A8040" }}>{info.stats.checked_in} <span style={{ color: "#7A8E7A", fontSize: 12 }}>/ {info.stats.total}</span></div>
              </div>
              <div style={{ background: "#E4EDE4", height: 8, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#1A8040", width: `${info.stats.total > 0 ? (info.stats.checked_in / info.stats.total) * 100 : 0}%`, transition: "width 0.4s ease" }} />
              </div>
              {info.stats.per_tier.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {info.stats.per_tier.map(t => (
                    <span key={t.tier} style={{ fontFamily: B, fontSize: 11, color: t.color, background: t.color + "18", border: `1px solid ${t.color}40`, borderRadius: 6, padding: "3px 8px" }}>
                      {t.tier}: {t.checked_in}/{t.total}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {info.event.description && (
              <div>
                <div style={{ fontFamily: R, fontSize: 10, color: "#5A7A60", letterSpacing: 1.5, marginBottom: 6 }}>ABOUT</div>
                <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", lineHeight: 1.6, whiteSpace: "pre-wrap" as const }}>{info.event.description}</div>
              </div>
            )}
            {(info.event.guidelines_text || info.event.guidelines_url) && (
              <div style={{ background: "#FFF9E5", border: "1.5px solid #F0D889", borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: R, fontSize: 10, color: "#7A5A0F", letterSpacing: 1.5, marginBottom: 6 }}>GUIDELINES</div>
                {info.event.guidelines_text && <div style={{ fontFamily: B, fontSize: 12, color: "#7A5A0F", whiteSpace: "pre-wrap" as const, lineHeight: 1.6 }}>{info.event.guidelines_text}</div>}
                {info.event.guidelines_url && <div style={{ marginTop: 6 }}><a href={info.event.guidelines_url} target="_blank" rel="noreferrer" style={{ fontFamily: B, fontSize: 12, color: "#B0731A", fontWeight: 600 }}>Open guidelines poster →</a></div>}
              </div>
            )}
          </div>
        )
      )}

      {/* ATTENDEES TAB */}
      {tab === "attendees" && (
        !info ? (
          <div style={{ padding: 40, textAlign: "center", fontFamily: B, color: "#7A8E7A" }}>Loading attendees…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input value={attendeeQuery} onChange={e => setAttendeeQuery(e.target.value)} placeholder="Search name, email, ticket #, tier…"
                style={{ flex: 1, minWidth: 220, background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none" }} />
              {(["all", "not", "checked"] as const).map(f => {
                const label = f === "all" ? "ALL" : f === "not" ? "NOT YET" : "CHECKED IN";
                const count = f === "all" ? info.attendees.length : f === "checked" ? info.stats.checked_in : (info.stats.total - info.stats.checked_in);
                const active = attendeeFilter === f;
                return (
                  <button key={f} onClick={() => setAttendeeFilter(f)}
                    style={{ fontFamily: R, fontSize: 10, letterSpacing: 1.2, background: active ? "#1B3A2D" : "#FFFFFF", color: active ? "#FFFFFF" : "#1B3A2D", border: "1.5px solid #1B3A2D", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>
                    {label} <span style={{ background: active ? "#FFFFFF20" : "#F2F7F0", padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{count}</span>
                  </button>
                );
              })}
            </div>
            {filteredAttendees.length === 0 ? (
              <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8DD", borderRadius: 12, padding: 32, textAlign: "center", fontFamily: B, color: "#7A8E7A" }}>No attendees match.</div>
            ) : (
              <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: 12, overflow: "hidden" }}>
                {filteredAttendees.map((a, i) => (
                  <div key={a.ticket_id} style={{ padding: "10px 14px", borderTop: i === 0 ? "none" : "1px solid #EDF2ED", display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.checked_in ? "#1A8040" : "#DDE8DD" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                      <div style={{ fontFamily: "'Courier New',monospace", fontSize: 11, color: "#7A8E7A" }}>{a.ticket_number}{a.email ? ` · ${a.email}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontFamily: R, fontSize: 10, color: a.tier_color, background: a.tier_color + "18", borderRadius: 6, padding: "3px 8px", letterSpacing: 1 }}>{a.tier_name}</span>
                      <span style={{ fontFamily: R, fontSize: 9, color: a.is_comp ? "#0F7A5C" : "#1A8040", background: a.is_comp ? "#DCF3E9" : "#E8F0E4", border: `1px solid ${a.is_comp ? "#0F7A5C" : "#1A8040"}40`, borderRadius: 6, padding: "3px 6px", letterSpacing: 1 }}>{a.is_comp ? "COMP" : "PAID"}</span>
                    </div>
                    <div>
                      {a.checked_in ? (
                        <span style={{ fontFamily: R, fontSize: 10, color: "#1A8040", letterSpacing: 1 }}>✓ IN</span>
                      ) : (
                        <button onClick={() => checkIn(a.ticket_number)} disabled={loading}
                          style={{ fontFamily: R, fontSize: 10, background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1 }}>
                          CHECK IN
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Onboarding modal — first-time visitors only, dismissible */}
      {showOnboarding && (
        <div onClick={dismissOnboarding}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: 16, padding: 28, maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", gap: 16, maxHeight: "90vh", overflow: "auto" }}>
            <div>
              <div style={{ fontFamily: R, fontSize: 10, color: "#1A8040", letterSpacing: 2, marginBottom: 6 }}>WELCOME</div>
              <h2 style={{ fontFamily: S, fontSize: "1.4rem", color: "#1B3A2D", margin: 0 }}>You're helping with check-in!</h2>
              <p style={{ fontFamily: B, fontSize: 13, color: "#5A7A60", marginTop: 8, lineHeight: 1.6 }}>
                {selectedEvent ? `Thanks for volunteering for ${selectedEvent.title}. ` : "Thanks for volunteering. "}
                Here's a quick walkthrough so you know what to do at the door.
              </p>
            </div>
            <ol style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 10, fontFamily: B, fontSize: 13, color: "#1B3A2D", lineHeight: 1.6 }}>
              <li><strong>Read the BRIEFING tab</strong> — event time, venue, program, rules. If a guest asks, you'll know the answer.</li>
              <li><strong>SCANNER tab</strong> — start the camera and scan the QR on the ticket. If the camera won't work, type the ticket number (like <code>CFS-OPMN-A00042</code>) in the manual field.</li>
              <li><strong>ATTENDEES tab</strong> — if a guest lost their ticket, search their name or email. Confirm their identity, then hit CHECK IN on their row.</li>
              <li><strong>COMP tickets</strong> are legit — some sponsors and comp guests get free tickets issued by the admin. The COMP badge means "no payment, but authorised".</li>
              <li>If a ticket says <strong>ALREADY USED</strong>, double-check with the guest — someone else may have used it. Escalate to the event coordinator if unsure.</li>
            </ol>
            <div style={{ background: "#F7FAF5", borderRadius: 10, padding: 12, fontFamily: B, fontSize: 12, color: "#5A7A60" }}>
              Tip: keep this tab open on your phone. Every check-in updates the count on the BRIEFING tab live.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={dismissOnboarding}
                style={{ fontFamily: R, fontSize: 11, letterSpacing: 1.5, background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer" }}>
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
