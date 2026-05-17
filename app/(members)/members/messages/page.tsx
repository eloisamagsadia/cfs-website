"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function MessagesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "dm" | "group">("all");
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    loadRooms();
    fetch("/api/community/members").then(r => r.json()).then(d => setMembers(d.members ?? []));
  }, [isLoaded, user]);

  async function loadRooms() {
    const res = await fetch("/api/chat");
    const d = await res.json();
    setRooms(d.rooms ?? []);
    setLoading(false);
  }

  async function createRoom() {
    if (!selected.length) return;
    setCreating(true);
    const isGroup = selected.length > 1;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: isGroup ? groupName || "Group Chat" : null, is_group: isGroup, member_ids: selected }),
    });
    const data = await res.json();
    setCreating(false);
    setShowNew(false);
    setSelected([]);
    setGroupName("");
    router.push(`/members/messages/${data.room.id}`);
  }

  async function leaveRoom(roomId: string) {
    await fetch(`/api/chat/${roomId}/leave`, { method: "POST" });
    setRooms(prev => prev.filter(r => r.id !== roomId));
    setConfirmDelete(null);
  }

  function getRoomName(room: any) {
    if (room.name) return room.name;
    const others = (room.chat_members ?? []).filter((m: any) => m.user_id !== user?.id);
    return others.map((m: any) => m.profiles?.display_name ?? "Member").join(", ") || "Chat";
  }

  function getRoomAvatar(room: any) {
    if (room.is_group) return null;
    const other = (room.chat_members ?? []).find((m: any) => m.user_id !== user?.id);
    return other?.profiles?.avatar_url;
  }

  function formatTime(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
    if (diff < 604800000) return d.toLocaleDateString("en-PH", { weekday: "short", timeZone: "Asia/Manila" });
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
  }

  const filteredMembers = members.filter(m => m.id !== user?.id && (m.display_name ?? "").toLowerCase().includes(memberSearch.toLowerCase()));

  const filteredRooms = rooms
    .filter(r => filter === "all" || (filter === "dm" ? !r.is_group : r.is_group))
    .filter(r => !search || getRoomName(r).toLowerCase().includes(search.toLowerCase()));

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unread_count ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MESSAGES</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>
            {rooms.length} conversation{rooms.length !== 1 ? "s" : ""}
            {totalUnread > 0 && <span style={{ color: "#3CCE2A", marginLeft: "8px" }}>· {totalUnread} unread</span>}
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          style={{ fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
          + NEW CHAT
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
          style={{ width: "100%", background: "#1C2E14", border: "1.5px solid #2C4820", borderRadius: "20px", padding: "10px 16px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: "8px" }}>
          {(["all", "dm", "group"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: R, fontSize: "10px", letterSpacing: "1px", padding: "5px 14px", borderRadius: "20px", border: `1.5px solid ${filter === f ? "#3CCE2A" : "#2C4820"}`, background: filter === f ? "#1A3D14" : "transparent", color: filter === f ? "#3CCE2A" : "#5A7A50", cursor: "pointer" }}>
              {f === "all" ? "ALL" : f === "dm" ? "DIRECT" : "GROUPS"}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "64px", borderRadius: "12px" }} />)}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A50", letterSpacing: "2px", marginBottom: "16px" }}>
            {search || filter !== "all" ? "NO CONVERSATIONS FOUND" : "NO CONVERSATIONS YET"}
          </div>
          {!search && filter === "all" && <button onClick={() => setShowNew(true)} style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A", background: "none", border: "none", cursor: "pointer" }}>Start a new chat →</button>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {filteredRooms.map(room => (
            <div key={room.id}
              onMouseEnter={() => setHoveredRoom(room.id)}
              onMouseLeave={() => { setHoveredRoom(null); }}
              style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderRadius: "12px", cursor: "pointer", background: hoveredRoom === room.id ? "#1C2E14" : "transparent", transition: "background 0.15s" }}>
              {/* Avatar */}
              <div onClick={() => router.push(`/members/messages/${room.id}`)}
                style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1A3D14", border: `2px solid ${room.unread_count > 0 ? "#3CCE2A" : "#2C4820"}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}>
                {getRoomAvatar(room)
                  ? <img src={getRoomAvatar(room)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "18px", color: "#3CCE2A" }}>{room.is_group ? "👥" : (getRoomName(room)[0] ?? "?").toUpperCase()}</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => router.push(`/members/messages/${room.id}`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <span style={{ fontFamily: R, fontSize: "13px", color: room.unread_count > 0 ? "#F0EAD6" : "#C8C0A8", letterSpacing: "0.5px" }}>{getRoomName(room)}</span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", flexShrink: 0 }}>{room.last_message ? formatTime(room.last_message.created_at) : ""}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: B, fontSize: "12px", color: room.unread_count > 0 ? "#8AAA78" : "#5A7A50", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px", fontWeight: room.unread_count > 0 ? 600 : 400 }}>
                    {room.last_message?.content ?? "No messages yet"}
                  </span>
                  {room.unread_count > 0 && (
                    <span style={{ fontFamily: R, fontSize: "10px", background: "#3CCE2A", color: "#080F06", borderRadius: "20px", padding: "2px 8px", flexShrink: 0, marginLeft: "8px" }}>{room.unread_count}</span>
                  )}
                </div>
              </div>

              {/* Actions on hover */}
              {hoveredRoom === room.id && (
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(room.id); }}
                  style={{ background: "#2C1010", border: "1.5px solid #F04060", borderRadius: "8px", padding: "5px 10px", cursor: "pointer", fontFamily: R, fontSize: "10px", color: "#F04060", letterSpacing: "1px", flexShrink: 0 }}>
                  LEAVE
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm leave */}
      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1A2614", border: "2px solid #F04060", borderRadius: "16px", padding: "24px", width: "360px", maxWidth: "90vw", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px" }}>LEAVE CONVERSATION?</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>You won't be able to see this conversation anymore.</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "10px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
              <button onClick={() => leaveRoom(confirmDelete)} style={{ flex: 1, fontFamily: R, fontSize: "11px", background: "#F04060", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", letterSpacing: "1px" }}>LEAVE</button>
            </div>
          </div>
        </div>
      )}

      {/* New chat modal */}
      {showNew && (
        <div onClick={() => setShowNew(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", padding: "24px", width: "480px", maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "2px" }}>NEW CHAT</span>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", color: "#5A7A50", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>
            {selected.length > 1 && (
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name (optional)"
                style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            )}
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search members..."
              style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "300px", overflowY: "auto" }}>
              {filteredMembers.map(m => (
                <div key={m.id} onClick={() => setSelected(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", background: selected.includes(m.id) ? "#1A3D14" : "transparent", border: `1.5px solid ${selected.includes(m.id) ? "#3CCE2A" : "transparent"}` }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `2px solid ${selected.includes(m.id) ? "#3CCE2A" : "#2C4820"}`, background: selected.includes(m.id) ? "#3CCE2A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selected.includes(m.id) && <span style={{ color: "#080F06", fontSize: "12px", fontWeight: "bold" }}>✓</span>}
                  </div>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#243520", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A" }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>}
                  </div>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{m.display_name}</span>
                </div>
              ))}
            </div>
            {selected.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selected.map(id => {
                  const m = members.find(m => m.id === id);
                  return <span key={id} style={{ fontFamily: B, fontSize: "11px", background: "#1A3D14", border: "1px solid #3CCE2A", borderRadius: "20px", padding: "3px 10px", color: "#3CCE2A" }}>{m?.display_name}</span>;
                })}
              </div>
            )}
            <button onClick={createRoom} disabled={!selected.length || creating}
              style={{ fontFamily: R, fontSize: "12px", background: !selected.length || creating ? "#243520" : "#3CCE2A", color: !selected.length || creating ? "#5A7A50" : "#080F06", border: "none", borderRadius: "6px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
              {creating ? "CREATING..." : selected.length > 1 ? "CREATE GROUP CHAT" : "START CHAT"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
