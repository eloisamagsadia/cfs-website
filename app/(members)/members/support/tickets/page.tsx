"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_COLORS: Record<string, string> = {
  open: "#F5C82A",
  in_progress: "#F07228",
  resolved: "#3CCE2A",
  closed: "#5A7A50",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/support?my=true").then(r => r.json()).then(d => {
      setTickets(d.tickets ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "700px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MY TICKETS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>{tickets.length} total</p>
        </div>
        <Link href="/members/support" style={{ textDecoration: "none", fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", borderRadius: "6px", padding: "8px 16px", letterSpacing: "1px" }}>
          + NEW TICKET
        </Link>
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" />
    </div>
      ) : tickets.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎫</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A50", letterSpacing: "2px", marginBottom: "16px" }}>NO TICKETS YET</div>
          <Link href="/members/support" style={{ textDecoration: "none", fontFamily: B, fontSize: "12px", color: "#3CCE2A" }}>Submit your first ticket →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {tickets.map(t => (
            <div key={t.id} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "0.5px", marginBottom: "4px" }}>{t.subject}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{t.category} · {timeAgo(t.created_at)}</div>
                  {t.admin_notes && (
                    <div style={{ marginTop: "8px", background: "#0F2A0B", border: "1px solid #2C4820", borderRadius: "6px", padding: "8px 12px", fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>
                      <span style={{ color: "#3CCE2A", fontFamily: R, fontSize: "10px", letterSpacing: "1px" }}>ADMIN REPLY: </span>
                      {t.admin_notes}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: R, fontSize: "10px", color: STATUS_COLORS[t.status], background: STATUS_COLORS[t.status] + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px", flexShrink: 0 }}>
                  {t.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
