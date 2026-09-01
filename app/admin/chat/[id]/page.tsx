"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconMessage, IconUsers, IconTrash, IconWarning, IconCheck } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Msg {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  edited_at: string | null;
  reply_to_id: string | null;
  is_pinned: boolean;
  profiles?: { display_name?: string; avatar_url?: string } | null;
}

interface Room {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  avatar_url: string | null;
  created_at: string;
}

interface Member {
  user_id: string;
  joined_at: string;
  profiles?: { display_name?: string; avatar_url?: string } | null;
}

function stamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
}

export default function AdminChatRoomPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [room, setRoom]         = useState<Room | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [status, setStatus]     = useState("");
  const [working, setWorking]   = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [senderFilter, setSenderFilter] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/chat/messages?room_id=${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRoom(d.room);
      setMessages(d.messages ?? []);
      setMembers(d.members ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (id) load(); }, [id]);

  const filtered = useMemo(() => {
    return messages.filter(m => {
      if (senderFilter && m.sender_id !== senderFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!(m.content ?? "").toLowerCase().includes(q) && !(m.profiles?.display_name ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [messages, search, senderFilter]);

  async function deleteMsg(mid: string, preview: string) {
    if (!confirm(`Delete this message?\n\n"${preview.slice(0, 100)}${preview.length > 100 ? "…" : ""}"\n\nThis is audit-logged.`)) return;
    setWorking(mid); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/chat/messages?id=${mid}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessages(prev => prev.filter(m => m.id !== mid));
      setStatus("Message deleted.");
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>;
  if (error && !room) return <div style={{ padding: "48px", textAlign: "center", fontFamily: B, color: "#CC3344" }}>{error}</div>;
  if (!room) return null;

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {room.avatar_url ? <img src={room.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : room.is_group ? <IconUsers size={22} color="#1A8040" /> : <IconMessage size={20} color="#1A8040" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href="/admin/chat" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← ALL CHATS</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "2px", marginTop: "2px" }}>{room.name ?? (room.is_group ? "Group Chat" : "Direct Message")}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: room.is_group ? "#156530" : "#1E4A7A", background: room.is_group ? "#E8F0E4" : "#E4EEF8", borderRadius: "6px", padding: "2px 8px", letterSpacing: "1.2px" }}>
              {room.is_group ? "GROUP" : "DM"}
            </span>
            <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{members.length} participant{members.length !== 1 ? "s" : ""} · {messages.length} messages · created {stamp(room.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 18px" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "10px" }}>PARTICIPANTS ({members.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <button onClick={() => setSenderFilter("")}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: senderFilter === "" ? "#ffffff" : "#1B3A2D", background: senderFilter === "" ? "#1A8040" : "#F2F7F2", border: "none", borderRadius: "999px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1.1px" }}>
            ALL
          </button>
          {members.map(m => (
            <button key={m.user_id} onClick={() => setSenderFilter(m.user_id === senderFilter ? "" : m.user_id)}
              style={{ fontFamily: B, fontSize: "11px", color: senderFilter === m.user_id ? "#ffffff" : "#1B3A2D", background: senderFilter === m.user_id ? "#1A8040" : "#F2F7F2", border: "none", borderRadius: "999px", padding: "5px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              {m.profiles?.avatar_url && <img src={m.profiles.avatar_url} alt="" style={{ width: 14, height: 14, borderRadius: "50%" }} />}
              {m.profiles?.display_name ?? m.user_id.slice(0, 8)}
            </button>
          ))}
        </div>
      </div>

      {/* Search + status */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…" style={inp} />
      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "inline-flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "inline-flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {/* Messages — newest first */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>No messages match your filter.</div>
        ) : (
          filtered.map((m, i) => (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: "12px", padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", alignItems: "start" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040" }}>{(m.profiles?.display_name ?? "?")[0]?.toUpperCase()}</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#1B3A2D" }}>{m.profiles?.display_name ?? m.sender_id.slice(0, 8)}</span>
                  <span style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{stamp(m.created_at)}</span>
                  {m.edited_at && <span style={{ fontFamily: B, fontSize: "10px", color: "#B78A1F" }}>(edited)</span>}
                  {m.is_pinned && <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "6px", padding: "1px 6px", letterSpacing: "1.1px" }}>PINNED</span>}
                </div>
                {m.content && <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", marginTop: "3px", lineHeight: 1.55, whiteSpace: "pre-wrap" as const }}>{m.content}</div>}
                {m.image_url && (
                  <a href={m.image_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px" }}>
                    <img src={m.image_url} alt="" style={{ maxHeight: 140, borderRadius: 8, border: "1px solid #DDE8DD" }} />
                  </a>
                )}
              </div>
              <button onClick={() => deleteMsg(m.id, m.content ?? "(image)")} disabled={working === m.id}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px", height: "fit-content" }}>
                <IconTrash size={11} color="#8A1E27" /> DELETE
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
