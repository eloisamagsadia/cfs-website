"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconWarning, IconCheck, IconCart, IconHeart, IconTicket, IconTrash, IconLightning, IconChart } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type EntityKind = "order" | "donation" | "event_registration" | "event_ticket";
type Status     = "pending" | "processing" | "completed" | "failed" | "cancelled";

interface MemberHit    { id: string; display_name: string | null; email: string | null; avatar_url: string | null }
interface TicketHit    { id: string; ticket_number: string | null; amount: number; event_title: string; created_at: string }
interface OrderHit     { id: string; total: number; created_at: string }
interface DonationHit  { id: string; amount: number; message: string | null; created_at: string }
interface Refundable   { tickets: TicketHit[]; orders: OrderHit[]; donations: DonationHit[] }

interface Refund {
  id: string;
  entity_type: EntityKind;
  entity_id: string;
  user_id: string | null;
  amount: number;
  reason: string;
  status: Status;
  paymongo_ref: string | null;
  note: string | null;
  requested_by: string;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  profiles?: { display_name?: string; avatar_url?: string } | null;
}

const ENTITY_META: Record<EntityKind, { label: string; icon: React.ReactNode; href: (id: string) => string }> = {
  order:               { label: "ORDER",       icon: <IconCart size={12} color="#7A5A0F" />,   href: (id) => `/admin/orders/${id}` },
  donation:            { label: "DONATION",    icon: <IconHeart size={12} color="#B78A1F" />,  href: (id) => `/admin/donations` },
  event_registration:  { label: "EVENT REG",   icon: <IconTicket size={12} color="#156530" />, href: (id) => `/admin/events` },
  event_ticket:        { label: "TICKET",      icon: <IconTicket size={12} color="#1A8040" />, href: (id) => `/admin/events` },
};

