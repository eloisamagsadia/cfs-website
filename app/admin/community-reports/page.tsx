"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconCheck, IconWarning, IconFlag, IconTrash, IconEyeOff } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Status = "pending" | "reviewed" | "resolved";

interface Report {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: Status;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  reporter?: { id: string; display_name?: string; avatar_url?: string } | null;
  post?: { id: string; content?: string; is_hidden?: boolean; user_id?: string; images?: string[]; profiles?: { display_name?: string; avatar_url?: string } } | null;
  comment?: { id: string; content?: string; user_id?: string; profiles?: { display_name?: string; avatar_url?: string } } | null;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const STATUS_STYLE: Record<Status, { bg: string; fg: string }> = {
  pending:  { bg: "#FFE8EC", fg: "#8A1E27" },
  reviewed: { bg: "#FFF3D6", fg: "#7A5A0F" },
  resolved: { bg: "#E8F0E4", fg: "#156530" },
};

export default function CommunityReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [filter, setFilter]   = useState<Status | "all">("pending");
  const [working, setWorking] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote]       = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const url = filter === "all" ? "/api/admin/community-reports" : `/api/admin/community-reports?status=${filter}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setReports(d.reports ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  async function act(id: string, patch: any) {
    setWorking(id); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/community-reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Report updated.");
      setNoteFor(null); setNote("");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  const counts = useMemo(() => {
    const c: Record<Status, number> = { pending: 0, reviewed: 0, resolved: 0 };
    for (const r of reports) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [reports]);

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>COMMUNITY REPORTS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Member-filed reports on posts and comments. Triage → resolve.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(["pending", "reviewed", "resolved", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: "1.5px solid " + (filter === f ? "#1A8040" : "#DDE8DD"), borderRadius: "10px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {f.toUpperCase()}{f !== "all" && ` (${counts[f]})`}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : reports.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
          <IconFlag size={28} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px", marginTop: "10px" }}>NO {filter.toUpperCase()} REPORTS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "6px" }}>Members can flag posts and comments; anything they report shows up here.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reports.map(rep => {
            const st = STATUS_STYLE[rep.status];
            const target = rep.post ?? rep.comment;
            const isPost = !!rep.post;
            const targetContent = (target?.content ?? "").slice(0, 220);
            const targetAuthor = target?.profiles?.display_name ?? target?.user_id ?? "unknown";
            const isNoting = noteFor === rep.id;
            return (
              <div key={rep.id} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", opacity: rep.status === "resolved" ? 0.75 : 1 }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#FFE8EC", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {rep.reporter?.avatar_url ? <img src={rep.reporter.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IconFlag size={13} color="#8A1E27" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>
                        <strong>{rep.reporter?.display_name ?? rep.reporter_id}</strong> reported a {isPost ? "post" : "comment"}
                      </div>
                      <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>
                        {timeAgo(rep.created_at)} · reason: <span style={{ color: "#8A1E27", fontWeight: 600 }}>{rep.reason}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: st.fg, background: st.bg, borderRadius: "6px", padding: "3px 9px", letterSpacing: "1.2px" }}>{rep.status.toUpperCase()}</span>
                </div>

                {/* Target preview */}
                <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "10px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.2px" }}>{isPost ? "POST" : "COMMENT"} BY</span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#1B3A2D", fontWeight: 600 }}>{targetAuthor}</span>
                    {isPost && rep.post?.is_hidden && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1.2px" }}>HIDDEN</span>}
                  </div>
                  {targetContent ? (
                    <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.5, whiteSpace: "pre-wrap" as const }}>{targetContent}{(target?.content?.length ?? 0) > 220 ? "…" : ""}</div>
                  ) : (
                    <div style={{ fontFamily: B, fontSize: "12px", color: "#B7CDB7", fontStyle: "italic" }}>(target deleted or empty)</div>
                  )}
                  {isPost && rep.post?.images && rep.post.images.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      {rep.post.images.slice(0, 4).map((src, i) => (
                        <img key={i} src={src} alt="" style={{ maxHeight: "140px", borderRadius: "6px" }} />
                      ))}
                    </div>
                  )}
                  {isPost && rep.post?.id && (
                    <div style={{ marginTop: "8px" }}>
                      <Link href={`/members/community/${rep.post.id}`} target="_blank" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1.2px" }}>OPEN POST →</Link>
                    </div>
                  )}
                </div>

                {rep.resolution_note && (
                  <div style={{ background: "#F7FAF5", border: "1px dashed #DDE8DD", borderRadius: "8px", padding: "10px 12px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
                    Note: {rep.resolution_note}
                  </div>
                )}

                {isNoting && (
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Resolution note (optional, shown in this queue)…"
                    style={{ ...inp, minHeight: "60px", resize: "vertical" as const }} />
                )}

                {rep.status !== "resolved" && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {isPost && !rep.post?.is_hidden && (
                      <button onClick={() => act(rep.id, { action: "hide_post", status: "resolved", resolution_note: note || "Hidden via reports queue" })} disabled={working === rep.id}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", border: "1.5px solid transparent", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <IconEyeOff size={11} color="#7A5A0F" /> HIDE POST + RESOLVE
                      </button>
                    )}
                    {isPost && (
                      <button onClick={() => { if (!confirm("Delete the post and resolve this report? This cannot be undone.")) return; act(rep.id, { action: "delete_post", status: "resolved", resolution_note: note || "Post deleted via reports queue" }); }} disabled={working === rep.id}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", border: "1.5px solid transparent", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <IconTrash size={11} color="#8A1E27" /> DELETE POST + RESOLVE
                      </button>
                    )}
                    {!isNoting && (
                      <button onClick={() => { setNoteFor(rep.id); setNote(rep.resolution_note ?? ""); }}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                        ADD NOTE
                      </button>
                    )}
                    {rep.status !== "reviewed" && (
                      <button onClick={() => act(rep.id, { status: "reviewed", resolution_note: note || null })} disabled={working === rep.id}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                        MARK REVIEWED
                      </button>
                    )}
                    <button onClick={() => act(rep.id, { status: "resolved", resolution_note: note || "No action needed" })} disabled={working === rep.id}
                      style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <IconCheck size={11} color="#ffffff" /> RESOLVE
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
