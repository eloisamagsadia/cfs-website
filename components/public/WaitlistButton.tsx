"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconCheck } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface Props {
  eventId: string;
  isLoggedIn: boolean;
}

export default function WaitlistButton({ eventId, isLoggedIn }: Props) {
  const router = useRouter();
  const [state, setState] = useState<{ on: boolean; position: number; waiting: number; status: string | null }>({ on: false, position: 0, waiting: 0, status: null });
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/events/${eventId}/waitlist`)
      .then(r => r.json())
      .then(d => setState({ on: !!d.on_waitlist, position: d.position ?? 0, waiting: d.waiting_count ?? 0, status: d.my_status ?? null }))
      .catch(() => {});
  }, [eventId, isLoggedIn]);

  async function join() {
    if (!isLoggedIn) { router.push(`/sign-in?redirect=/events/${eventId}`); return; }
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/events/${eventId}/waitlist`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      // Refetch to get position
      const r2 = await fetch(`/api/events/${eventId}/waitlist`);
      const d2 = await r2.json();
      setState({ on: true, position: d2.position ?? 0, waiting: d2.waiting_count ?? 0, status: d2.my_status ?? "waiting" });
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function leave() {
    if (!confirm("Leave the waitlist? Your spot will go to the next person in line.")) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/events/${eventId}/waitlist`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setState({ on: false, position: 0, waiting: Math.max(0, state.waiting - 1), status: null });
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (state.on) {
    if (state.status === "notified") {
      return (
        <div style={{ background: "#E4EEF8", border: "2px solid #1E4A7A", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#1E4A7A", letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconBell size={14} color="#1E4A7A" /> A SPOT MAY BE OPEN
          </div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#1E4A7A", marginTop: "6px" }}>
            Try registering now — spots can fill quickly.
          </div>
        </div>
      );
    }
    return (
      <div style={{ background: "#FFF3D6", border: "2px solid #7A5A0F", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontFamily: R, fontSize: "13px", color: "#7A5A0F", letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <IconCheck size={14} color="#7A5A0F" /> YOU'RE ON THE WAITLIST
        </div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", marginTop: "6px" }}>
          Position #{state.position || "—"} of {state.waiting}. We'll notify you if a spot opens.
        </div>
        <button onClick={leave} disabled={busy}
          style={{ marginTop: "8px", fontFamily: R, fontSize: "10px", color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
          {busy ? "…" : "LEAVE WAITLIST"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ background: "#FFE8EC", border: "2px solid #CC3344", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontFamily: R, fontSize: "13px", color: "#CC3344", letterSpacing: "1.5px" }}>EVENT IS FULL</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#8A1E27", marginTop: "4px" }}>
          Join the waitlist — we'll notify you if a spot opens up.{state.waiting > 0 && ` (${state.waiting} in line)`}
        </div>
      </div>
      {error && <div style={{ fontFamily: B, fontSize: "12px", color: "#CC3344", textAlign: "center" }}>{error}</div>}
      <button onClick={join} disabled={busy}
        style={{ fontFamily: R, fontSize: "12px", color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "12px 20px", cursor: busy ? "not-allowed" : "pointer", letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
        <IconBell size={12} color="#ffffff" /> {busy ? "JOINING…" : "JOIN WAITLIST"}
      </button>
    </div>
  );
}
