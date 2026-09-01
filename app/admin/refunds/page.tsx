"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconWarning, IconCheck, IconCart, IconHeart, IconTicket, IconTrash } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type EntityKind = "order" | "donation" | "event_registration";
type Status     = "pending" | "processing" | "completed" | "failed" | "cancelled";

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
      setNewForm({ entity_type: "order", entity_id: "", user_id: "", amount: "", reason: "", note: "" });
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
        <button onClick={() => setShowNew(v => !v)}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: showNew ? "#5A5A5A" : "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
          {showNew ? "CLOSE" : "NEW REFUND"}
        </button>
      </div>

      {/* New refund form */}
      {showNew && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#7A5A0F", letterSpacing: "2px" }}>NEW REFUND</div>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: "10px" }}>
            <select value={newForm.entity_type} onChange={e => setNewForm(p => ({ ...p, entity_type: e.target.value as EntityKind }))} style={inp}>
              <option value="order">Order</option>
              <option value="donation">Donation</option>
              <option value="event_registration">Event Reg</option>
            </select>
            <input value={newForm.entity_id} onChange={e => setNewForm(p => ({ ...p, entity_id: e.target.value }))} placeholder="Entity ID (UUID)" style={inp} />
            <input value={newForm.amount}    onChange={e => setNewForm(p => ({ ...p, amount:   e.target.value }))} placeholder="Amount (PHP)"   type="number" min="0" step="0.01" style={inp} />
          </div>
          <input value={newForm.user_id} onChange={e => setNewForm(p => ({ ...p, user_id: e.target.value }))} placeholder="User ID (optional)" style={inp} />
          <input value={newForm.reason}  onChange={e => setNewForm(p => ({ ...p, reason: e.target.value }))}  placeholder="Reason (customer-facing)" style={inp} />
          <textarea value={newForm.note} onChange={e => setNewForm(p => ({ ...p, note:   e.target.value }))}  placeholder="Internal note (optional)" rows={2} style={{ ...inp, resize: "vertical" as const }} />
          <button onClick={createNew} disabled={working === "__new__"}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", alignSelf: "flex-start" }}>
            {working === "__new__" ? "CREATING…" : "CREATE REFUND"}
          </button>
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
