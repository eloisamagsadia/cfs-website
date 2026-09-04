"use client";
import { SkListLoading } from "@/components/shared/Skeleton";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconCamera, IconCheck, IconTrash, IconSparkle, IconX } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const STATUS_COLORS: Record<string, string> = {
  active: "#1A8040",
  used: "#5A7A60",
  cancelled: "#CC3344",
  pending_payment: "#156530",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function EventTicketsPage() {
  const { id: event_id } = useParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Comp modal state
  const [showComp, setShowComp] = useState(false);
  const [compTier, setCompTier] = useState<string>("");
  const [compMemberSearch, setCompMemberSearch] = useState("");
  const [compMember, setCompMember] = useState<any>(null);
  const [compNote, setCompNote] = useState("");
  const [compBusy, setCompBusy] = useState(false);
  const [compError, setCompError] = useState("");
  const [compSuccess, setCompSuccess] = useState("");

  // Cancel confirmation + type-to-confirm phrase for bundles
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; bundle_id: string | null; label: string; buyer: string; bundleSize: number } | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);

  // Undo toast state — shown for 30s after a successful cancel with
  // enough context to restore the exact ticket(s) via PATCH.
  const [undoToast, setUndoToast] = useState<{ ids: string[]; bundle_id: string | null; label: string; expiresAt: number } | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const [undoRemaining, setUndoRemaining] = useState(0);

  async function loadTickets() {
    const r = await fetch(`/api/events/tickets?event_id=${event_id}`);
    const d = await r.json();
    setTickets(d.tickets ?? []);
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/tickets?event_id=${event_id}`).then(r => r.json()),
      fetch(`/api/events/tiers?event_id=${event_id}`).then(r => r.json()),
      fetch(`/api/admin/members`).then(r => r.json()),
    ]).then(([tks, trs, mbs]) => {
      setTickets(tks.tickets ?? []);
      setTiers(trs.tiers ?? []);
      setMembers(mbs.members ?? []);
      setLoading(false);
    });
  }, [event_id]);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all: tickets.length,
    active: tickets.filter(t => t.status === "active").length,
    used: tickets.filter(t => t.status === "used").length,
    pending_payment: tickets.filter(t => t.status === "pending_payment").length,
    cancelled: tickets.filter(t => t.status === "cancelled").length,
  };

  const memberSearchResults = useMemo(() => {
    const q = compMemberSearch.trim().toLowerCase();
    if (!q) return [];
    return members.filter(m =>
      (m.display_name ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [compMemberSearch, members]);

  function resetCompForm() {
    setCompTier(""); setCompMember(null); setCompMemberSearch(""); setCompNote("");
    setCompError(""); setCompSuccess("");
  }

  async function submitComp() {
    if (!compMember) { setCompError("Pick a member first."); return; }
    setCompBusy(true); setCompError(""); setCompSuccess("");
    try {
      const res = await fetch("/api/admin/events/tickets/comp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id, tier_id: compTier || null, target_user_id: compMember.id, note: compNote.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to comp ticket");
      setCompSuccess(`Generated ${data.bundle_size} ticket${data.bundle_size === 1 ? "" : "s"} for ${compMember.display_name ?? "member"}.`);
      await loadTickets();
      resetCompForm();
      setTimeout(() => { setShowComp(false); setCompSuccess(""); }, 1500);
    } catch (e: any) {
      setCompError(e?.message ?? "Failed to comp ticket");
    } finally {
      setCompBusy(false);
    }
  }

  async function forceCancel() {
    if (!confirmCancel) return;
    // Type-to-confirm gate for bundles — must type the buyer's name exactly
    if (confirmCancel.bundleSize > 1 && confirmPhrase.trim().toLowerCase() !== (confirmCancel.buyer ?? "").trim().toLowerCase()) {
      return; // button should be disabled anyway; belt & suspenders
    }
    setCancelBusy(true);
    try {
      const url = confirmCancel.bundle_id
        ? `/api/admin/events/tickets/comp?bundle_id=${confirmCancel.bundle_id}`
        : `/api/admin/events/tickets/comp?id=${confirmCancel.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      await loadTickets();
      // Fire the UNDO toast with a 30s window
      if (data?.undo) {
        setUndoToast({
          ids: data.undo.ids ?? [],
          bundle_id: data.undo.bundle_id ?? null,
          label: confirmCancel.label,
          expiresAt: Date.now() + 30_000,
        });
        setUndoRemaining(30);
      }
      setConfirmCancel(null);
      setConfirmPhrase("");
    } catch {
      alert("Could not cancel. Try again.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function undoCancel() {
    if (!undoToast) return;
    setUndoBusy(true);
    try {
      const res = await fetch("/api/admin/events/tickets/comp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: undoToast.ids, bundle_id: undoToast.bundle_id }),
      });
      if (!res.ok) throw new Error();
      await loadTickets();
      setUndoToast(null);
    } catch {
      alert("Undo failed. The ticket stayed cancelled.");
    } finally {
      setUndoBusy(false);
    }
  }

  // Countdown for the undo toast — ticks every second, disappears at 0
  useEffect(() => {
    if (!undoToast) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((undoToast.expiresAt - Date.now()) / 1000));
      setUndoRemaining(left);
      if (left <= 0) { setUndoToast(null); clearInterval(id); }
    }, 500);
    return () => clearInterval(id);
  }, [undoToast]);

  const btnPrimary: React.CSSProperties = { fontFamily: R, fontSize: "11px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 16px", letterSpacing: "1px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" };
  const btnGhost: React.CSSProperties = { fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px" };
  const inputStyle: React.CSSProperties = { width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "9px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <Link href={`/admin/events/${event_id}/tiers`} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none" }}>← Tiers</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "3px", margin: "4px 0" }}>TICKETS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", margin: 0 }}>{tickets.length} total registrations</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { resetCompForm(); setShowComp(true); }}
            style={{ ...btnPrimary, background: "#B78A1F" }}>
            <IconSparkle size={11} color="#FFFFFF" /> COMP TICKET
          </button>
          <Link href="/admin/check-in" style={{ ...btnPrimary, textDecoration: "none" }}>
            <IconCamera size={11} color="#FFFFFF" /> CHECK-IN SCANNER
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stack-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "REGISTERED", value: counts.active, color: "#1A8040" },
          { label: "CHECKED IN", value: counts.used, color: "#5A7A60" },
          { label: "PENDING", value: counts.pending_payment, color: "#156530" },
          { label: "CANCELLED", value: counts.cancelled, color: "#CC3344" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#FFFFFF", border: `2px solid ${color}30`, borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: R, fontSize: "1.6rem", color }}>{value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["all", "active", "used", "pending_payment", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ fontFamily: R, fontSize: "11px", background: filter === s ? "#E8F0E4" : "transparent", border: `1.5px solid ${filter === s ? "#1A8040" : "#DDE8DD"}`, color: filter === s ? "#1A8040" : "#5A7A60", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
            {s.replace("_", " ").toUpperCase()} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
          <SkListLoading />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60", letterSpacing: "2px" }}>
          NO TICKETS
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(ticket => {
            const color = STATUS_COLORS[ticket.status] ?? "#5A7A60";
            const canCancel = ticket.status === "active" || ticket.status === "pending_payment";
            const isComp = ticket?.qr_data?.comp_source === "admin_manual";
            const bundleSize = Number(ticket?.qr_data?.bundle_size ?? 1) || 1;
            return (
              <div key={ticket.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "14px 18px", display: "flex", gap: "14px", alignItems: "center" }}>
                {/* Avatar */}
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#E8F0E4", border: "1.5px solid #DDE8DD", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ticket.profiles?.avatar_url
                    ? <img src={ticket.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: R, fontSize: "14px", color: "#1A8040" }}>{(ticket.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                  }
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "0.5px", marginBottom: "3px" }}>
                    {ticket.profiles?.display_name ?? "Member"}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{ticket.ticket_number}</span>
                    <span style={{ fontFamily: R, fontSize: "10px", color: ticket.event_tiers?.color ?? "#5A7A60", background: (ticket.event_tiers?.color ?? "#5A7A60") + "20", borderRadius: "20px", padding: "1px 8px" }}>
                      {ticket.event_tiers?.name ?? "—"}
                    </span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{timeAgo(ticket.created_at)}</span>
                    {isComp && (
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#B78A1F", background: "#FFF3D6", border: "1px solid #F0D889", borderRadius: "20px", padding: "1px 8px", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <IconSparkle size={8} color="#B78A1F" /> COMP
                      </span>
                    )}
                    {ticket.checked_in_at && (
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "inline-flex", alignItems: "center", gap: "3px" }}><IconCheck size={10} color="#1A8040" /> {timeAgo(ticket.checked_in_at)}</span>
                    )}
                  </div>
                </div>
                {/* Status + cancel */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontFamily: R, fontSize: "10px", color, background: color + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px" }}>
                    {ticket.status.replace("_", " ").toUpperCase()}
                  </span>
                  {canCancel && (
                    <button
                      onClick={() => { setConfirmPhrase(""); setConfirmCancel({ id: ticket.id, bundle_id: bundleSize > 1 ? ticket.bundle_id : null, label: `${ticket.profiles?.display_name ?? "member"} · ${ticket.event_tiers?.name ?? "ticket"}${bundleSize > 1 ? ` (bundle of ${bundleSize})` : ""}`, buyer: ticket.profiles?.display_name ?? "member", bundleSize }); }}
                      title="Cancel this ticket"
                      style={{ background: "transparent", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#CC3344" }}>
                      <IconTrash size={12} color="#CC3344" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comp modal */}
      {showComp && (
        <div onClick={() => !compBusy && setShowComp(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "22px", maxWidth: "480px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#B78A1F", background: "#FFF3D6", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px", marginBottom: "6px" }}>
                  <IconSparkle size={9} color="#B78A1F" /> COMP TICKET
                </div>
                <h2 style={{ fontFamily: R, fontSize: "1.2rem", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>ISSUE MANUAL TICKET</h2>
                <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0", lineHeight: 1.5 }}>
                  Generates a real ticket for a member without going through PayMongo. Counts against event capacity like any other. Bundle tiers create all N tickets in one go.
                </p>
              </div>
              <button onClick={() => setShowComp(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                <IconX size={16} color="#5A7A60" />
              </button>
            </div>

            <div>
              <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", display: "block", marginBottom: "6px" }}>TIER (optional)</label>
              <select value={compTier} onChange={e => setCompTier(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">General Admission (no tier)</option>
                {tiers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {Number(t.price) > 0 ? `₱${Number(t.price).toLocaleString()}` : "Free"}
                    {Number(t.bundle_size ?? 1) > 1 ? ` · bundle of ${t.bundle_size}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", display: "block", marginBottom: "6px" }}>MEMBER</label>
              {compMember ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "#E8F0E4", border: "1.5px solid #1A804040", borderRadius: "8px" }}>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600, flex: 1 }}>{compMember.display_name ?? "Member"}</span>
                  <span style={{ fontFamily: SG, fontSize: "10px", color: "#5A7A60" }}>{compMember.email ?? compMember.id.slice(0, 12)}</span>
                  <button onClick={() => { setCompMember(null); setCompMemberSearch(""); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                    <IconX size={12} color="#5A7A60" />
                  </button>
                </div>
              ) : (
                <>
                  <input value={compMemberSearch} onChange={e => setCompMemberSearch(e.target.value)} placeholder="Search name / email / id…" style={inputStyle} />
                  {memberSearchResults.length > 0 && (
                    <div style={{ marginTop: "6px", background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "8px", maxHeight: "200px", overflowY: "auto" }}>
                      {memberSearchResults.map(m => (
                        <button key={m.id} onClick={() => setCompMember(m)}
                          style={{ display: "flex", width: "100%", gap: "10px", padding: "8px 12px", background: "transparent", border: "none", borderBottom: "1px solid #F0F5F0", cursor: "pointer", textAlign: "left", alignItems: "center" }}>
                          <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", fontWeight: 600, flex: 1 }}>{m.display_name ?? "(no name)"}</span>
                          <span style={{ fontFamily: SG, fontSize: "10px", color: "#7A8E7A" }}>{m.email ?? m.id.slice(0, 12)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", display: "block", marginBottom: "6px" }}>NOTE (optional)</label>
              <input value={compNote} onChange={e => setCompNote(e.target.value)} placeholder="e.g. sponsor comp, paid via GCash offline" style={inputStyle} />
            </div>

            {compError && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "8px 12px", fontFamily: B, fontSize: "12px", color: "#CC3344" }}>{compError}</div>}
            {compSuccess && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "8px 12px", fontFamily: B, fontSize: "12px", color: "#156530" }}>{compSuccess}</div>}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowComp(false)} disabled={compBusy} style={btnGhost}>CANCEL</button>
              <button onClick={submitComp} disabled={compBusy || !compMember} style={{ ...btnPrimary, background: "#B78A1F", opacity: (compBusy || !compMember) ? 0.6 : 1, cursor: (compBusy || !compMember) ? "not-allowed" : "pointer" }}>
                <IconSparkle size={11} color="#FFFFFF" /> {compBusy ? "ISSUING…" : "ISSUE TICKET"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force-cancel confirmation */}
      {confirmCancel && (() => {
        const isBundle = confirmCancel.bundleSize > 1;
        const phraseOK = !isBundle || confirmPhrase.trim().toLowerCase() === (confirmCancel.buyer ?? "").trim().toLowerCase();
        return (
          <div onClick={() => !cancelBusy && setConfirmCancel(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "22px", maxWidth: "460px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
              <h2 style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>
                CANCEL {isBundle ? `${confirmCancel.bundleSize} TICKETS` : "TICKET"}?
              </h2>
              <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60", margin: 0, lineHeight: 1.6 }}>
                {confirmCancel.label}
                {isBundle && " — all tickets in the bundle will be cancelled together."}
              </p>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: 0, lineHeight: 1.5 }}>
                The buyer will be emailed. You&apos;ll have a 30-second UNDO window after this.
              </p>
              {isBundle && (
                <div>
                  <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#CC3344", letterSpacing: "1.5px", display: "block", marginBottom: "6px" }}>
                    Type the buyer&apos;s name to confirm: <strong style={{ color: "#1B3A2D" }}>{confirmCancel.buyer}</strong>
                  </label>
                  <input value={confirmPhrase} onChange={e => setConfirmPhrase(e.target.value)}
                    placeholder="Type the name exactly"
                    style={{ width: "100%", background: "#F2F7F2", border: `1.5px solid ${phraseOK ? "#1A8040" : "#DDE8DD"}`, borderRadius: "8px", padding: "9px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    autoFocus />
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={() => { setConfirmCancel(null); setConfirmPhrase(""); }} style={btnGhost}>KEEP</button>
                <button onClick={forceCancel} disabled={cancelBusy || !phraseOK}
                  style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: (cancelBusy || !phraseOK) ? "#B7A0A0" : "#CC3344", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: (cancelBusy || !phraseOK) ? "not-allowed" : "pointer", letterSpacing: "1.2px" }}>
                  {cancelBusy ? "CANCELLING…" : `YES, CANCEL ${isBundle ? confirmCancel.bundleSize + " TICKETS" : ""}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* UNDO toast — 30s window after cancel */}
      {undoToast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 1200, background: "#1B3A2D", color: "#ffffff", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", maxWidth: "520px" }}>
          <div style={{ fontFamily: B, fontSize: "13px", flex: 1, minWidth: 0 }}>
            <strong>Cancelled.</strong>{" "}
            <span style={{ color: "rgba(255,255,255,0.75)" }}>{undoToast.label}</span>
          </div>
          <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "1px" }}>{undoRemaining}s</span>
          <button onClick={undoCancel} disabled={undoBusy}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, background: "#ffffff", color: "#1B3A2D", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: undoBusy ? "wait" : "pointer", letterSpacing: "1.2px" }}>
            {undoBusy ? "RESTORING…" : "UNDO"}
          </button>
          <button onClick={() => setUndoToast(null)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
            <IconX size={14} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      )}
    </div>
  );
}
