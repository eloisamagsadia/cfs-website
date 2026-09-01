"use client";
import { useEffect, useMemo, useState } from "react";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Verb-prefix → color mapping so new actions inherit sensible colors
// automatically. Explicit overrides for high-impact / systemic actions.
const VERB_COLORS: { prefix: string; fg: string; bg: string }[] = [
  { prefix: "create_",     fg: "#156530", bg: "#E8F0E4" },
  { prefix: "activate_",   fg: "#156530", bg: "#E8F0E4" },
  { prefix: "enable_",     fg: "#156530", bg: "#E8F0E4" },
  { prefix: "publish_",    fg: "#156530", bg: "#E8F0E4" },
  { prefix: "complete_",   fg: "#156530", bg: "#E8F0E4" },
  { prefix: "unhide_",     fg: "#156530", bg: "#E8F0E4" },
  { prefix: "pin_",        fg: "#156530", bg: "#E8F0E4" },
  { prefix: "unban_",      fg: "#156530", bg: "#E8F0E4" },
  { prefix: "delete_",     fg: "#8A1E27", bg: "#FFE8EC" },
  { prefix: "ban_",        fg: "#8A1E27", bg: "#FFE8EC" },
  { prefix: "cancel_",     fg: "#8A1E27", bg: "#FFE8EC" },
  { prefix: "disable_",    fg: "#8A1E27", bg: "#FFE8EC" },
  { prefix: "deactivate_", fg: "#8A1E27", bg: "#FFE8EC" },
  { prefix: "unpublish_",  fg: "#8A1E27", bg: "#FFE8EC" },
  { prefix: "edit_",       fg: "#7A5A0F", bg: "#FFF3D6" },
  { prefix: "update_",     fg: "#7A5A0F", bg: "#FFF3D6" },
  { prefix: "hide_",       fg: "#7A5A0F", bg: "#FFF3D6" },
  { prefix: "unpin_",      fg: "#7A5A0F", bg: "#FFF3D6" },
  { prefix: "send_",       fg: "#1E4A7A", bg: "#E4EEF8" },
  { prefix: "broadcast_",  fg: "#1E4A7A", bg: "#E4EEF8" },
  { prefix: "impersonate", fg: "#5A1E7A", bg: "#F0E4F8" },
  { prefix: "change_role", fg: "#5A1E7A", bg: "#F0E4F8" },
  { prefix: "cleanup_",    fg: "#4A5A60", bg: "#EAEEF0" },
];

