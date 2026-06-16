"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { IconX, IconCamera, IconUsers, IconSparkle } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const REACTIONS = ["❤️","🔥","😂","😮","👏","✨"];

let _supabase: any = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return _supabase;
}

export default function ChatRoomPage({ params }: { params: { roomId: string } }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<string[]>([]);
  const [seenBy, setSeenBy] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<any>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [msgReactions, setMsgReactions] = useState<Record<string, any[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [showNicknamesSection, setShowNicknamesSection] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const typingTimeout = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (mountedRef.current) return;
    mountedRef.current = true;
    loadRoom();

    const presenceChannel = getSupabase().channel(`typing:${params.roomId}`);
    presenceChannelRef.current = null;
    presenceChannel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload.user_id === user.id) return;
        const name = payload.payload.name ?? "Someone";
        const isTyping = payload.payload.typing;
        setTyping(prev => {
          if (isTyping && !prev.includes(name)) return [...prev, name];
          if (!isTyping) return prev.filter(n => n !== name);
          return prev;
        });
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") presenceChannelRef.current = presenceChannel;
      });

    const channel = getSupabase()
      .channel(`room:${params.roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${params.roomId}` }, (payload: any) => {
        const msg = payload.new as any;
        setMembers(currentMembers => {
          const profile = currentMembers.find((m: any) => m.user_id === msg.sender_id)?.profiles ?? null;
          setMessages(prev => {
            return [...prev, { ...msg, profiles: profile }];
          });
          return currentMembers;
        });
      })
      .subscribe();

    const seenChannel = getSupabase()
      .channel(`seen:${params.roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_members", filter: `room_id=eq.${params.roomId}` }, (payload: any) => {
        if (payload.new.user_id !== user.id) setSeenBy(prev => ({ ...prev, [payload.new.user_id]: payload.new.last_read_at }));
      })
      .subscribe();

    fetch(`/api/chat/${params.roomId}/seen`).then(r => r.json()).then(d => {
      const seen: Record<string, string> = {};
      (d.members ?? []).forEach((m: any) => { if (m.user_id !== user.id) seen[m.user_id] = m.last_read_at; });
      setSeenBy(seen);
    });

    return () => {
      getSupabase().removeChannel(channel);
      getSupabase().removeChannel(presenceChannel);
      getSupabase().removeChannel(seenChannel);
    };
  }, [isLoaded, user, params.roomId]);

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialLoad.current = false;
      return;
    }
    if (!searchQuery) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch(`/api/chat/${params.roomId}/nickname`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {};
        (d.nicknames ?? []).forEach((n: any) => { map[n.target_user_id] = n.nickname; });
        setNicknames(map);
      });
  }, [params.roomId]);


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadRoom() {
    const res = await fetch(`/api/chat/${params.roomId}`);
    if (!res.ok) { router.push("/members/messages"); return; }
    const d = await res.json();
    setRoom(d.room);
    setMessages(d.messages ?? []);
    setMembers(d.members ?? []);
    loadReactions(d.messages ?? []);
    // Load pinned message
    if (d.room?.pinned_message_id) {
      const pinned = (d.messages ?? []).find((m: any) => m.id === d.room.pinned_message_id);
      if (pinned) setPinnedMsg(pinned);
    }
    setLoading(false);
  }

  async function loadReactions(msgs: any[]) {
    if (!msgs.length) return;
    const ids = msgs.map((m: any) => m.id);
    const res = await fetch(`/api/chat/${params.roomId}/reactions?ids=${ids.join(",")}`);
    const d = await res.json();
    setMsgReactions(d.reactions ?? {});
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "messages");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const d = await res.json();
    setUploadingImg(false);
    return d.url ?? null;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      await fetch(`/api/chat/${params.roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", image_url: url, reply_to_id: replyTo?.id ?? null }),
      });
      setReplyTo(null);
    }
    if (imgInputRef.current) imgInputRef.current.value = "";
  }

  async function pinMessage(msgId: string) {
    setShowReactions(null);
    setHoveredMsg(null);
    const res = await fetch(`/api/chat/${params.roomId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: msgId }),
    });
    const d = await res.json();
    if (d.pinned) {
      const msg = messages.find(m => m.id === msgId);
      setPinnedMsg(msg ?? null);
    } else {
      setPinnedMsg(null);
    }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_pinned: d.pinned } : { ...m, is_pinned: m.is_pinned && msgId !== m.id ? m.is_pinned : false }));
  }

  function insertEmoji(emoji: any) {
    const sym = emoji.native ?? "";
    const el = inputRef.current;
    if (!el) { setInput(prev => prev + sym); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const newVal = input.slice(0, start) + sym + input.slice(end);
    setInput(newVal);
    setTimeout(() => { el.setSelectionRange(start + sym.length, start + sym.length); el.focus(); }, 0);
    setShowEmojiPicker(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) { setMentionSearch(mentionMatch[1].toLowerCase()); setMentionIndex(0); }
    else setMentionSearch(null);
    if (presenceChannelRef.current) {
      const name = user?.firstName ?? user?.username ?? "Someone";
      presenceChannelRef.current.send({ type: "broadcast", event: "typing", payload: { typing: true, name, user_id: user?.id } });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        presenceChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { typing: false, name, user_id: user?.id } });
      }, 3000);
    }
  }

  function insertMention(member: any) {
    const el = inputRef.current;
    const cursor = el?.selectionStart ?? input.length;
    const textBefore = input.slice(0, cursor);
    const replaced = textBefore.replace(/@(\w*)$/, `@${member.profiles?.display_name ?? member.user_id} `);
    setInput(replaced + input.slice(cursor));
    setMentionSearch(null);
    setTimeout(() => { el?.focus(); el?.setSelectionRange(replaced.length, replaced.length); }, 0);
  }

  async function sendMessage() {
    if ((!input.trim() && !uploadingImg) || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    setReplyTo(null);
    await fetch(`/api/chat/${params.roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, reply_to_id: replyTo?.id ?? null }),
    });
    setSending(false);
  }

  async function toggleReaction(msgId: string, emoji: string) {
    setShowReactions(null);
    const res = await fetch(`/api/chat/${params.roomId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: msgId, emoji }),
    });
    const d = await res.json();
    setMsgReactions(prev => ({ ...prev, [msgId]: d.reactions ?? [] }));
  }

  function getDisplayName(m: any) {
    const uid = m.user_id || m.id;
    return nicknames[uid] || m.profiles?.display_name || "Member";
  }

  function getRoomName() {
    if (room?.is_group) return room.name || "Group Chat";
    const other = members.find(m => m.user_id !== user?.id);
    if (other) return nicknames[other.user_id] || other.profiles?.display_name || "Member";
    return room?.name || "Chat";
  }


  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
  }

  const displayMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  let lastDate = "";

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage /></div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 8px 12px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #DDE8DD" }}>
        <button onClick={() => router.push("/members/messages")} style={{ background: "none", border: "none", color: "#5A7A60", cursor: "pointer", fontFamily: B, fontSize: "12px", padding: "4px 0" }}>← Back</button>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#E8F0E4", border: "1.5px solid #1A804030", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {room?.is_group
            ? <IconUsers size={16} color="#1A8040" />
            : members.find(m => m.user_id !== user?.id)?.profiles?.avatar_url
              ? <img src={members.find(m => m.user_id !== user?.id)?.profiles?.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: R, fontSize: "14px", color: "#1A8040" }}>{(getRoomName()[0] ?? "?").toUpperCase()}</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{getRoomName()}</div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{members.length} member{members.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => setShowDrawer(s => !s)}
          style={{ background: showDrawer ? "#E8F0E4" : "none", border: `1.5px solid ${showDrawer ? "#1A8040" : "#DDE8DD"}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: showDrawer ? "#1A8040" : "#5A7A60" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "8px 8px", borderBottom: "1px solid #DDE8DD" }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "20px", padding: "8px 16px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          {searchQuery && <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "6px" }}>{displayMessages.length} result{displayMessages.length !== 1 ? "s" : ""}</div>}
        </div>
      )}

      {/* Pinned message */}
      {pinnedMsg && !searchQuery && (
        <div style={{ padding: "8px 12px", background: "#FFFFFF", borderBottom: "1px solid #DDE8DD", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#156530" stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: R, fontSize: "9px", color: "#156530", letterSpacing: "1px", marginBottom: "2px" }}>PINNED MESSAGE</div>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinnedMsg.content || "📷 Photo"}</div>
          </div>
          <button onClick={() => pinMessage(pinnedMsg.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><IconX size={14} color="#5A7A60" /></button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: "16px 8px 80px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {displayMessages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const msgDate = formatDate(msg.created_at);
          const showDate = !searchQuery && msgDate !== lastDate;
          if (!searchQuery) lastDate = msgDate;
          const prevMsg = displayMessages[idx - 1];
          const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
          const reactions = msgReactions[msg.id] ?? [];
          const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;

          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign: "center", margin: "16px 0 10px" }}>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", background: "#162010", padding: "3px 12px", borderRadius: "20px" }}>{msgDate}</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: isMe ? "0" : "8px", marginBottom: "2px", position: "relative" }}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => { setHoveredMsg(null); setShowReactions(null); }}>
                {!isMe && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#F2F7F2", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", opacity: showAvatar ? 1 : 0 }}>
                    {msg.profiles?.avatar_url
                      ? <img src={msg.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "10px", color: "#1A8040" }}>{(msg.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                  </div>
                )}
                <div style={{ maxWidth: isMe ? "92%" : "75%", display: "flex", flexDirection: "column", gap: "2px", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showAvatar && !isMe && <span style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "0.5px", marginLeft: "4px" }}>{getDisplayName(members.find(m => m.user_id === msg.sender_id) ?? {profiles: msg.profiles})}</span>}
                  {replyMsg && (
                    <div style={{ background: "#162010", borderLeft: "3px solid #1A8040", borderRadius: "6px", padding: "4px 10px", marginBottom: "2px", maxWidth: "100%" }}>
                      <div style={{ fontFamily: R, fontSize: "9px", color: "#1A8040", marginBottom: "2px" }}>{replyMsg.profiles?.display_name ?? "Member"}</div>
                      <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }}>{replyMsg.content || "📷 Photo"}</div>
                    </div>
                  )}
                  <div style={{ background: isMe ? "#E8F0E4" : "#F2F7F2", border: `1px solid ${msg.is_pinned ? "#1A804040" : isMe ? "#1A804020" : "#DDE8DD"}`, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: msg.image_url && !msg.content ? "4px" : "9px 14px", overflow: "hidden" }}>
                    {msg.image_url && <img src={msg.image_url} alt="" style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "10px", display: "block" }} />}
                    {msg.content && <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.6, wordBreak: "break-word", marginTop: msg.image_url ? "6px" : "0" }}>{msg.content}</div>}
                    {msg.is_pinned && <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="#156530"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg><span style={{ fontFamily: R, fontSize: "9px", color: "#156530" }}>pinned</span></div>}
                  </div>
                  {reactions.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                      {Object.entries(reactions.reduce((acc: any, r: any) => { acc[r.emoji] = (acc[r.emoji] ?? 0) + 1; return acc; }, {})).map(([emoji, count]) => (
                        <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                          style={{ fontFamily: B, fontSize: "11px", background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "20px", padding: "2px 8px", cursor: "pointer", color: "#1B3A2D", display: "flex", alignItems: "center", gap: "4px" }}>
                          {emoji} <span style={{ color: "#5A7A60" }}>{count as number}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <span style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30", marginLeft: "4px", marginRight: "4px" }}>{formatTime(msg.created_at)}</span>
                </div>
                {hoveredMsg === msg.id && (
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, position: "relative" }}>
                    <button onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                      style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "20px", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><IconSparkle size={14} color="#5A7A60" /></button>
                    <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                      style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "20px", padding: "4px 8px", cursor: "pointer", fontFamily: R, fontSize: "10px", color: "#5A7A60" }}>↩</button>
                    <button onClick={() => pinMessage(msg.id)} title={msg.is_pinned ? "Unpin" : "Pin"}
                      style={{ background: msg.is_pinned ? "#E8F4EC" : "#F2F7F2", border: `1px solid ${msg.is_pinned ? "#156530" : "#DDE8DD"}`, borderRadius: "20px", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.is_pinned ? "#156530" : "#5A7A60"} stroke="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                    </button>
                    {showReactions === msg.id && (
                      <div style={{ position: "absolute", bottom: "32px", left: isMe ? "auto" : "0", right: isMe ? "0" : "auto", background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "8px 10px", display: "flex", gap: "6px", zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                        {REACTIONS.map(emoji => (
                          <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "2px", borderRadius: "6px" }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.3)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {displayMessages.length === 0 && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: B, fontSize: "13px", color: "#3A5A30", paddingTop: "60px" }}>
            {searchQuery ? "No messages match your search." : "No messages yet. Say hello! 👋"}
          </div>
        )}
        {!searchQuery && messages.length > 0 && Object.keys(seenBy).length > 0 && (() => {
          const lastMsg = messages[messages.length - 1];
          const seenMembers = members.filter(m => m.user_id !== user?.id && seenBy[m.user_id] && new Date(seenBy[m.user_id]) >= new Date(lastMsg.created_at)).map(m => m.profiles?.display_name ?? "Member");
          return seenMembers.length > 0 ? (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
              <span style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>Seen by {seenMembers.join(", ")}</span>
            </div>
          ) : null;
        })()}
        <div ref={bottomRef} />
      </div>

      {typing.length > 0 && (
        <div style={{ padding: "4px 4px", borderTop: "1px solid #DDE8DD" }}>
          <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", fontStyle: "italic" }}>{typing.join(", ")} {typing.length === 1 ? "is" : "are"} typing...</span>
        </div>
      )}

      {replyTo && (
        <div style={{ padding: "8px 12px", background: "#162010", borderTop: "1px solid #DDE8DD", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: R, fontSize: "10px", color: "#1A8040", letterSpacing: "0.5px", marginBottom: "2px" }}>Replying to {replyTo.profiles?.display_name ?? "Member"}</div>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>{replyTo.content || "📷 Photo"}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><IconX size={18} color="#5A7A60" /></button>
        </div>
      )}

      {/* Mention dropdown */}
      {mentionSearch !== null && (() => {
        const filtered = members.filter(m => m.user_id !== user?.id && (m.profiles?.display_name ?? "").toLowerCase().includes(mentionSearch)).slice(0, 5);
        return filtered.length > 0 ? (
          <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden", margin: "0 4px 4px" }}>
            {filtered.map((m, i) => (
              <div key={m.user_id} onClick={() => insertMention(m)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", cursor: "pointer", background: i === mentionIndex ? "#F2F7F2" : "transparent" }}
                onMouseEnter={() => setMentionIndex(i)}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: R, fontSize: "11px", color: "#1A8040" }}>{(m.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                </div>
                <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{m.profiles?.display_name ?? "Member"}</span>
              </div>
            ))}
          </div>
        ) : null;
      })()}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div style={{ position: "relative", margin: "0 4px 4px" }}>
          <div ref={emojiPickerRef} style={{ position: "absolute", bottom: "0", left: "0", zIndex: 200 }}>
            <Picker data={data} onEmojiSelect={insertEmoji} theme="dark" set="native" previewPosition="none" skinTonePosition="none" />
          </div>
        </div>
      )}

      {/* Input */}
      <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
      <div className="chat-input-bar" style={{ padding: "12px 4px 4px", borderTop: "1px solid #DDE8DD", display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <button onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}
          style={{ background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", opacity: uploadingImg ? 0.5 : 1 }}>
          <IconCamera size={18} color="#5A7A60" />
        </button>
        <textarea ref={inputRef} value={input}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (mentionSearch !== null) {
              const filtered = members.filter(m => m.user_id !== user?.id && (m.profiles?.display_name ?? "").toLowerCase().includes(mentionSearch)).slice(0, 5);
              if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
              if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); insertMention(filtered[mentionIndex]); return; }
              if (e.key === "Escape") { setMentionSearch(null); return; }
            }
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          }}
          placeholder="Type a message..."
          rows={1}
          style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "20px", padding: "10px 16px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "none", lineHeight: 1.5, maxHeight: "100px", overflowY: "auto", boxSizing: "border-box" }} />
        <button onClick={() => setShowEmojiPicker(p => !p)}
          style={{ background: showEmojiPicker ? "#E8F0E4" : "#F2F7F2", border: `1.5px solid ${showEmojiPicker ? "#1A8040" : "#DDE8DD"}`, borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconSparkle size={18} color={showEmojiPicker ? "#1A8040" : "#5A7A60"} />
        </button>
        <button onClick={sendMessage} disabled={!input.trim() || sending}
          style={{ background: !input.trim() || sending ? "#F2F7F2" : "#1A8040", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={!input.trim() || sending ? "#AACBAA" : "#FFFFFF"}><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/></svg>
        </button>
      </div>
      {/* Side Drawer */}
      {showDrawer && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500 }} onClick={() => setShowDrawer(false)}>
          <div onClick={e => e.stopPropagation()}
            className="chat-drawer" style={{ position: "absolute", top: 0, right: 0, width: "300px", height: "100%", background: "#F7FAF5", borderLeft: "2px solid #DDE8DD", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Drawer header */}
            <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #DDE8DD", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "2px" }}>CHAT INFO</span>
              <button onClick={() => setShowDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><IconX size={18} color="#5A7A60" /></button>
            </div>

            {/* Room name */}
            <div style={{ padding: "16px", borderBottom: "1px solid #DDE8DD" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#E8F0E4", border: "2px solid #1A804030", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {room?.is_group
                    ? <IconUsers size={20} color="#1A8040" />
                    : members.find(m => m.user_id !== user?.id)?.profiles?.avatar_url
                      ? <img src={members.find(m => m.user_id !== user?.id)?.profiles?.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "18px", color: "#1A8040" }}>{(getRoomName()[0] ?? "?").toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{getRoomName()}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{members.length} member{members.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #DDE8DD" }}>
              <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "8px" }}>SEARCH MESSAGES</div>
              <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setShowSearch(!!e.target.value); }}
                placeholder="Search in conversation..."
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "20px", padding: "8px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
              {searchQuery && <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "6px" }}>{displayMessages.length} result{displayMessages.length !== 1 ? "s" : ""}</div>}
            </div>

            {/* Pinned message */}
            {pinnedMsg && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #DDE8DD" }}>
                <div style={{ fontFamily: R, fontSize: "10px", color: "#156530", letterSpacing: "1.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#156530"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                  PINNED MESSAGE
                </div>
                <div style={{ background: "#F2F7F2", borderRadius: "8px", padding: "10px 12px", borderLeft: "3px solid #156530" }}>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginBottom: "3px" }}>{pinnedMsg.profiles?.display_name ?? "Member"}</div>
                  <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", lineHeight: 1.5 }}>{pinnedMsg.content || "📷 Photo"}</div>
                </div>
              </div>
            )}

            {/* Members */}
            <div style={{ padding: "12px 16px", flex: 1 }}>
              <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "10px" }}>MEMBERS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {members.map(m => (
                  <div key={m.user_id}
                    onClick={() => { setShowDrawer(false); window.location.href = `/members/community/members/${m.user_id}`; }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "10px", cursor: "pointer", background: "transparent", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F2F7F2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>{(m.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{getDisplayName(m)}</div>
                      {m.user_id === user?.id && <div style={{ fontFamily: R, fontSize: "9px", color: "#1A8040", letterSpacing: "1px" }}>YOU</div>}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A5A30" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Nicknames */}
            <div style={{ borderTop: "1px solid #DDE8DD" }}>
              <button onClick={() => setShowNicknamesSection(p => !p)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A7A60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span style={{ fontFamily: "var(--font-righteous,'Righteous',sans-serif)", fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px" }}>NICKNAMES</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5A7A60" strokeWidth="2" strokeLinecap="round"><polyline points={showNicknamesSection ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>
              </button>

              {showNicknamesSection && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {members.map(m => (
                    <div key={m.user_id}>
                      <div style={{ fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "11px", color: "#5A7A60", marginBottom: "4px" }}>
                        {m.user_id === user?.id ? "You" : m.profiles?.display_name ?? "Member"}
                      </div>
                      {editingNickname === m.user_id ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)}
                            placeholder={m.profiles?.display_name ?? "Nickname..."}
                            style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "6px 10px", color: "#1B3A2D", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "12px", outline: "none" }} />
                          <button onClick={async () => {
                            await fetch(`/api/chat/${params.roomId}/nickname`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_user_id: m.user_id, nickname: nicknameInput }) });
                            setNicknames(prev => ({ ...prev, [m.user_id]: nicknameInput.trim() }));
                            setEditingNickname(null);
                          }} style={{ fontFamily: "var(--font-righteous,'Righteous',sans-serif)", fontSize: "10px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>SAVE</button>
                          <button onClick={() => setEditingNickname(null)} style={{ fontFamily: "var(--font-righteous,'Righteous',sans-serif)", fontSize: "10px", background: "transparent", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={10} color="#5A7A60" /></button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "12px", color: nicknames[m.user_id] ? "#1B3A2D" : "#3A5A30", flex: 1 }}>{nicknames[m.user_id] || "No nickname"}</span>
                          <button onClick={() => { setEditingNickname(m.user_id); setNicknameInput(nicknames[m.user_id] ?? ""); }}
                            style={{ background: "none", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "#5A7A60", display: "flex", alignItems: "center" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {nicknames[m.user_id] && (
                            <button onClick={async () => {
                              await fetch(`/api/chat/${params.roomId}/nickname`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_user_id: m.user_id, nickname: "" }) });
                              setNicknames(prev => { const n = { ...prev }; delete n[m.user_id]; return n; });
                            }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={12} color="#CC3344" /></button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave */}
            <div style={{ padding: "16px", borderTop: "1px solid #DDE8DD" }}>
              <button onClick={() => { setShowDrawer(false); router.push("/members/messages"); }}
                style={{ width: "100%", fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #CC3344", borderRadius: "8px", color: "#CC3344", padding: "10px", cursor: "pointer", letterSpacing: "1px" }}>
                LEAVE CONVERSATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
