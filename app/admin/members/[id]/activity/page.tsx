"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconTicket, IconCart, IconHeart, IconMessage, IconFlag, IconStar, IconBell, IconClipboard, IconUser } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Kind = "ticket" | "order" | "donation" | "post" | "comment" | "report" | "badge" | "notification" | "audit";

interface Event { kind: Kind; at: string; title: string; detail?: string; href?: string; }
interface Data {
  profile: { id: string; display_name?: string; email?: string; avatar_url?: string; role?: string; is_banned?: boolean; created_at?: string } | null;
  counts: Record<string, number>;
  events: Event[];
}

const KIND_META: Record<Kind, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  ticket:       { color: "#156530", bg: "#E8F0E4", icon: <IconTicket size={13} color="#156530" />,    label: "TICKET" },
  order:        { color: "#7A5A0F", bg: "#FFF3D6", icon: <IconCart size={13} color="#7A5A0F" />,      label: "ORDER" },
  donation:     { color: "#B78A1F", bg: "#FFF3D6", icon: <IconHeart size={13} color="#B78A1F" />,     label: "DONATION" },
  post:         { color: "#1A8040", bg: "#E8F0E4", icon: <IconMessage size={13} color="#1A8040" />,   label: "POST" },
  comment:      { color: "#4A7C59", bg: "#F2F7F2", icon: <IconMessage size={13} color="#4A7C59" />,   label: "COMMENT" },
  report:       { color: "#8A1E27", bg: "#FFE8EC", icon: <IconFlag size={13} color="#8A1E27" />,      label: "REPORT" },
  badge:        { color: "#B78A1F", bg: "#FFF3D6", icon: <IconStar size={13} color="#B78A1F" />,      label: "BADGE" },
  notification: { color: "#1E4A7A", bg: "#E4EEF8", icon: <IconBell size={13} color="#1E4A7A" />,      label: "NOTIF" },
  audit:        { color: "#5A1E7A", bg: "#F0E4F8", icon: <IconClipboard size={13} color="#5A1E7A" />, label: "AUDIT" },
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

export default function MemberActivityPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const [data, setData]       = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState<Kind | "all">("all");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/members/activity?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.events;
    return data.events.filter(e => e.kind === filter);
  }, [data, filter]);

  if (loading) return <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>;
  if (error)   return <div style={{ padding: "48px", textAlign: "center", fontFamily: B, color: "#CC3344" }}>{error}</div>;
  if (!data)   return null;

  const p = data.profile;
  const tabs: (Kind | "all")[] = ["all", "ticket", "order", "donation", "post", "comment", "report", "badge", "audit"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Profile header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {p?.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <IconUser size={22} color="#1A8040" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href="/admin/members" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← ALL MEMBERS</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "2px", marginTop: "2px" }}>{p?.display_name ?? p?.id ?? "Unknown"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{p?.email ?? "no email"}</span>
            {p?.role && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", borderRadius: "6px", padding: "2px 8px", letterSpacing: "1.2px" }}>{p.role.toUpperCase()}</span>}
            {p?.is_banned && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: "6px", padding: "2px 8px", letterSpacing: "1.2px" }}>BANNED</span>}
            {p?.created_at && <span style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>Joined {new Date(p.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" })}</span>}
          </div>
        </div>
      </div>

      {/* Count tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px" }}>
        {(["ticket", "order", "donation", "post", "comment", "report", "badge", "audit"] as Kind[]).map(k => {
          const meta = KIND_META[k];
          const n = data.counts[k === "audit" ? "audit" : `${k}s`] ?? 0;
          return (
            <button key={k} onClick={() => setFilter(k === filter ? "all" : k)}
              style={{ background: filter === k ? meta.bg : "#ffffff", border: `1px solid ${filter === k ? meta.color : "#DDE8DD"}`, borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer", textAlign: "left" as const }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: meta.color, letterSpacing: "1.3px" }}>
                {meta.icon} {meta.label}
              </span>
              <span style={{ fontFamily: R, fontSize: "1.2rem", color: "#1B3A2D", letterSpacing: "0.5px" }}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: filter === t ? "#ffffff" : "#1B3A2D", background: filter === t ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === t ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        {filteredEvents.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
            {data.events.length === 0 ? "No activity for this member." : `No ${filter} events.`}
          </div>
        ) : (
          filteredEvents.map((e, i) => {
            const meta = KIND_META[e.kind];
            const body = (
              <div style={{ display: "grid", gridTemplateColumns: "32px 90px 1fr auto", gap: "10px", alignItems: "center", padding: "10px 18px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: meta.bg, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{meta.icon}</div>
                <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: meta.color, letterSpacing: "1.2px" }}>{meta.label}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 500 }}>{e.title}</div>
                  {e.detail && <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{e.detail}</div>}
                </div>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", whiteSpace: "nowrap" }} title={new Date(e.at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}>{timeAgo(e.at)}</span>
              </div>
            );
            return e.href
              ? <Link key={i} href={e.href} style={{ textDecoration: "none" }}>{body}</Link>
              : <div key={i}>{body}</div>;
          })
        )}
      </div>
    </div>
  );
}
