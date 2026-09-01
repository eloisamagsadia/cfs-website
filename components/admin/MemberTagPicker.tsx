"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck } from "@/components/shared/Icons";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";

interface Tag { id: string; name: string; color: string; description?: string | null; }

export default function MemberTagPicker({ memberId }: { memberId: string }) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [mineTags, setMineTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const [a, m] = await Promise.all([
        fetch("/api/admin/tags").then(r => r.json()),
        fetch(`/api/admin/members/tags?member_id=${memberId}`).then(r => r.json()),
      ]);
      setAllTags(a.tags ?? []);
      setMineTags(m.tags ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [memberId]);

  const mineIds = new Set(mineTags.map(t => t.id));

  async function toggle(tag: Tag) {
    setBusy(tag.id); setError("");
    try {
      if (mineIds.has(tag.id)) {
        const r = await fetch(`/api/admin/members/tags?member_id=${encodeURIComponent(memberId)}&tag_id=${tag.id}`, { method: "DELETE" });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setMineTags(prev => prev.filter(t => t.id !== tag.id));
      } else {
        const r = await fetch("/api/admin/members/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ member_id: memberId, tag_id: tag.id }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setMineTags(prev => [...prev, tag]);
      }
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  if (loading) return <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>Loading tags…</div>;

  const untagged = allTags.filter(t => !mineIds.has(t.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.3px" }}>TAGS</span>
        {mineTags.map(t => (
          <button key={t.id} onClick={() => toggle(t)} disabled={busy === t.id}
            title="Click to remove"
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: t.color, border: "none", borderRadius: "999px", padding: "4px 10px", cursor: "pointer", letterSpacing: "1.1px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            {t.name} <span style={{ opacity: 0.75 }}>×</span>
          </button>
        ))}
        {mineTags.length === 0 && <span style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", fontStyle: "italic" as const }}>none yet</span>}
        <button onClick={() => setOpen(v => !v)}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: open ? "#5A7A60" : "#1A8040", background: open ? "#F0F0F0" : "#E8F0E4", border: "1.5px solid transparent", borderRadius: "999px", padding: "4px 10px", cursor: "pointer", letterSpacing: "1.1px" }}>
          {open ? "DONE" : "+ ADD TAG"}
        </button>
      </div>

      {open && (
        <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "10px", padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {untagged.length === 0 ? (
            <span style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>
              All tags applied. <Link href="/admin/tags" style={{ color: "#1A8040", textDecoration: "underline" }}>Manage tags →</Link>
            </span>
          ) : untagged.map(t => (
            <button key={t.id} onClick={() => toggle(t)} disabled={busy === t.id}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: t.color, background: "#ffffff", border: `1.5px solid ${t.color}`, borderRadius: "999px", padding: "4px 10px", cursor: "pointer", letterSpacing: "1.1px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <IconCheck size={9} color={t.color} /> {t.name}
            </button>
          ))}
        </div>
      )}

      {error && <div style={{ fontFamily: B, fontSize: "11px", color: "#CC3344" }}>{error}</div>}
    </div>
  );
}
