"use client";
import { useEffect, useMemo, useState } from "react";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// ── PLAIN-ENGLISH ACTIONS ──────────────────────────────────────────────────
// Each action gets a friendly verb phrase + a small tag category so
// filters and colours read as normal words, not code.
type Category = "auth" | "buy" | "content" | "service" | "member" | "admin" | "system";

const CATEGORY_META: Record<Category, { label: string; fg: string; bg: string }> = {
  auth:    { label: "Sign-in",       fg: "#1E4A7A", bg: "#E4EEF8" },
  buy:     { label: "Purchase",      fg: "#7A5A0F", bg: "#FFF3D6" },
  content: { label: "Community",     fg: "#156530", bg: "#E8F0E4" },
  service: { label: "Support",       fg: "#5A1E7A", bg: "#F0E4F8" },
  member:  { label: "Page visit",    fg: "#3A5A30", bg: "#EAF1E8" },
  admin:   { label: "Admin action",  fg: "#8A1E27", bg: "#FFE8EC" },
  system:  { label: "System",        fg: "#4A5A60", bg: "#EAEEF0" },
};

const ACTION_MAP: Record<string, { verb: string; category: Category; targetLabel?: string }> = {
  // Page visits
  visit_page:               { verb: "opened",                          category: "member",  targetLabel: "page" },

  // Auth
  login:                    { verb: "signed in",                       category: "auth" },
  logout:                   { verb: "signed out",                      category: "auth" },
  session_revoked:          { verb: "was signed out (session revoked)", category: "auth" },
  signup:                   { verb: "created their account",           category: "auth" },
  delete_account:           { verb: "deleted their account",           category: "auth" },

  // Purchases + registrations
  purchase_ticket:          { verb: "bought a ticket for",             category: "buy",     targetLabel: "event" },
  register_event:           { verb: "registered for",                  category: "buy",     targetLabel: "event" },
  place_order:              { verb: "placed a shop order",             category: "buy",     targetLabel: "order" },
  make_donation:            { verb: "made a donation",                 category: "buy",     targetLabel: "donation" },

  // Community
  create_post:              { verb: "posted in the community",         category: "content", targetLabel: "post" },
  create_comment:           { verb: "commented on a post",             category: "content", targetLabel: "post" },
  delete_comment:           { verb: "deleted a comment",               category: "content", targetLabel: "comment" },
  report_content:           { verb: "reported something",              category: "content" },
  follow_user:              { verb: "followed a member",               category: "content", targetLabel: "member" },
  unfollow_user:            { verb: "unfollowed a member",             category: "content", targetLabel: "member" },

  // Service
  open_support_ticket:      { verb: "opened a support ticket",         category: "service", targetLabel: "ticket" },
  submit_fan_letter:        { verb: "submitted a fan letter",          category: "service", targetLabel: "letter" },
  delete_fan_letter:        { verb: "deleted their fan letter",        category: "service", targetLabel: "letter" },
  subscribe_newsletter:     { verb: "subscribed to the newsletter",    category: "service" },
  resubscribe_newsletter:   { verb: "re-subscribed to the newsletter", category: "service" },

  // Admin
  create_event:             { verb: "created an event",                category: "admin", targetLabel: "event" },
  edit_event:               { verb: "edited an event",                 category: "admin", targetLabel: "event" },
  delete_event:             { verb: "deleted an event",                category: "admin", targetLabel: "event" },
  change_role:              { verb: "changed a member's role",         category: "admin", targetLabel: "member" },
  ban_user:                 { verb: "banned a member",                 category: "admin", targetLabel: "member" },
  unban_user:               { verb: "unbanned a member",               category: "admin", targetLabel: "member" },
  delete_member:            { verb: "deleted a member",                category: "admin", targetLabel: "member" },
  hide_post:                { verb: "hid a post",                      category: "admin", targetLabel: "post" },
  unhide_post:              { verb: "unhid a post",                    category: "admin", targetLabel: "post" },
  delete_post:              { verb: "deleted a post",                  category: "admin", targetLabel: "post" },
  pin_post:                 { verb: "pinned a post",                   category: "admin", targetLabel: "post" },
  unpin_post:               { verb: "unpinned a post",                 category: "admin", targetLabel: "post" },
  resolve_report_resolved:  { verb: "resolved a report",               category: "admin", targetLabel: "report" },
  resolve_report_reviewed:  { verb: "reviewed a report",               category: "admin", targetLabel: "report" },
  send_broadcast:           { verb: "sent a broadcast",                category: "admin" },
  broadcast_notification:   { verb: "sent a notification broadcast",   category: "admin" },
  impersonate_start:        { verb: "signed in as another member",     category: "admin", targetLabel: "member" },
  cleanup_pending_tickets:  { verb: "cleaned up pending tickets",      category: "system" },
};

