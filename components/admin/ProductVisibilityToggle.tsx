"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconEye, IconEyeOff } from "@/components/shared/Icons";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Mirrors EventVisibilityToggle, but products track visibility with
// is_active (true = listed) rather than is_hidden, so the flag is
// inverted on the way in and out.
export default function ProductVisibilityToggle({ id, initialActive }: { id: string; initialActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const onClick = async () => {
    if (busy) return;
    const next = !active;
    setBusy(true);
    setActive(next);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(next ? "Product is now visible in the shop." : "Product hidden from the shop.");
      startTransition(() => router.refresh());
    } catch {
      setActive(!next);
      toast.error("Failed to update visibility. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const label = active ? "HIDE" : "SHOW";
  const bg = active ? "#E8F0E4" : "#FFF3E0";
  const fg = active ? "#1B3A2D" : "#B45309";
  const Icon = active ? IconEye : IconEyeOff;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={active ? "Currently visible — click to hide from the public shop" : "Currently hidden from public — click to show"}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
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
