"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>LETTERS FOR COLET</h1>
        <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "14px", color: "#4A7C59" }}>Fan letters written from the heart 💌</p>
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

      {/* FREEDOM WALL tab */}
      {tab === "wall" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Wall intro + write button */}
          <div style={{ background: "linear-gradient(135deg, #E8F4EC, #F2F7F2)", border: "1.5px solid #DDE8DD", borderRadius: "14px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: S, fontSize: "1.1rem", color: "#1B3A2D", marginBottom: "4px" }}>Write a letter to Colet</div>
              <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Share your heart — Colet sees every word 💚</div>
            </div>
            <button onClick={() => setShowForm(p => !p)}
              style={{ fontFamily: R, fontSize: "11px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", letterSpacing: "1px", flexShrink: 0 }}>
              {showForm ? "CANCEL" : "✍️ WRITE LETTER"}
            </button>
          </div>

          {/* Write form */}
          {showForm && (
            <div style={{ background: "#FFFFFF", border: "2px solid #1A8040", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "1.5px" }}>YOUR LETTER</div>
              {formError && <div style={{ background: "#FFE8EC", border: "1px solid #CC3344", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{formError}</div>}
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Subject / Title (e.g. Thank you for existing 🌿)"
                style={{ background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
              <div style={{ position: "relative" }}>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Dear Colet, ..."
                  rows={6}
                  style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.7 }} />
                <span style={{ position: "absolute", bottom: "10px", right: "14px", fontFamily: B, fontSize: "11px", color: form.content.length > 1800 ? "#CC3344" : "#5A7A60" }}>{form.content.length}/2000</span>
              </div>
              <button onClick={submitLetter} disabled={submitting || !form.title.trim() || !form.content.trim()}
                style={{ fontFamily: R, fontSize: "12px", background: submitting || !form.title.trim() || !form.content.trim() ? "#F2F7F2" : "#1A8040", color: submitting || !form.title.trim() || !form.content.trim() ? "#5A7A60" : "#FFFFFF", border: "none", borderRadius: "8px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
                {submitting ? "SENDING..." : "SEND LETTER 💌"}
              </button>
            </div>
          )}

          {/* Letters list */}
          {wallLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "12px" }} />)}
            </div>
          ) : wall.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>💌</div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px" }}>BE THE FIRST TO WRITE</div>
            </div>
          ) : wall.map((letter) => {
            const isOwn = letter.user_id === user?.id;
            return (
              <div key={letter.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#E8F0E4", border: "2px solid #DDE8DD", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {letter.profiles?.avatar_url
                        ? <img src={letter.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>{(letter.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                    </div>
                    <div>
                      <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "0.5px" }}>{letter.profiles?.display_name ?? "Member"}</div>
                      <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{formatDate(letter.created_at)}</div>
                    </div>
                  </div>
                  {isOwn && (
                    <button onClick={() => deleteLetter(letter.id)} disabled={deletingId === letter.id}
                      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: B, fontSize: "11px", color: "#CC3344", opacity: deletingId === letter.id ? 0.5 : 1, padding: "4px" }}>
                      {deletingId === letter.id ? "..." : "Delete"}
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: S, fontSize: "1rem", color: "#1B3A2D", marginBottom: "8px" }}>{letter.title}</div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{letter.content}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