const STATUS_META: Record<Status, { color: string; bg: string; label: string }> = {
  pending:    { color: "#7A5A0F", bg: "#FFF3D6", label: "PENDING" },
  processing: { color: "#1E4A7A", bg: "#E4EEF8", label: "PROCESSING" },
  completed:  { color: "#156530", bg: "#E8F0E4", label: "COMPLETED" },
  failed:     { color: "#8A1E27", bg: "#FFE8EC", label: "FAILED" },
  cancelled:  { color: "#5A5A5A", bg: "#F0F0F0", label: "CANCELLED" },
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

const inp: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px",
  padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [filter, setFilter]   = useState<Status | "all">("pending");
  const [search, setSearch]   = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ entity_type: "order" as EntityKind, entity_id: "", user_id: "", amount: "", reason: "", note: "" });
  const [showNew, setShowNew] = useState(false);

  // NEW REFUND picker state — search a member, then pick one of their
  // paid tickets/orders/donations. Never asks the admin for a UUID.
  const [memberQ,       setMemberQ]       = useState("");
  const [memberHits,    setMemberHits]    = useState<MemberHit[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [picked,        setPicked]        = useState<MemberHit | null>(null);
  const [refundable,    setRefundable]    = useState<Refundable | null>(null);
  const [refundableLoading, setRefundableLoading] = useState(false);
  const [pickedEntity,  setPickedEntity]  = useState<{ kind: EntityKind; label: string } | null>(null);

  // Debounced member search
  useEffect(() => {
    if (!showNew) return;
    if (picked) return;                 // pause search once a member is locked in
    const q = memberQ.trim();
    if (q.length < 2) { setMemberHits([]); return; }
    setMemberSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        setMemberHits((d?.members ?? []).slice(0, 8));
      } catch {}
      finally { setMemberSearching(false); }
    }, 220);
    return () => clearTimeout(t);
  }, [memberQ, showNew, picked]);

  // When a member is picked, pull their refundable purchases
  useEffect(() => {
    if (!picked) { setRefundable(null); setPickedEntity(null); return; }
    setRefundableLoading(true);
    fetch(`/api/admin/refunds/refundable?user_id=${picked.id}`)
      .then(r => r.json())
      .then(d => setRefundable({ tickets: d.tickets ?? [], orders: d.orders ?? [], donations: d.donations ?? [] }))
      .catch(() => setRefundable({ tickets: [], orders: [], donations: [] }))
      .finally(() => setRefundableLoading(false));
  }, [picked]);

  function resetNewForm() {
    setNewForm({ entity_type: "order", entity_id: "", user_id: "", amount: "", reason: "", note: "" });
    setMemberQ(""); setMemberHits([]); setPicked(null); setRefundable(null); setPickedEntity(null);
  }

  function selectMember(m: MemberHit) {
    setPicked(m);
    setNewForm(p => ({ ...p, user_id: m.id, entity_id: "", amount: "" }));
    setMemberHits([]);
  }

  function selectTicket(t: TicketHit) {
    setPickedEntity({ kind: "event_ticket", label: `${t.event_title} · #${t.ticket_number ?? t.id.slice(0, 8)}` });
    setNewForm(p => ({ ...p, entity_type: "event_ticket", entity_id: t.id, amount: String(t.amount) }));
  }
  function selectOrder(o: OrderHit) {
    setPickedEntity({ kind: "order", label: `Order #${o.id.slice(0, 8)}` });
    setNewForm(p => ({ ...p, entity_type: "order", entity_id: o.id, amount: String(o.total) }));
  }
  function selectDonation(d: DonationHit) {
    setPickedEntity({ kind: "donation", label: `Donation #${d.id.slice(0, 8)}` });
    setNewForm(p => ({ ...p, entity_type: "donation", entity_id: d.id, amount: String(d.amount) }));
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/refunds?status=${filter}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRefunds(d.refunds ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: refunds.length, pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 };
    for (const r of refunds) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [refunds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return refunds;
    return refunds.filter(r =>
      r.entity_id.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      (r.paymongo_ref ?? "").toLowerCase().includes(q) ||
      (r.profiles?.display_name ?? "").toLowerCase().includes(q) ||
      (r.user_id ?? "").toLowerCase().includes(q)
    );
  }, [refunds, search]);

  async function patch(id: string, body: any, msg: string) {
    setWorking(id); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/refunds", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(msg);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  async function processViaPayMongo(r: any) {
    const msg = `PROCESS THIS REFUND VIA PAYMONGO?\n\n` +
                `Amount: ₱${Number(r.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}\n` +
                `Entity: ${r.entity_type} · ${r.entity_id.slice(0, 8)}\n\n` +
                `This calls PayMongo's Refunds API and sends the money back to the original payment method. ` +
                `This cannot be undone. Only proceed if you're sure.`;
    if (!confirm(msg)) return;
    setWorking(r.id); setError(""); setStatus("");
    try {
      const res = await fetch("/api/admin/refunds/paymongo/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refund_id: r.id, reason: "requested_by_customer" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStatus(d.status === "completed"
        ? `PayMongo confirmed the refund immediately. Marked completed.`
        : `PayMongo accepted the request. Waiting for confirmation webhook.`);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this refund entry? This does NOT reverse anything on the payment provider.")) return;
    setWorking(id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/refunds?id=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Refund entry deleted.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  async function createNew() {
    setError(""); setStatus("");
    if (!newForm.entity_id.trim() || !newForm.reason.trim() || !newForm.amount) {
      setError("Entity ID, amount, and reason are required."); return;
    }
    setWorking("__new__");
    try {
      const r = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: newForm.entity_type,
          entity_id:   newForm.entity_id.trim(),
          user_id:     newForm.user_id.trim() || null,
          amount:      parseFloat(newForm.amount),
          reason:      newForm.reason.trim(),
          note:        newForm.note.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Refund created (pending).");
      resetNewForm();
      setShowNew(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  const tabs: (Status | "all")[] = ["all", "pending", "processing", "completed", "failed", "cancelled"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>REFUNDS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Track order and donation refunds. This only records the workflow — actual money movement happens in the PayMongo dashboard.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/admin/refunds/performance"
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconChart size={12} color="#1A8040" /> PERFORMANCE
          </Link>
          <button onClick={() => { setShowNew(v => { if (v) resetNewForm(); return !v; }); }}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: showNew ? "#5A5A5A" : "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {showNew ? "CLOSE" : "NEW REFUND"}
          </button>
        </div>
      </div>

      {/* New refund form — picker flow (no UUIDs to type) */}
      {showNew && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#7A5A0F", letterSpacing: "2px" }}>NEW REFUND</div>

          {/* Step 1 — pick the member */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.4px" }}>1 · MEMBER</div>
            {picked ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "8px 12px" }}>
                {picked.avatar_url
                  ? <img src={picked.avatar_url} alt="" style={{ width: "28px", height: "28px", borderRadius: "999px", objectFit: "cover" }} />
                  : <div style={{ width: "28px", height: "28px", borderRadius: "999px", background: "#E8F0E4", color: "#1A8040", fontFamily: SG, fontWeight: 700, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>{(picked.display_name ?? picked.email ?? "?")[0]?.toUpperCase()}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600 }}>{picked.display_name ?? "—"}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{picked.email ?? picked.id}</div>
                </div>
                <button onClick={resetNewForm} style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A5A5A", background: "#F0F0F0", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", letterSpacing: "1.2px" }}>CHANGE</button>
              </div>
            ) : (
              <>
                <input value={memberQ} onChange={e => setMemberQ(e.target.value)} placeholder="Search by name or email…" style={inp} autoFocus />
                {memberSearching && <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>Searching…</div>}
                {memberHits.length > 0 && (
                  <div style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", overflow: "hidden" }}>
                    {memberHits.map(m => (
                      <button key={m.id} onClick={() => selectMember(m)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "transparent", border: "none", borderBottom: "1px solid #F0F5F0", cursor: "pointer", textAlign: "left" as const }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FCF8"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" style={{ width: "26px", height: "26px", borderRadius: "999px", objectFit: "cover" }} />
                          : <div style={{ width: "26px", height: "26px", borderRadius: "999px", background: "#E8F0E4", color: "#1A8040", fontFamily: SG, fontWeight: 700, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>{(m.display_name ?? m.email ?? "?")[0]?.toUpperCase()}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", fontWeight: 600 }}>{m.display_name ?? "—"}</div>
                          <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email ?? m.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Step 2 — pick the purchase to refund */}
          {picked && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.4px" }}>2 · WHAT'S BEING REFUNDED</div>
              {refundableLoading ? (
                <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>Loading their purchases…</div>
              ) : refundable && (refundable.tickets.length + refundable.orders.length + refundable.donations.length) === 0 ? (
                <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "10px", padding: "14px", fontFamily: B, fontSize: "12px", color: "#7A8E7A", textAlign: "center" as const }}>
                  This member has no paid tickets, orders, or donations on record.
                </div>
              ) : refundable && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {refundable.tickets.length > 0 && (
                    <PickerGroup label={`Tickets (${refundable.tickets.length})`} accent="#1A8040" icon={<IconTicket size={11} color="#1A8040" />}>
                      {refundable.tickets.map(t => {
                        const active = pickedEntity?.kind === "event_ticket" && newForm.entity_id === t.id;
                        return (
                          <PickerRow key={t.id} active={active} onClick={() => selectTicket(t)}
                            title={t.event_title} sub={`#${t.ticket_number ?? t.id.slice(0, 8)} · ${new Date(t.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`}
                            amount={t.amount} accent="#1A8040" />
                        );
                      })}
                    </PickerGroup>
                  )}
                  {refundable.orders.length > 0 && (
                    <PickerGroup label={`Orders (${refundable.orders.length})`} accent="#7A5A0F" icon={<IconCart size={11} color="#7A5A0F" />}>
                      {refundable.orders.map(o => {
                        const active = pickedEntity?.kind === "order" && newForm.entity_id === o.id;
                        return (
                          <PickerRow key={o.id} active={active} onClick={() => selectOrder(o)}
                            title={`Order #${o.id.slice(0, 8)}`} sub={new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            amount={o.total} accent="#7A5A0F" />
                        );
                      })}
                    </PickerGroup>
                  )}
                  {refundable.donations.length > 0 && (
                    <PickerGroup label={`Donations (${refundable.donations.length})`} accent="#B78A1F" icon={<IconHeart size={11} color="#B78A1F" />}>
                      {refundable.donations.map(d => {
                        const active = pickedEntity?.kind === "donation" && newForm.entity_id === d.id;
                        return (
                          <PickerRow key={d.id} active={active} onClick={() => selectDonation(d)}
                            title={`Donation #${d.id.slice(0, 8)}`} sub={d.message ? `"${d.message.slice(0, 40)}${d.message.length > 40 ? "…" : ""}"` : new Date(d.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            amount={d.amount} accent="#B78A1F" />
                        );
                      })}
                    </PickerGroup>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — amount, reason, note (only after a purchase is picked) */}
          {picked && pickedEntity && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.4px" }}>3 · DETAILS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "10px" }}>
                <input value={newForm.reason} onChange={e => setNewForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (customer-facing) — required" style={inp} />
                <input value={newForm.amount} onChange={e => setNewForm(p => ({ ...p, amount: e.target.value }))} placeholder="Amount (PHP)" type="number" min="0" step="0.01" style={inp} />
              </div>
              <textarea value={newForm.note} onChange={e => setNewForm(p => ({ ...p, note: e.target.value }))} placeholder="Internal note (optional)" rows={2} style={{ ...inp, resize: "vertical" as const }} />
              <button onClick={createNew} disabled={working === "__new__"}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", alignSelf: "flex-start" }}>
                {working === "__new__" ? "CREATING…" : "CREATE REFUND"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: filter === t ? "#ffffff" : "#1B3A2D", background: filter === t ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === t ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {t.toUpperCase()}{t !== "all" && counts[t] !== undefined && ` (${counts[t]})`}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID / reason / ref / member…" style={{ ...inp, flex: 1, minWidth: "220px" }} />
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px" }}>NO {filter.toUpperCase()} REFUNDS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "6px" }}>Refund requests you create will queue here.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(r => {
            const emeta = ENTITY_META[r.entity_type];
            const smeta = STATUS_META[r.status];
            return (
              <div key={r.id} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "4px" }}>{emeta.icon} {emeta.label}</span>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: smeta.color, background: smeta.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{smeta.label}</span>
                  <span style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "0.5px" }}>₱{Number(r.amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span style={{ marginLeft: "auto", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{timeAgo(r.created_at)}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>
                  <span style={{ color: "#5A7A60" }}>Reason</span><span>{r.reason}</span>
                  <span style={{ color: "#5A7A60" }}>{emeta.label} ID</span><Link href={emeta.href(r.entity_id)} style={{ color: "#1A8040", textDecoration: "underline" }}>{r.entity_id}</Link>
                  {r.profiles?.display_name && (<><span style={{ color: "#5A7A60" }}>Customer</span><span>{r.profiles.display_name}</span></>)}
                  {r.paymongo_ref && (<><span style={{ color: "#5A7A60" }}>PayMongo</span><span style={{ fontFamily: "monospace" }}>{r.paymongo_ref}</span></>)}
                  {r.note && (<><span style={{ color: "#5A7A60" }}>Note</span><span style={{ whiteSpace: "pre-wrap" as const }}>{r.note}</span></>)}
                  {r.processed_at && (<><span style={{ color: "#5A7A60" }}>Processed</span><span>{new Date(r.processed_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</span></>)}
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => processViaPayMongo(r)} disabled={working === r.id}
                        title="Call PayMongo Refunds API and send the money back to the original payment method. Irreversible."
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <IconLightning size={10} color="#ffffff" /> PROCESS VIA PAYMONGO
                      </button>
                      <button onClick={() => patch(r.id, { status: "processing" }, "Marked processing.")} disabled={working === r.id}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1E4A7A", background: "#E4EEF8", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                        MARK PROCESSING
                      </button>
                      <button onClick={() => patch(r.id, { status: "cancelled" }, "Cancelled.")} disabled={working === r.id}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A5A5A", background: "#F0F0F0", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                        CANCEL
                      </button>
                    </>
                  )}
                  {(r.status === "pending" || r.status === "processing") && (
                    <button onClick={() => {
                      const ref = prompt("PayMongo refund reference (optional):", r.paymongo_ref ?? "");
                      if (ref === null) return;
                      patch(r.id, { status: "completed", paymongo_ref: ref || null }, "Marked completed.");
                    }} disabled={working === r.id}
                      style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <IconCheck size={11} color="#ffffff" /> MARK COMPLETED
                    </button>
                  )}
                  {(r.status === "pending" || r.status === "processing") && (
                    <button onClick={() => patch(r.id, { status: "failed" }, "Marked failed.")} disabled={working === r.id}
                      style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                      MARK FAILED
                    </button>
                  )}
                  <button onClick={() => remove(r.id)} disabled={working === r.id}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconTrash size={11} color="#8A1E27" /> DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PickerGroup({ label, accent, icon, children }: { label: string; accent: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: accent, letterSpacing: "1.4px", padding: "6px 10px", background: `${accent}0F`, borderBottom: `1px solid ${accent}22`, display: "flex", alignItems: "center", gap: "6px" }}>
        {icon} {label.toUpperCase()}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PickerRow({ active, onClick, title, sub, amount, accent }: { active: boolean; onClick: () => void; title: string; sub: string; amount: number; accent: string }) {
  return (
    <button onClick={onClick} type="button"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%",
        padding: "9px 12px", border: "none", borderBottom: "1px solid #F0F5F0",
        background: active ? `${accent}18` : "transparent",
        cursor: "pointer", textAlign: "left" as const,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8FCF8"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
        ₱{Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </button>
  );
}
