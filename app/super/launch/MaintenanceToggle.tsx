"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Big obvious kill-switch. When ON: members + visitors see the
// "back soon" page. Admins bypass. A double-tap confirmation keeps
// this from being flipped accidentally.
export default function MaintenanceToggle({ initialOn }: { initialOn: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initialOn);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply(next: boolean) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/super/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_mode: next }),
      });
      if (!res.ok) throw new Error("Save failed");
      setOn(next);
      setConfirming(false);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to toggle");
    } finally {
      setBusy(false);
    }
  }

  const bg = on ? "#FFE8EC" : "#E8F0E4";
  const border = on ? "#CC3344" : "#1A8040";
  const label = on ? "MAINTENANCE MODE IS ON" : "SITE IS LIVE";
  const sublabel = on
    ? "Members and visitors see the back-soon page. You (admin) can still work."
    : "Everything running normally. Toggle on if the site is broken and you need to work in peace.";

  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: "14px", padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: R, fontSize: "13px", color: border, letterSpacing: "2px" }}>{label}</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", marginTop: "4px", lineHeight: 1.5 }}>{sublabel}</div>
        {error && <div style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", marginTop: "6px" }}>{error}</div>}
      </div>

      {!confirming ? (
        <button onClick={() => setConfirming(true)}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: border, border: "none", borderRadius: "10px", padding: "10px 18px", cursor: "pointer", letterSpacing: "1.2px", flexShrink: 0 }}>
          {on ? "TURN OFF" : "TURN ON"}
        </button>
      ) : (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>Sure?</span>
          <button onClick={() => apply(!on)} disabled={busy}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: border, border: "none", borderRadius: "10px", padding: "10px 14px", cursor: busy ? "wait" : "pointer", letterSpacing: "1.2px" }}>
            {busy ? "SAVING..." : `YES, TURN ${on ? "OFF" : "ON"}`}
          </button>
          <button onClick={() => setConfirming(false)} disabled={busy}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}
