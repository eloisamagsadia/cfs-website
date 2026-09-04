"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconLock, IconUnlock, IconRotate } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const UNDO_WINDOW_MS = 8000;

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [undo, setUndo] = useState<{ prev: boolean; remaining: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoClosed = !initialClosed && !!initialClosesAt && new Date(initialClosesAt).getTime() <= Date.now();
  const effectivelyClosed = closed || autoClosed;

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
  }, []);

  async function apply(next: boolean, isUndo = false) {
    setBusy(true);
    const prev = closed;
    setClosed(next);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, registration_closed: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      startTransition(() => router.refresh());
      // Undo only when we just closed (going from open → closed by user action).
      if (!isUndo && next === true && prev === false) armUndo(prev);
      else clearUndo();
    } catch {
      setClosed(prev);
      alert("Failed to update registration status.");
    } finally {
      setBusy(false);
    }
  }

  function armUndo(prev: boolean) {
    clearUndo();
    setUndo({ prev, remaining: UNDO_WINDOW_MS });
    tickTimer.current = setInterval(() => {
      setUndo(u => u ? { ...u, remaining: Math.max(0, u.remaining - 250) } : null);
    }, 250);
    undoTimer.current = setTimeout(() => clearUndo(), UNDO_WINDOW_MS);
  }

  function clearUndo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    undoTimer.current = null; tickTimer.current = null;
    setUndo(null);
  }

  async function doUndo() {
    if (!undo) return;
    clearUndo();
    await apply(undo.prev, true);
  }

  function onToggleClick() {
    if (busy) return;
    // Closing needs confirmation. Reopening is safe → apply immediately.
    if (!effectivelyClosed) setConfirmOpen(true);
    else apply(false);
  }

  const label = effectivelyClosed ? "REOPEN REG" : "CLOSE REG";
  const bg = effectivelyClosed ? "#FFE8EC" : "#F2F7F2";
  const fg = effectivelyClosed ? "#8A1E27" : "#4A7C59";
  const Icon = effectivelyClosed ? IconUnlock : IconLock;
  const title = autoClosed
    ? "Auto-closed by scheduled cutoff. Click to manually open + clear the auto-close."
    : effectivelyClosed
      ? "Registration is manually closed. Click to reopen."
      : "Registration is open. Click to lock sign-ups.";

  return (
    <>
      <button type="button" onClick={onToggleClick} disabled={busy} title={title}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontFamily: SG, fontSize: 11, fontWeight: 700,
          color: fg, background: bg,
          border: "1.5px solid transparent", borderRadius: 10,
          padding: "9px 14px", letterSpacing: 1.2,
          cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
          transition: "all 0.15s",
        }}>
        <Icon size={12} color={fg} /> {label}
      </button>

      {/* Confirm-close modal */}
      {confirmOpen && (
        <div onClick={() => !busy && setConfirmOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 16, padding: 22, maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FFE8EC", border: "1px solid #F1C0C6", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconLock size={18} color="#8A1E27" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontFamily: R, fontSize: "1.05rem", color: "#8A1E27", letterSpacing: 2, margin: 0 }}>CLOSE REGISTRATION?</h2>
                <p style={{ fontFamily: B, fontSize: 12.5, color: "#5A7A60", margin: "6px 0 0", lineHeight: 1.55 }}>
                  Members won't be able to register for this event until you reopen it. Existing tickets stay valid. You'll have 8 seconds to undo right after.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmOpen(false)} disabled={busy}
                style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "10px 16px", cursor: "pointer", letterSpacing: 1.2 }}>
                CANCEL
              </button>
              <button onClick={async () => { setConfirmOpen(false); await apply(true); }} disabled={busy}
                style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "#8A1E27", border: "none", borderRadius: 10, padding: "10px 16px", cursor: busy ? "wait" : "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconLock size={11} color="#ffffff" /> CLOSE REGISTRATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo toast — bottom-right, with countdown bar */}
      {undo && (
        <div style={{
          position: "fixed", right: 20, bottom: 20, zIndex: 1100,
          background: "#1B3A2D", color: "#ffffff",
          borderRadius: 12, padding: "12px 14px 15px 16px",
          display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          fontFamily: B, fontSize: 13,
          minWidth: 280, overflow: "hidden" as const,
        }}>
          <IconLock size={14} color="#F0D889" />
          <span style={{ flex: 1 }}>Registration closed.</span>
          <button onClick={doUndo}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: 1.3, color: "#1B3A2D", background: "#F0D889", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <IconRotate size={10} color="#1B3A2D" /> UNDO
          </button>
          <div aria-hidden style={{
            position: "absolute", left: 0, bottom: 0, height: 3,
            background: "#F0D889",
            width: `${(undo.remaining / UNDO_WINDOW_MS) * 100}%`,
            transition: "width 250ms linear",
          }} />
        </div>
      )}
    </>
  );
}