function friendly(action: string): { verb: string; category: Category; targetLabel?: string } {
  const known = ACTION_MAP[action];
  if (known) return known;
  // Fallback: derive from prefix
  if (action.startsWith("create_")) return { verb: `added a ${action.replace("create_", "").replace(/_/g, " ")}`,   category: "admin" };
  if (action.startsWith("edit_"))   return { verb: `updated a ${action.replace("edit_", "").replace(/_/g, " ")}`,   category: "admin" };
  if (action.startsWith("update_")) return { verb: `updated a ${action.replace("update_", "").replace(/_/g, " ")}`, category: "admin" };
  if (action.startsWith("delete_")) return { verb: `deleted a ${action.replace("delete_", "").replace(/_/g, " ")}`, category: "admin" };
  return { verb: action.replace(/_/g, " "), category: "admin" };
}

// ── HELPERS ────────────────────────────────────────────────────────────────

const TARGET_TYPE_LABEL: Record<string, string> = {
  user:              "member",
  profile:           "member",
  session:           "sign-in",
  event:             "event",
  event_tickets:     "tickets",
  order:             "shop order",
  donation:          "donation",
  community_post:    "post",
  community_comment: "comment",
  fan_letter:        "letter",
  support_ticket:    "support ticket",
  newsletter:        "newsletter",
  ticket:            "ticket",
  report:            "report",
};

function friendlyTargetType(t: string | null): string {
  if (!t) return "";
  return TARGET_TYPE_LABEL[t] ?? t.replace(/_/g, " ");
}

function shortId(id: string | null): string {
  if (!id) return "";
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}

function fullTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
}

// Render a details object as human-readable pairs. Keys are turned into
// sentence-style labels, and PII-masked strings (e.g. "j***@example.com")
// pass through unchanged.
const DETAIL_KEY_LABEL: Record<string, string> = {
  event_title:     "Event",
  tier_name:       "Tier",
  tier_price:      "Tier price",
  bundle_size:     "Bundle size",
  ticket_count:    "Tickets created",
  amount:          "Amount",
  total:           "Total",
  subtotal:        "Subtotal",
  shipping_fee:    "Shipping",
  item_count:      "Items",
  category:        "Category",
  category_id:     "Category",
  reason:          "Reason",
  subject:         "Subject",
  has_images:      "Includes images",
  has_video:       "Includes video",
  has_attachments: "Has attachments",
  content_length: "Length (characters)",
  is_anonymous:    "Anonymous",
  is_manual:       "Manual payment",
  drive_count:     "Donation drives",
  legacy:          "Legacy flow",
  post_id:         "Post",
  comment_id:      "Comment",
  report_id:       "Report",
  parent_comment_id: "Reply to",
  source:          "Source",
  email:           "Email",
  target_label:    "Target",
  clerk_event:     "Session event",
  bundle_id:       "Bundle",
  payment_status:  "Payment status",
  display_name:    "Display name",
  fields:          "Fields updated",
  cancelled_count: "Cancelled",
  hours_cutoff:    "Age cutoff (hours)",
  via:             "Via",
  expires_in_seconds: "Expires in (seconds)",
  path:            "Page",
  title:           "Page title",
  referer:         "Came from",
};

function humanKey(k: string): string {
  return DETAIL_KEY_LABEL[k] ?? k.replace(/_/g, " ").replace(/^./, s => s.toUpperCase());
}

function humanValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") {
    // Show peso for likely-currency keys handled by caller; here just format big numbers
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(2);
  }
  if (Array.isArray(v)) return v.length ? v.map(String).join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// ── TYPES ──────────────────────────────────────────────────────────────────

type Log = {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  profiles?: { display_name?: string; avatar_url?: string } | null;
};

type TimeWindow = "all" | "24h" | "7d" | "30d";
type CategoryFilter = "all" | Category;