function colorFor(action: string): { fg: string; bg: string } {
  for (const v of VERB_COLORS) if (action === v.prefix || action.startsWith(v.prefix)) return { fg: v.fg, bg: v.bg };
  return { fg: "#5A7A60", bg: "#F2F7F2" };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

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

export default function AuditPage() {
  const [logs, setLogs]             = useState<Log[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [actionFilter, setAction]   = useState<string>("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setLogs(d.logs ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(() => Array.from(new Set(logs.map(l => l.action))).sort(), [logs]);

  const windowCutoff = useMemo(() => {
    if (timeWindow === "all") return 0;
    const h = timeWindow === "24h" ? 24 : timeWindow === "7d" ? 24 * 7 : 24 * 30;
    return Date.now() - h * 60 * 60 * 1000;
  }, [timeWindow]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l => {
      if (windowCutoff && new Date(l.created_at).getTime() < windowCutoff) return false;
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (!q) return true;
      const hay = [
        l.action,
        l.target_type ?? "",
        l.target_id ?? "",
        l.profiles?.display_name ?? "",
        l.user_id ?? "",
        l.ip_address ?? "",
        JSON.stringify(l.details ?? {}),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [logs, search, actionFilter, windowCutoff]);

  const toggleRow = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  const timeWindows: { key: TimeWindow; label: string }[] = [
    { key: "24h", label: "24h" },
    { key: "7d",  label: "7d" },
    { key: "30d", label: "30d" },
    { key: "all", label: "All" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>AUDIT LOG</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Every admin action tracked. {logs.length} total events · {filtered.length} shown.</p>
      </div>

      {/* Filter bar */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, user, target, IP, details…"
            style={{ ...inp, flex: 1, minWidth: "220px" }}
          />
          <select value={actionFilter} onChange={e => setAction(e.target.value)}
            style={{ ...inp, minWidth: "180px", cursor: "pointer" }}>
            <option value="all">All actions ({actions.length})</option>
            {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </select>
          <div style={{ display: "flex", gap: "4px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "3px" }}>
            {timeWindows.map(w => (
              <button key={w.key} onClick={() => setTimeWindow(w.key)}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: timeWindow === w.key ? "#ffffff" : "#5A7A60", background: timeWindow === w.key ? "#1A8040" : "transparent", border: "none", borderRadius: "7px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                {w.label.toUpperCase()}
              </button>
            ))}
          </div>
          {(search || actionFilter !== "all" || timeWindow !== "all") && (
            <button onClick={() => { setSearch(""); setAction("all"); setTimeWindow("all"); }}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
              RESET
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>
      )}

      {/* Log list */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ background: "#F7FAF5", padding: "10px 20px", display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1.2fr 0.8fr 32px", gap: "10px", borderBottom: "1px solid #E4EDE4" }}>
          {["USER", "ACTION", "TARGET", "WHEN", ""].map((h, i) => (
            <span key={i} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>
            {logs.length === 0 ? "No audit events yet." : "No matches for current filters."}
          </div>
        ) : (
          filtered.map((log, i) => {
            const c = colorFor(log.action);
            const isExpanded = expanded.has(log.id);
            const hasDetails = (log.details && Object.keys(log.details).length > 0) || !!log.ip_address;
            return (
              <div key={log.id}>
                <div
                  onClick={() => hasDetails && toggleRow(log.id)}
                  style={{ padding: "12px 20px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", display: "grid", gridTemplateColumns: "1.4fr 1.6fr 1.2fr 0.8fr 32px", gap: "10px", alignItems: "center", cursor: hasDetails ? "pointer" : "default" }}
                >
                  {/* User */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {log.profiles?.avatar_url
                        ? <img src={log.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040" }}>{(log.profiles?.display_name ?? "?")[0]?.toUpperCase() ?? "?"}</span>}
                    </div>
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.profiles?.display_name ?? log.user_id ?? "Unknown"}</span>
                  </div>

                  {/* Action */}
                  <div>
                    <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: c.fg, background: c.bg, borderRadius: "6px", padding: "3px 9px", letterSpacing: "1.2px" }}>
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Target */}
                  <div style={{ minWidth: 0 }}>
                    {log.target_type && <div style={{ fontFamily: SG, fontSize: "9px", color: "#7A8E7A", letterSpacing: "1.2px" }}>{log.target_type.toUpperCase()}</div>}
                    {log.target_id && <div style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "10px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.target_id}</div>}
                    {!log.target_type && !log.target_id && <span style={{ fontFamily: B, fontSize: "11px", color: "#B7CDB7" }}>—</span>}
                  </div>

                  {/* When */}
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }} title={new Date(log.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}>{timeAgo(log.created_at)}</div>

                  {/* Expand chevron */}
                  <div style={{ textAlign: "center" }}>
                    {hasDetails && (
                      <span style={{ display: "inline-block", fontFamily: SG, fontSize: "10px", color: "#5A7A60", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && hasDetails && (
                  <div style={{ padding: "0 20px 14px", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", borderTop: "1px dashed #E4EDE4" }}>
                    <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "8px", padding: "10px 12px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {log.ip_address && (
                        <div style={{ display: "flex", gap: "8px", fontFamily: B, fontSize: "11px" }}>
                          <span style={{ color: "#7A8E7A", minWidth: "60px" }}>IP</span>
                          <span style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", color: "#1B3A2D" }}>{log.ip_address}</span>
                        </div>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <pre style={{ margin: 0, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px", color: "#1B3A2D", background: "#ffffff", border: "1px solid #E4EDE4", borderRadius: "6px", padding: "8px 10px", overflow: "auto", whiteSpace: "pre-wrap" as const }}>
{JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
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
