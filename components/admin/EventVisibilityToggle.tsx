"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "@/components/shared/Icons";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default function EventVisibilityToggle({ id, initialHidden }: { id: string; initialHidden: boolean }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const onClick = async () => {
    if (busy) return;
    const next = !hidden;
    setBusy(true);
    setHidden(next);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_hidden: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      startTransition(() => router.refresh());
    } catch {
      setHidden(!next);
      alert("Failed to update visibility. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const label = hidden ? "SHOW" : "HIDE";
  const bg = hidden ? "#FFF3E0" : "#E8F0E4";
  const fg = hidden ? "#B45309" : "#1B3A2D";
  const Icon = hidden ? IconEyeOff : IconEye;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={hidden ? "Currently hidden from public — click to show" : "Currently visible — click to hide"}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontFamily: SG, fontSize: "11px", fontWeight: 700,
        color: fg, background: bg,
        border: "1.5px solid transparent", borderRadius: "10px",
        padding: "9px 14px", letterSpacing: "1.2px",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.6 : 1,
        transition: "all 0.15s",
      }}
    >
      <Icon size={12} color={fg} /> {label}
    </button>
  );
}
