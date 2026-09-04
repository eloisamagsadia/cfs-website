"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default function EventRegistrationToggle({
  id, initialClosed, initialClosesAt,
}: {
  id: string;
  initialClosed: boolean;
  initialClosesAt: string | null;
}) {
  const router = useRouter();
  const [closed, setClosed] = useState(initialClosed);
  const [busy, setBusy]     = useState(false);
  const [, startTransition] = useTransition();

  // Auto-close in effect if not manually closed but the cutoff has passed
  const autoClosed = !initialClosed && !!initialClosesAt && new Date(initialClosesAt).getTime() <= Date.now();
  const effectivelyClosed = closed || autoClosed;

  const onClick = async () => {
    if (busy) return;
    const next = !closed;
    setBusy(true); setClosed(next);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, registration_closed: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      startTransition(() => router.refresh());
    } catch {
      setClosed(!next);
      alert("Failed to update registration status.");
    } finally {
      setBusy(false);
    }
  };

  const label = effectivelyClosed ? "REOPEN REG" : "CLOSE REG";
  const bg = effectivelyClosed ? "#FFE8EC" : "#F2F7F2";
  const fg = effectivelyClosed ? "#8A1E27" : "#4A7C59";
  const title = autoClosed
    ? "Auto-closed by scheduled cutoff. Clicking will manually open + clear the auto-close."
    : effectivelyClosed
      ? "Registration is manually closed. Click to reopen."
      : "Registration is open. Click to lock sign-ups.";

  return (
    <button type="button" onClick={onClick} disabled={busy} title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontFamily: SG, fontSize: 11, fontWeight: 700,
        color: fg, background: bg,
        border: "1.5px solid transparent", borderRadius: 10,
        padding: "9px 14px", letterSpacing: 1.2,
        cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
        transition: "all 0.15s",
      }}>
      {effectivelyClosed ? "🔓" : "🔒"} {label}
    </button>
  );
}
