"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_COLORS: Record<string, string> = {
  open: "#F5C82A", in_progress: "#F07228", resolved: "#3CCE2A", closed: "#5A7A60",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/support?my=true").then(r => r.json()).then(d => {
      setTickets(d.tickets ?? []);
      setLoading(false);
    });
  }, []);

  async function handleReply(ticketId: string) {
    const text = replyText[ticketId]?.trim();
    if (!text) return;
    setReplying(ticketId);
    const res = await fetch("/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticketId, member_reply: text, member_replied_at: new Date().toISOString() }),
    });
    const data = await res.json();
    if (res.ok) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, member_reply: text, member_replied_at: new Date().toISOString() } : t));
      setReplyText(prev => ({ ...prev, [ticketId]: "" }));
    }
    setReplying(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "700px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MY TICKETS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{tickets.length} total</p>
        </div>
        <Link href="/members/support" style={{ textDecoration: "none", fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", borderRadius: "6px", padding: "8px 16px", letterSpacing: "1px" }}>
          + NEW TICKET
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
          <SkeletonPage /></div>
      ) : tickets.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎫</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "16px" }}>NO TICKETS YET</div>
          <Link href="/members/support" style={{ textDecoration: "none", fontFamily: B, fontSize: "12px", color: "#3CCE2A" }}>Submit your first ticket →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tickets.map(t => (
            <div key={t.id} style={{ background: "#FFFFFF", border: `2px solid ${expanded === t.id ? "#3CCE2A40" : "#DDE8DD"}`, borderRadius: "12px", overflow: "hidden" }}>
              {/* Header */}
              <div onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "0.5px", marginBottom: "4px" }}>{t.subject}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{t.category} · {timeAgo(t.created_at)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {t.admin_notes && <span style={{ fontFamily: R, fontSize: "9px", color: "#3CCE2A", background: "#E8F0E4", borderRadius: "20px", padding: "2px 8px" }}>REPLIED</span>}
                  <span style={{ fontFamily: R, fontSize: "10px", color: STATUS_COLORS[t.status], background: STATUS_COLORS[t.status] + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px" }}>
                    {t.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span style={{ color: "#5A7A60", fontSize: "12px" }}>{expanded === t.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Thread */}
              {expanded === t.id && (
                <div style={{ borderTop: "1px solid #DDE8DD", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Original message */}
                  <div style={{ background: "#F2F7F2", borderRadius: "8px", padding: "12px 14px" }}>
                    <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px" }}>YOUR MESSAGE</div>
                    <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.6 }}>{t.message}</div>
                  </div>

                  {/* Attachments */}
                  {t.attachments?.length > 0 && (
                    <div>
                      <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "8px" }}>ATTACHMENTS</div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {t.attachments.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1.5px solid #DDE8DD", cursor: "pointer" }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Admin reply */}
                  {t.admin_notes && (
                    <div style={{ background: "#0F2A0B", border: "1px solid #3CCE2A30", borderRadius: "8px", padding: "12px 14px" }}>
                      <div style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "1px", marginBottom: "6px" }}>ADMIN REPLY</div>
                      <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.6 }}>{t.admin_notes}</div>
                    </div>
                  )}

                  {/* Member reply */}
                  {t.member_reply && (
                    <div style={{ background: "#F2F7F2", borderRadius: "8px", padding: "12px 14px" }}>
                      <div style={{ fontFamily: R, fontSize: "10px", color: "#F07228", letterSpacing: "1px", marginBottom: "6px" }}>YOUR REPLY · {timeAgo(t.member_replied_at)}</div>
                      <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.6 }}>{t.member_reply}</div>
                    </div>
                  )}

                  {/* Reply input — only if admin has replied and ticket not closed */}
                  {t.admin_notes && t.status !== "closed" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <textarea
                        value={replyText[t.id] ?? ""}
                        onChange={e => setReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Write a reply to the admin..."
                        rows={3}
                        style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box" }}
                      />
                      <button onClick={() => handleReply(t.id)} disabled={replying === t.id || !replyText[t.id]?.trim()}
                        style={{ alignSelf: "flex-end", fontFamily: R, fontSize: "11px", background: replying === t.id || !replyText[t.id]?.trim() ? "#F2F7F2" : "#3CCE2A", color: replying === t.id || !replyText[t.id]?.trim() ? "#5A7A60" : "#080F06", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px" }}>
                        {replying === t.id ? "SENDING..." : "SEND REPLY"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
