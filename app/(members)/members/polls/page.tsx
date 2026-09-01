"use client";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Option { id: string; label: string; vote_count: number; }
interface Poll {
  id: string;
  question: string;
  description: string | null;
  category: string;
  ends_at: string | null;
  results_visible: "always" | "after_vote" | "after_end";
  options: Option[];
  total_votes: number;
  my_vote: string | null;
  ended: boolean;
  can_see_results: boolean;
}

function timeLeft(iso?: string | null) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const d = Math.floor(ms / 86400000);
  if (d >= 1) return `${d}d left`;
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return `${h}h left`;
  return "closing soon";
}

export default function MemberPollsPage() {
  const [polls, setPolls]     = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [filter, setFilter]   = useState<"open" | "closed" | "all">("open");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/polls");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPolls(d.polls ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { open: 0, closed: 0, all: polls.length };
    for (const p of polls) p.ended ? c.closed++ : c.open++;
    return c;
  }, [polls]);

  const filtered = useMemo(() => {
    if (filter === "open") return polls.filter(p => !p.ended);
    if (filter === "closed") return polls.filter(p => p.ended);
    return polls;
  }, [polls, filter]);

  async function vote(pollId: string, optionId: string) {
    setBusy(pollId); setError("");
    try {
      const r = await fetch("/api/polls/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ poll_id: pollId, option_id: optionId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function unvote(pollId: string) {
    setBusy(pollId); setError("");
    try {
      const r = await fetch(`/api/polls/vote?poll_id=${pollId}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>POLLS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Your voice shapes what we do next — help us decide together.</p>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(["open", "closed", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === f ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          {filter === "open" ? "No open polls right now. Check back soon!" : filter === "closed" ? "No closed polls to browse yet." : "No polls yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: "#ffffff", border: `1px solid ${p.my_vote ? "#B7D8B7" : "#DDE8DD"}`, borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{p.category.toUpperCase()}</span>
                {p.ended && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>CLOSED</span>}
                {p.my_vote && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#156530", background: "#E8F0E4", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "4px" }}><IconCheck size={9} color="#156530" /> YOU VOTED</span>}
                <span style={{ marginLeft: "auto", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>
                  {p.total_votes} vote{p.total_votes === 1 ? "" : "s"}{p.ends_at ? ` · ${timeLeft(p.ends_at)}` : ""}
                </span>
              </div>

              <div>
                <div style={{ fontFamily: R, fontSize: "16px", color: "#1B3A2D", letterSpacing: "1px" }}>{p.question}</div>
                {p.description && <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", marginTop: "4px", lineHeight: 1.55 }}>{p.description}</div>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {p.options.map(o => {
                  const pct = p.total_votes === 0 ? 0 : Math.round((o.vote_count / p.total_votes) * 100);
                  const mine = p.my_vote === o.id;
                  const showResults = p.can_see_results;
                  const clickable = !p.ended && !p.my_vote;

                  return (
                    <button
                      key={o.id}
                      onClick={() => clickable && vote(p.id, o.id)}
                      disabled={busy === p.id || !clickable}
                      style={{
                        position: "relative" as const,
                        background: mine ? "#E8F0E4" : "#F7FAF5",
                        border: `1.5px solid ${mine ? "#1A8040" : "#E4EDE4"}`,
                        borderRadius: "10px", padding: "12px 14px",
                        cursor: clickable ? "pointer" : "default",
                        textAlign: "left" as const, overflow: "hidden",
                      }}
                    >
                      {showResults && (
                        <div style={{ position: "absolute" as const, top: 0, left: 0, height: "100%", width: `${pct}%`, background: mine ? "#D4E7D4" : "#EDF3ED", transition: "width .3s", zIndex: 0 }} />
                      )}
                      <div style={{ position: "relative" as const, display: "flex", alignItems: "center", gap: "8px", zIndex: 1 }}>
                        <span style={{ fontFamily: B, fontSize: "14px", color: "#1B3A2D", fontWeight: mine ? 700 : 500, flex: 1 }}>
                          {mine && <IconCheck size={13} color="#1A8040" style={{ marginRight: 6, verticalAlign: "middle" }} />}
                          {o.label}
                        </span>
                        {showResults && (
                          <span style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#156530", whiteSpace: "nowrap" as const }}>
                            {o.vote_count} · {pct}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {p.my_vote && !p.ended && (
                <button onClick={() => unvote(p.id)} disabled={busy === p.id}
                  style={{ alignSelf: "flex-start", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                  CHANGE MY VOTE
                </button>
              )}

              {!p.can_see_results && !p.my_vote && (
                <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", fontStyle: "italic" as const }}>
                  Results will appear {p.results_visible === "after_vote" ? "after you vote" : "after the poll closes"}.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
