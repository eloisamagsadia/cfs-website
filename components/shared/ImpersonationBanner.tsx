"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

type Status = { active: boolean; target_label?: string | null; admin_label?: string | null; expires_at?: number };

export default function ImpersonationBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const r = await fetch("/api/super/impersonate", { cache: "no-store" });
        const d = await r.json();
        if (!cancelled) setStatus(d);
      } catch {
        if (!cancelled) setStatus({ active: false });
      }
    }
    tick();
    const t = setInterval(tick, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!status?.active) return null;

  const timeLeft = status.expires_at
    ? Math.max(0, status.expires_at - Math.floor(Date.now() / 1000))
    : null;
  const hoursLeft = timeLeft != null ? Math.floor(timeLeft / 3600) : null;
  const minsLeft  = timeLeft != null ? Math.floor((timeLeft % 3600) / 60) : null;

  async function stop() {
    setBusy(true);
    try {
      await fetch("/api/super/impersonate", { method: "DELETE" });
      setStatus({ active: false });
      // Full refresh so server components re-render with the real user
      router.push("/super/impersonate");
      router.refresh();
    } catch {} finally { setBusy(false); }
  }

  return (
    <div style={{
      background: "linear-gradient(90deg,#B45309 0%,#D97706 100%)",
      color: "#ffffff",
      padding: "8px 14px",
      display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap",
      fontFamily: B, fontSize: 12,
      boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.15)",
      position: "sticky", top: 0, zIndex: 40,
    }}>
      <span style={{ fontFamily: R, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, background: "rgba(0,0,0,0.18)", padding: "2px 8px", borderRadius: 6 }}>
        IMPERSONATING
      </span>
      <span>
        Viewing as <strong>{status.target_label ?? "another member"}</strong>. Your admin account ({status.admin_label ?? "you"}) is intact.
      </span>
      {timeLeft != null && (
        <span style={{ fontFamily: R, fontSize: 10, letterSpacing: 1.2, opacity: 0.9 }}>
          {hoursLeft! > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`} LEFT
        </span>
      )}
      <button onClick={stop} disabled={busy}
        style={{ fontFamily: R, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: "#B45309", background: "#ffffff", border: "none", borderRadius: 6, padding: "5px 12px", cursor: busy ? "wait" : "pointer" }}>
        {busy ? "…" : "RETURN TO ADMIN"}
      </button>
    </div>
  );
}
