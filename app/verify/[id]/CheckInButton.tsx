"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@/components/shared/Icons";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const R  = "var(--font-righteous,'Righteous',sans-serif)";

export default function CheckInButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirming" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Check-in failed");
        setState("error");
        return;
      }
      setState("done");
      setTimeout(() => router.refresh(), 800);
    } catch (e: any) {
      setError(e.message ?? "Network error");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        <IconCheck size={18} color="#1A8040" />
        <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px" }}>CHECKED IN</span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <IconX size={16} color="#CC3344" />
          <span style={{ fontSize: "13px", color: "#CC3344" }}>{error}</span>
        </div>
        <button onClick={() => { setState("idle"); setError(""); }} style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", padding: "12px", borderRadius: "10px", border: "1.5px solid #DDE8DD", background: "#FFFFFF", color: "#1B3A2D", cursor: "pointer" }}>
          TRY AGAIN
        </button>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={submit} disabled={state !== "confirming"} style={{ flex: 2, fontFamily: SG, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", padding: "13px", borderRadius: "10px", border: "none", background: "#1A8040", color: "#FFFFFF", cursor: "pointer", boxShadow: "0 4px 12px rgba(26,128,64,0.25)" }}>
          CONFIRM CHECK-IN
        </button>
        <button onClick={() => setState("idle")} style={{ flex: 1, fontFamily: SG, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", padding: "13px", borderRadius: "10px", border: "1.5px solid #DDE8DD", background: "#FFFFFF", color: "#5A7A60", cursor: "pointer" }}>
          CANCEL
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState("confirming")}
      disabled={state === "loading"}
      style={{ width: "100%", fontFamily: SG, fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", padding: "14px", borderRadius: "10px", border: "none", background: "#1A8040", color: "#FFFFFF", cursor: "pointer", boxShadow: "0 4px 12px rgba(26,128,64,0.25)" }}
    >
      {state === "loading" ? "CHECKING IN…" : "MARK AS CHECKED IN"}
    </button>
  );
}
