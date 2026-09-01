"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconCheck, IconTrash, IconWarning, IconBell } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Status = "waiting" | "notified" | "converted" | "expired" | "cancelled";

interface Entry {
  id: string;
  event_id: string;
  user_id: string;
  status: Status;
  notified_at: string | null;
  converted_at: string | null;
  note: string | null;
  created_at: string;
  profiles?: { display_name?: string; avatar_url?: string; email?: string } | null;
}

interface Event { id: string; title: string; date: string; event_time: string | null; capacity: number | null; }

const STATUS_META: Record<Status, { color: string; bg: string; label: string }> = {
  waiting:   { color: "#7A5A0F", bg: "#FFF3D6", label: "WAITING" },
  notified:  { color: "#1E4A7A", bg: "#E4EEF8", label: "NOTIFIED" },
  converted: { color: "#156530", bg: "#E8F0E4", label: "CONVERTED" },
  expired:   { color: "#5A5A5A", bg: "#F0F0F0", label: "EXPIRED" },
  cancelled: { color: "#8A1E27", bg: "#FFE8EC", label: "CANCELLED" },
};

function stamp(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
}

export default function AdminWaitlistDetail() {
  const params  = useParams();
  const eventId = String(params?.id ?? "");
  const [event, setEvent]     = useState<Event | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [registered, setRegistered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [filter, setFilter]   = useState<Status | "all">("waiting");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/waitlist?event_id=${eventId}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEvent(d.event);
      setEntries(d.entries ?? []);
      setRegistered(d.registered_count ?? 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (eventId) load(); }, [eventId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length, waiting: 0, notified: 0, converted: 0, expired: 0, cancelled: 0 };
    for (const e of entries) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [entries]);

  const filtered = useMemo(() => filter === "all" ? entries : entries.filter(e => e.status === filter), [entries, filter]);

  async function patch(id: string, next: Status, msg: string) {
    setBusy(id); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/waitlist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(msg);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this waitlist entry? Member will no longer be on the list.")) return;
    setBusy(id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/waitlist?id=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Entry deleted.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function notifyAll() {
    const waiting = entries.filter(e => e.status === "waiting");
    if (waiting.length === 0) return;
    if (!confirm(`Notify all ${waiting.length} waiting member${waiting.length === 1 ? "" : "s"} that a spot may be available?`)) return;
    setBusy("__all__"); setError(""); setStatus("");
    try {
      for (const e of waiting) {
        await fetch("/api/admin/waitlist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: e.id, status: "notified" }) });
      }
      setStatus(`Notified ${waiting.length} member${waiting.length === 1 ? "" : "s"}.`);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>;
  if (error && !event) return <div style={{ padding: "48px", textAlign: "center", fontFamily: B, color: "#CC3344" }}>{error}</div>;
  if (!event) return null;

  const isFull = event.capacity != null && registered >= event.capacity;
  const openSeats = event.capacity != null ? Math.max(0, event.capacity - registered) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <Link href="/admin/waitlist" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← ALL WAITLISTS</Link>
        <h1 style={{ fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: "2px", marginTop: "4px", marginBottom: "4px" }}>{event.title}</h1>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
            {new Date(event.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
            {event.event_time ? ` · ${event.event_time}` : ""}
          </span>
          <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: isFull ? "#8A1E27" : "#156530", background: isFull ? "#FFE8EC" : "#E8F0E4", borderRadius: "8px", padding: "4px 10px", letterSpacing: "1.2px" }}>
            {registered}/{event.capacity ?? "∞"} REGISTERED
          </span>
          {openSeats != null && openSeats > 0 && !isFull && (
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#156530", background: "#E8F0E4", borderRadius: "8px", padding: "4px 10px", letterSpacing: "1.2px" }}>
              {openSeats} SEAT{openSeats === 1 ? "" : "S"} OPEN
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(["all", "waiting", "notified", "converted", "expired", "cancelled"] as (Status | "all")[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === f ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
              {f.toUpperCase()}{f !== "all" && counts[f] !== undefined && ` (${counts[f]})`}
            </button>
          ))}
        </div>
        {counts.waiting > 0 && (
          <button onClick={notifyAll} disabled={busy === "__all__"}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1E4A7A", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <IconBell size={11} color="#ffffff" /> NOTIFY ALL WAITING
          </button>
        )}
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          No {filter === "all" ? "waitlist" : filter} entries.
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
          {filtered.map((e, i) => {
            const meta = STATUS_META[e.status];
            const position = filter === "waiting" || filter === "all"
              ? entries.filter(x => x.status === "waiting" && x.created_at <= e.created_at).length
              : null;
            return (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "36px 34px 1fr auto auto", gap: "12px", padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", alignItems: "center" }}>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", textAlign: "center" as const }}>{e.status === "waiting" && position ? `#${position}` : "—"}</span>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {e.profiles?.avatar_url ? <img src={e.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040" }}>{(e.profiles?.display_name ?? "?")[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#1B3A2D" }}>{e.profiles?.display_name ?? e.user_id.slice(0, 12)}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>
                    {e.profiles?.email ?? "no email"} · joined {stamp(e.created_at)}
                    {e.notified_at && ` · notified ${stamp(e.notified_at)}`}
                  </div>
                </div>
                <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{meta.label}</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {e.status === "waiting" && (
                    <button onClick={() => patch(e.id, "notified", "Member notified.")} disabled={busy === e.id}
                      style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1E4A7A", background: "#E4EEF8", border: "1.5px solid transparent", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.1px" }}>
                      NOTIFY
                    </button>
                  )}
                  {(e.status === "waiting" || e.status === "notified") && (
                    <button onClick={() => patch(e.id, "converted", "Marked converted.")} disabled={busy === e.id}
                      style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.1px" }}>
                      CONVERTED
                    </button>
                  )}
                  {e.status !== "cancelled" && e.status !== "expired" && (
                    <button onClick={() => patch(e.id, "expired", "Marked expired.")} disabled={busy === e.id}
                      style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A5A5A", background: "#F0F0F0", border: "1.5px solid transparent", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.1px" }}>
                      EXPIRE
                    </button>
                  )}
                  <button onClick={() => remove(e.id)} disabled={busy === e.id}
                    style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.1px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <IconTrash size={10} color="#8A1E27" />
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
