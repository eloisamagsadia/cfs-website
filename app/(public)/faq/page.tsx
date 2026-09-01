"use client";
import { useEffect, useMemo, useState } from "react";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  general:   "General",
  events:    "Events & Tickets",
  shop:      "Shop & Shipping",
  donations: "Donations",
  account:   "Account",
};

export default function PublicFaqPage() {
  const [faqs, setFaqs]       = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState<Set<string>>(new Set());
  const [cat, setCat]         = useState<string>("all");

  useEffect(() => {
    fetch("/api/faqs")
      .then(r => r.json())
      .then(d => setFaqs(d.faqs ?? []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const f of faqs) s.add(f.category);
    return Array.from(s);
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter(f =>
      (cat === "all" || f.category === cat) &&
      (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
    );
  }, [faqs, search, cat]);

  const grouped = useMemo(() => {
    const g: Record<string, Faq[]> = {};
    for (const f of filtered) (g[f.category] ??= []).push(f);
    return g;
  }, [filtered]);

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ background: "#FAF6EE", minHeight: "100vh", padding: "56px 20px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", letterSpacing: "3px" }}>SUPPORT CENTER</div>
          <h1 style={{ fontFamily: R, fontSize: "2.4rem", color: "#1B3A2D", letterSpacing: "4px", margin: "8px 0 6px" }}>FAQ</h1>
          <p style={{ fontFamily: B, fontSize: "14px", color: "#4A7C59", maxWidth: "520px", margin: "0 auto" }}>
            Common questions from members. Can't find your answer? <a href="/support" style={{ color: "#1A8040", fontWeight: 600 }}>Reach out</a> and we'll help.
          </p>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search FAQs…"
          style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "12px", padding: "13px 18px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
        />

        {categories.length > 1 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => setCat("all")}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: cat === "all" ? "#ffffff" : "#1B3A2D", background: cat === "all" ? "#1A8040" : "#ffffff", border: `1.5px solid ${cat === "all" ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.3px" }}>
              ALL
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: cat === c ? "#ffffff" : "#1B3A2D", background: cat === c ? "#1A8040" : "#ffffff", border: `1.5px solid ${cat === c ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.3px" }}>
                {(CATEGORY_LABEL[c] ?? c).toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
            No FAQs match your search. Try a different keyword or <a href="/support" style={{ color: "#1A8040" }}>contact support</a>.
          </div>
        ) : (
          Object.entries(grouped).map(([c, list]) => (
            <div key={c} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "3px" }}>{(CATEGORY_LABEL[c] ?? c).toUpperCase()}</div>
              {list.map(f => {
                const isOpen = open.has(f.id);
                return (
                  <div key={f.id} style={{ background: "#ffffff", border: `1px solid ${isOpen ? "#B7D8B7" : "#DDE8DD"}`, borderRadius: "12px", overflow: "hidden", transition: "border-color 0.15s" }}>
                    <button onClick={() => toggle(f.id)}
                      style={{ width: "100%", textAlign: "left" as const, background: "transparent", border: "none", padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontFamily: B, fontSize: "14px", color: "#1B3A2D", fontWeight: 600 }}>
                      <span style={{ flex: 1 }}>{f.question}</span>
                      <span style={{ fontFamily: SG, fontSize: "16px", color: "#1A8040", transition: "transform 0.15s", transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 18px 16px", fontFamily: B, fontSize: "13.5px", color: "#3A5A44", lineHeight: 1.65, whiteSpace: "pre-wrap" as const }}>
                        {f.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div style={{ textAlign: "center", padding: "24px 0", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>
          Still stuck? <a href="/support" style={{ color: "#1A8040", fontWeight: 600 }}>Message support</a> and we'll get back within a business day.
        </div>
      </div>
    </div>
  );
}