// ── PAGE ───────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [logs, setLogs]             = useState<Log[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [categoryFilter, setCat]    = useState<CategoryFilter>("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/super/audit-log")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setLogs(d.logs ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const windowCutoff = useMemo(() => {
    if (timeWindow === "all") return 0;
    const h = timeWindow === "24h" ? 24 : timeWindow === "7d" ? 24 * 7 : 24 * 30;
    return Date.now() - h * 60 * 60 * 1000;
  }, [timeWindow]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      if (windowCutoff && new Date(l.created_at).getTime() < windowCutoff) return false;
      if (categoryFilter !== "all" && friendly(l.action).category !== categoryFilter) return false;
      if (!q) return true;
      const info = friendly(l.action);
      const hay = [
        l.action,
        info.verb,
        l.target_type ?? "",
        l.target_id ?? "",
        l.profiles?.display_name ?? "",
        l.user_id ?? "",
        l.ip_address ?? "",
        JSON.stringify(l.details ?? {}),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [logs, search, categoryFilter, windowCutoff]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { auth: 0, buy: 0, content: 0, service: 0, member: 0, admin: 0, system: 0 };
    for (const l of logs) c[friendly(l.action).category] = (c[friendly(l.action).category] ?? 0) + 1;
    return c;
  }, [logs]);

  const toggleRow = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  const timeWindows: { key: TimeWindow; label: string }[] = [
    { key: "24h", label: "Last 24 hours" },
    { key: "7d",  label: "Last 7 days" },
    { key: "30d", label: "Last 30 days" },
    { key: "all", label: "All time" },
  ];

  const categoryChips: { key: CategoryFilter; label: string; count: number }[] = [
    { key: "all",     label: "Everything",   count: logs.length },
    { key: "auth",    label: "Sign-ins",     count: counts.auth },
    { key: "buy",     label: "Purchases",    count: counts.buy },
    { key: "content", label: "Community",    count: counts.content },
    { key: "service", label: "Support",      count: counts.service },
    { key: "member",  label: "Member area",  count: counts.member },
    { key: "admin",   label: "Admin action", count: counts.admin },
    { key: "system",  label: "System",       count: counts.system },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>ACTIVITY LOG</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          Everything people do on the site — sign-ins, purchases, posts, admin actions. Showing {filtered.length} of {logs.length}.
        </p>
      </div>

      {/* Category chips */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {categoryChips.filter(c => c.count > 0 || c.key === "all").map(c => {
          const active = categoryFilter === c.key;
          const meta = c.key === "all" ? { fg: "#1B3A2D", bg: "#E8F0E4" } : CATEGORY_META[c.key];
          return (
            <button key={c.key} onClick={() => setCat(c.key)}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: active ? "#ffffff" : meta.fg, background: active ? meta.fg : meta.bg, border: `1.5px solid ${meta.fg}${active ? "" : "40"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1px" }}>
              {c.label.toUpperCase()} · {c.count}
            </button>
          );
        })}
      </div>

      {/* Search + time */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, keyword, or ID…"
          style={{ ...inp, flex: 1, minWidth: "220px" }}
        />
        <select value={timeWindow} onChange={e => setTimeWindow(e.target.value as TimeWindow)}
          style={{ ...inp, minWidth: "170px", cursor: "pointer" }}>
          {timeWindows.map(w => <option key={w.key} value={w.key}>{w.label}</option>)}
        </select>
        {(search || categoryFilter !== "all" || timeWindow !== "all") && (
          <button onClick={() => { setSearch(""); setCat("all"); setTimeWindow("all"); }}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            CLEAR
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>
      )}

      {/* Log list */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>
            {logs.length === 0 ? "Nothing has happened yet." : "No matches for the current filters."}
          </div>
        ) : (
          filtered.map((log, i) => {
            const info = friendly(log.action);
            const cat = CATEGORY_META[info.category];
            const isExpanded = expanded.has(log.id);
            const hasDetails = (log.details && Object.keys(log.details).length > 0) || !!log.ip_address;
            const who = log.profiles?.display_name ?? (log.user_id ? "Someone" : "A visitor");
            // For page visits, show the full path (it's the human-readable target).
            // For other targets, show a short ID.
            const isPageVisit = log.action === "visit_page";
            const targetLine = isPageVisit && log.target_id
              ? log.target_id
              : (info.targetLabel && log.target_id
                ? `${info.targetLabel} · ${shortId(log.target_id)}`
                : friendlyTargetType(log.target_type) || null);

            return (
              <div key={log.id}>
                <div
                  onClick={() => hasDetails && toggleRow(log.id)}
                  style={{ padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", display: "flex", gap: "14px", alignItems: "center", cursor: hasDetails ? "pointer" : "default" }}
                >
                  {/* Avatar */}
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {log.profiles?.avatar_url
                      ? <img src={log.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1A8040" }}>{(log.profiles?.display_name ?? who)[0]?.toUpperCase() ?? "?"}</span>}
                  </div>

                  {/* Sentence */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600 }}>{who}</span>
                      <span style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{info.verb}</span>
                      {targetLine && (
                        <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{targetLine}</span>
                      )}
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: cat.fg, background: cat.bg, borderRadius: "999px", padding: "2px 8px", letterSpacing: "1px" }}>
                        {cat.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }} title={fullTime(log.created_at)}>
                      {timeAgo(log.created_at)}
                    </div>
                  </div>

                  {/* Expand chevron */}
                  {hasDetails && (
                    <span style={{ fontFamily: SG, fontSize: "12px", color: "#5A7A60", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>▾</span>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && hasDetails && (
                  <div style={{ padding: "0 20px 16px 68px", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", borderTop: "1px dashed #E4EDE4" }}>
                    <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "12px 14px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "6px 12px", fontFamily: B, fontSize: "12px" }}>
                        <span style={{ color: "#7A8E7A" }}>Exact time</span>
                        <span style={{ color: "#1B3A2D" }}>{fullTime(log.created_at)}</span>
                        {log.ip_address && (
                          <>
                            <span style={{ color: "#7A8E7A" }}>From IP</span>
                            <span style={{ color: "#1B3A2D", fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>{log.ip_address}</span>
                          </>
                        )}
                        {log.target_id && (
                          <>
                            <span style={{ color: "#7A8E7A" }}>{friendlyTargetType(log.target_type) || "Target"} ID</span>
                            <span style={{ color: "#1B3A2D", fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>{log.target_id}</span>
                          </>
                        )}
                        {log.details && Object.entries(log.details).map(([k, v]) => (
                          <>
                            <span key={`k-${k}`} style={{ color: "#7A8E7A" }}>{humanKey(k)}</span>
                            <span key={`v-${k}`} style={{ color: "#1B3A2D" }}>{humanValue(v)}</span>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
