"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconMessage, IconUsers, IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Filter = "all" | "group" | "dm";

interface Room {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  avatar_url: string | null;
  created_at: string;
  pinned_message_id: string | null;
  message_count: number;
  last_message: { content: string; sender_id: string; created_at: string; image_url: string | null } | null;
  participants: { user_id: string; profiles?: { display_name?: string; avatar_url?: string } | null }[];
}

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

function roomDisplayName(r: Room) {
  if (r.name) return r.name;
  if (r.is_group) return `Group of ${r.participants.length}`;
  const names = r.participants.map(p => p.profiles?.display_name ?? p.user_id).slice(0, 2);
  return names.join(" ↔ ") || "Direct message";
}

export default function AdminChatModPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/chat/rooms?type=${filter}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRooms(d.rooms ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  const counts = useMemo(() => {
    const c = { all: rooms.length, group: 0, dm: 0 };
    for (const r of rooms) r.is_group ? c.group++ : c.dm++;
    return c;
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(r =>
      roomDisplayName(r).toLowerCase().includes(q) ||
      r.participants.some(p => (p.profiles?.display_name ?? "").toLowerCase().includes(q)) ||
      (r.last_message?.content ?? "").toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <div style={{ display: "inline-block", background: "#8A1E27", borderRadius: "6px", padding: "3px 12px", marginBottom: "8px" }}>
          <span style={{ fontFamily: R, fontSize: "10px", color: "#ffffff", letterSpacing: "2px", display: "inline-flex", alignItems: "center", gap: "5px" }}><IconWarning size={10} color="#ffffff" /> MODERATOR ONLY</span>
        </div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>CHAT MODERATION</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>All chat rooms. Read-only browse with the ability to delete abusive messages. Every deletion is audit-logged.</p>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#8A1E27", marginTop: "4px" }}>
          Opening a <strong>DM</strong> requires a written reason and creates a permanent audit record. Only open one when investigating a specific report.
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "group", "dm"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === f ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {f.toUpperCase()} ({counts[f]})
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search room name / participant / message…" style={{ ...inp, flex: 1, minWidth: "220px" }} />
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
          <IconMessage size={28} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px", marginTop: "10px" }}>NO ROOMS</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(r => (
            <Link key={r.id} href={`/admin/chat/${r.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "14px 18px", display: "grid", gridTemplateColumns: "42px 1fr auto", gap: "14px", alignItems: "center" }}>

                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : r.is_group ? <IconUsers size={20} color="#1A8040" /> : <IconMessage size={18} color="#1A8040" />}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{roomDisplayName(r)}</span>
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: r.is_group ? "#156530" : "#1E4A7A", background: r.is_group ? "#E8F0E4" : "#E4EEF8", borderRadius: "6px", padding: "2px 7px", letterSpacing: "1.2px" }}>
                      {r.is_group ? "GROUP" : "DM"}
                    </span>
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "6px", padding: "2px 7px", letterSpacing: "1.2px" }}>
                      {r.participants.length}👤
                    </span>
                  </div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.last_message ? (r.last_message.image_url ? "📷 image" : r.last_message.content) : <em>no messages</em>}
                  </div>
                </div>

                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040" }}>{r.message_count} msg</div>
                  <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{r.last_message ? timeAgo(r.last_message.created_at) : timeAgo(r.created_at)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
