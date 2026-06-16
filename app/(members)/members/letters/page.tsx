"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { IconMail, IconPen, IconSend, IconX } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

export default function LettersPage() {
  const router = useRouter();
  const { user } = useUser();
  const [tab, setTab] = useState<"colet" | "wall">("wall");

  // From Colet (Medium RSS)
  const [letters, setLetters] = useState<any[]>([]);
  const [lettersLoading, setLettersLoading] = useState(true);

  // Freedom Wall
  const [wall, setWall] = useState<any[]>([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/letters").then(r => r.json()).then(d => {
      setLetters(d.letters ?? []);
      setLettersLoading(false);
    });
    fetch("/api/fan-letters").then(r => r.json()).then(d => {
      setWall(d.letters ?? []);
      setWallLoading(false);
    });
  }, []);

  async function submitLetter() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    setFormError("");
    const res = await fetch("/api/fan-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? "Failed to submit");
    } else {
      setWall(prev => [{ ...data.letter, profiles: { display_name: user?.firstName ?? "You", avatar_url: user?.imageUrl } }, ...prev]);
      setForm({ title: "", content: "" });
      setShowForm(false);
    }
    setSubmitting(false);
  }

  async function deleteLetter(id: string) {
    setDeletingId(id);
    await fetch("/api/fan-letters", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setWall(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}><IconMail size={22} color="#1B3A2D" /> LETTERS FOR COLET</h1>
        <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "14px", color: "#4A7C59" }}>Fan letters written from the heart</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #DDE8DD" }}>
        {([["wall", "FREEDOM WALL"], ["colet", "FROM COLET"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1.5px", padding: "10px 20px", background: "none", border: "none", cursor: "pointer", color: tab === key ? "#1A8040" : "#5A7A60", borderBottom: `2px solid ${tab === key ? "#1A8040" : "transparent"}`, marginBottom: "-2px", transition: "color 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* FROM COLET tab */}
      {tab === "colet" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {lettersLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "12px" }} />)}
            </div>
          ) : letters.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No letters yet.</div>
          ) : letters.map((letter, i) => (
            <div key={i} onClick={() => router.push(`/members/letters/${letter.slug}`)}
              style={{ display: "flex", gap: "20px", alignItems: "flex-start", padding: "20px", background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "14px", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#1A8040")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#DDE8DD")}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {letter.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {letter.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} style={{ fontFamily: B, fontSize: "10px", color: "#1A8040", background: "#E8F4EC", borderRadius: "20px", padding: "2px 10px" }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontFamily: S, fontSize: "1.15rem", color: "#1B3A2D", lineHeight: 1.4, marginBottom: "8px" }}>{letter.title}</div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", lineHeight: 1.7, marginBottom: "12px" }}>{letter.excerpt}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid #DDE8DD", flexShrink: 0 }}>
                    <img src="https://cdn-images-1.medium.com/fit/c/150/150/1*OKtnsFxtdnvoBrTZ_8o1Nw@2x.jpeg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>letters from colet</span>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{timeAgo(letter.pubDate)}</span>
                  <span style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", marginLeft: "auto", letterSpacing: "1px" }}>READ →</span>
                </div>
              </div>
              {letter.thumbnail && (
                <div style={{ width: "120px", height: "90px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
                  <img src={letter.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
            </div>
          ))}
          {!lettersLoading && letters.length > 0 && (
            <div style={{ textAlign: "center", paddingTop: "8px" }}>
              <a href="https://medium.com/@lettersfromcolet" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", textDecoration: "none", letterSpacing: "1px" }}>
                VIEW ALL ON MEDIUM →
              </a>
            </div>
          )}
        </div>
      )}

      {/* FREEDOM WALL tab — scrapbook bulletin board */}
      {tab === "wall" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Write form — styled as a blank note */}
          {showForm ? (
            <div style={{
              background: "#FDFBF0", border: "1.5px solid #D8C878",
              borderRadius: "4px", padding: "20px",
              boxShadow: "3px 5px 16px rgba(0,0,0,0.12)",
              position: "relative", display: "flex", flexDirection: "column", gap: "12px",
            }}>
              {/* Tape */}
              <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", width: "56px", height: "14px", background: "#F5ECA0", borderRadius: "2px", opacity: 0.9, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
              <div style={{ fontFamily: S, fontSize: "1rem", color: "#6A5A20", fontStyle: "italic", marginTop: "4px" }}>Dear Colet,</div>
              {formError && <div style={{ background: "#FFE8EC", border: "1px solid #CC3344", borderRadius: "6px", padding: "8px 12px", fontFamily: B, fontSize: "12px", color: "#CC3344" }}>{formError}</div>}
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Subject (e.g. Thank you for existing 🌿)"
                style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #D8C878", padding: "6px 0", color: "#2A2010", fontFamily: S, fontSize: "1rem", outline: "none", fontStyle: "italic" }} />
              <div style={{ position: "relative" }}>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Write from the heart..."
                  rows={7}
                  style={{ width: "100%", background: "transparent", border: "none", padding: "0", color: "#3A3020", fontFamily: B, fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 2, backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E8D8A080 31px, #E8D8A080 32px)" }} />
                <span style={{ fontFamily: B, fontSize: "10px", color: form.content.length > 1800 ? "#CC3344" : "#8A7840" }}>{form.content.length}/2000</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowForm(false)}
                  style={{ fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #D8C878", borderRadius: "6px", color: "#8A7840", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
                <button onClick={submitLetter} disabled={submitting || !form.title.trim() || !form.content.trim()}
                  style={{ fontFamily: R, fontSize: "11px", background: submitting || !form.title.trim() || !form.content.trim() ? "#E8D8A0" : "#1A8040", color: submitting || !form.title.trim() || !form.content.trim() ? "#8A7840" : "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px", flex: 1 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>{submitting ? "SENDING..." : <><IconSend size={12} color="currentColor" /> SEND LETTER</>}</span>
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} style={{
              background: "#FDFBF0", border: "1.5px dashed #C8A868",
              borderRadius: "4px", padding: "16px 20px",
              boxShadow: "2px 3px 10px rgba(0,0,0,0.08)",
              cursor: "pointer", textAlign: "center", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            }}>
              <IconPen size={20} color="#8A7040" />
              <div>
                <div style={{ fontFamily: S, fontSize: "14px", color: "#6A5A30", fontStyle: "italic", marginBottom: "2px" }}>Write a letter to Colet</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#8A7850" }}>Share your heart — she sees every word</div>
              </div>
            </button>
          )}

          {/* Corkboard */}
          {wallLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px", padding: "20px" }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: "180px", borderRadius: "4px" }} />)}
            </div>
          ) : wall.length === 0 ? (
            <div style={{
              background: "linear-gradient(145deg, #C4924A, #B8844A)",
              borderRadius: "12px", padding: "48px 24px", textAlign: "center",
              backgroundImage: "radial-gradient(ellipse at 2px 2px, rgba(0,0,0,0.07) 1.5px, transparent 0)", backgroundSize: "14px 14px",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
            }}>
              <div style={{ marginBottom: "12px" }}><IconMail size={36} color="rgba(255,255,255,0.8)" /></div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "rgba(255,255,255,0.9)", letterSpacing: "2px", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>BE THE FIRST TO WRITE</div>
            </div>
          ) : (
            <div style={{
              background: "linear-gradient(145deg, #C4924A 0%, #B8844A 50%, #C89A58 100%)",
              borderRadius: "12px", padding: "28px 20px 20px",
              backgroundImage: "radial-gradient(ellipse at 2px 2px, rgba(0,0,0,0.07) 1.5px, transparent 0)", backgroundSize: "14px 14px",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.1)",
              position: "relative",
            }}>
              {/* Cork texture */}
              <div style={{ position: "absolute", inset: 0, borderRadius: "12px", backgroundImage: "radial-gradient(circle at 3px 3px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
              <div style={{ position: "relative", columns: "2 220px", columnGap: "20px" }}>
                {wall.map((letter, i) => {
                  const NOTE_COLORS = [
                    { bg: "#FDFBF0", border: "#E8D88A", tape: "#F5ECA0" },
                    { bg: "#F0F7F0", border: "#B8D8B8", tape: "#C8E8C8" },
                    { bg: "#FDF5F0", border: "#E8C8B0", tape: "#F5D8C0" },
                    { bg: "#F0F4FB", border: "#B8C8E8", tape: "#C8D8F5" },
                    { bg: "#FBF0F5", border: "#E8B8C8", tape: "#F5C8D8" },
                    { bg: "#F5FBF0", border: "#C8E8A8", tape: "#D8F0B8" },
                  ];
                  const ROTS = [-3, 2, -1.5, 2.5, -2, 1, -2.5, 3];
                  const note = NOTE_COLORS[i % NOTE_COLORS.length];
                  const rot = ROTS[i % ROTS.length];
                  const isOwn = letter.user_id === user?.id;
                  return (
                    <div key={letter.id} style={{ breakInside: "avoid", marginBottom: "20px", display: "inline-block", width: "100%" }}>
                      <div style={{
                        background: note.bg, border: `1.5px solid ${note.border}`,
                        borderRadius: "3px", padding: "14px 14px 16px",
                        transform: `rotate(${rot}deg)`,
                        boxShadow: "3px 5px 14px rgba(0,0,0,0.2)",
                        position: "relative",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "rotate(0deg) scale(1.02)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 10px 24px rgba(0,0,0,0.28)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot}deg)`; (e.currentTarget as HTMLDivElement).style.boxShadow = "3px 5px 14px rgba(0,0,0,0.2)"; }}>
                        {/* Tape */}
                        <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", width: "44px", height: "14px", background: note.tape, borderRadius: "2px", opacity: 0.88, boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }} />
                        {/* Delete */}
                        {isOwn && (
                          <button onClick={() => deleteLetter(letter.id)} disabled={deletingId === letter.id}
                            style={{ position: "absolute", top: "6px", right: "6px", background: "none", border: "none", cursor: "pointer", color: "#CC3344", opacity: deletingId === letter.id ? 0.4 : 0.6, padding: "2px 4px", display: "flex" }}>
                            <IconX size={12} color="#CC3344" />
                          </button>
                        )}
                        {/* Author */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#DDE8DD", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {letter.profiles?.avatar_url
                              ? <img src={letter.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontFamily: R, fontSize: "9px", color: "#4A7C59" }}>{(letter.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                          </div>
                          <div>
                            <div style={{ fontFamily: R, fontSize: "10px", color: "#4A3A20", letterSpacing: "0.3px" }}>{letter.profiles?.display_name ?? "Member"}</div>
                            <div style={{ fontFamily: B, fontSize: "9px", color: "#8A7850" }}>{formatDate(letter.created_at)}</div>
                          </div>
                        </div>
                        {/* Title */}
                        <div style={{ fontFamily: S, fontSize: "13px", color: "#2A2010", lineHeight: 1.4, marginBottom: "8px", fontStyle: "italic", borderBottom: `1px solid ${note.border}`, paddingBottom: "6px" }}>{letter.title}</div>
                        {/* Content */}
                        <div style={{ fontFamily: B, fontSize: "11px", color: "#4A3A28", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{letter.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
