"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const C  = { paper: "#FAFDF9", forest: "#1B3A2D", sage: "#4A7C59", border: "#DDE8DD", green: "#3CCE2A", muted: "#7A8E7A" };

const CTA: Record<string, { label: string; href: string }> = {
  donation: { label: "VIEW MY DONATIONS", href: "/members/donations" },
  ticket:   { label: "VIEW MY TICKETS",   href: "/members/events" },
  order:    { label: "VIEW MY ORDERS",    href: "/members/orders" },
};

function ProcessingContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const type     = params.get("type") ?? "donation";
  const ref      = params.get("ref");
  const [status, setStatus]     = useState<"waiting" | "completed" | "failed">("waiting");
  const [amount, setAmount]     = useState<number | null>(null);
  const [dots, setDots]         = useState(".");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const openedRef = useRef(false);

  // Retrieve checkout URL from sessionStorage and open PayMongo in new tab
  useEffect(() => {
    const stored = sessionStorage.getItem("cfs_pending_checkout");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.ref === ref) {
          setCheckoutUrl(parsed.url);
          if (!openedRef.current) {
            openedRef.current = true;
            window.open(parsed.url, "_blank", "noopener");
          }
          sessionStorage.removeItem("cfs_pending_checkout");
        }
      } catch {}
    }
  }, [ref]);

  // Animated dots
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(id);
  }, []);

  // Poll payment status every 3 seconds
  useEffect(() => {
    if (!ref || status !== "waiting") return;
    const poll = async () => {
      try {
        const res  = await fetch(`/api/payment/status?type=${type}&ref=${ref}`);
        const data = await res.json();
        if (data.status === "completed") {
          setStatus("completed");
          if (data.amount) setAmount(Number(data.amount));
        } else if (data.status === "failed") {
          setStatus("failed");
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [ref, type, status]);

  const cta = CTA[type] ?? CTA.donation;

  if (status === "completed") {
    return (
      <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>💚</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.green + "18", border: `1px solid ${C.green}40`, borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.green, letterSpacing: "1px" }}>PAYMENT CONFIRMED</span>
          </div>
          <h1 style={{ fontFamily: S, fontSize: "2rem", color: C.forest, marginBottom: "8px" }}>
            {type === "donation" ? "Salamat! 💚" : type === "ticket" ? "You're going! 🎫" : "Order confirmed! 📦"}
          </h1>
          {amount && type === "donation" && (
            <p style={{ fontFamily: SG, fontSize: "1.4rem", fontWeight: 700, color: C.sage, marginBottom: "8px" }}>₱{Number(amount).toLocaleString()}</p>
          )}
          <p style={{ fontFamily: B, fontSize: "14px", color: C.muted, lineHeight: 1.8, marginBottom: "32px" }}>
            {type === "donation"
              ? "Your donation has been received. Every peso funds fan projects, events, and Colet. A receipt has been sent to your email."
              : type === "ticket"
              ? "Your ticket has been confirmed. Check your tickets in the members area."
              : "Payment received. You'll get an email once your order ships."}
          </p>
          <button onClick={() => router.push(cta.href)}
            style={{ width: "100%", fontFamily: SG, fontSize: "14px", fontWeight: 700, background: C.forest, color: "#ffffff", border: "none", borderRadius: "10px", padding: "14px", cursor: "pointer", letterSpacing: "1.5px", marginBottom: "12px" }}>
            {cta.label} →
          </button>
          <button onClick={() => router.push("/")}
            style={{ width: "100%", fontFamily: B, fontSize: "13px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", cursor: "pointer" }}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #F04060", borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }}>❌</div>
          <h1 style={{ fontFamily: S, fontSize: "2rem", color: "#C0122A", marginBottom: "12px" }}>Payment failed</h1>
          <p style={{ fontFamily: B, fontSize: "14px", color: C.muted, marginBottom: "32px" }}>Something went wrong. Please try again.</p>
          <button onClick={() => router.back()}
            style={{ width: "100%", fontFamily: SG, fontSize: "14px", fontWeight: 700, background: C.forest, color: "#ffffff", border: "none", borderRadius: "10px", padding: "14px", cursor: "pointer", letterSpacing: "1.5px" }}>
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        {/* Spinner */}
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: `4px solid ${C.green}20`, borderTopColor: C.green, margin: "0 auto 24px", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <h1 style={{ fontFamily: S, fontSize: "1.8rem", color: C.forest, marginBottom: "8px" }}>Waiting for payment{dots}</h1>
        <p style={{ fontFamily: B, fontSize: "14px", color: C.muted, lineHeight: 1.8, marginBottom: "28px" }}>
          Complete your payment in the PayMongo tab that opened.<br />
          This page will update automatically once confirmed.
        </p>

        {checkoutUrl && (
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: C.forest, color: "#ffffff", borderRadius: "10px", padding: "13px", textDecoration: "none", letterSpacing: "1px", marginBottom: "12px" }}>
            OPEN PAYMONGO →
          </a>
        )}

        <p style={{ fontFamily: B, fontSize: "11px", color: C.muted }}>
          Already paid but still waiting? It may take a few seconds to confirm.
        </p>
      </div>
    </div>
  );
}

export default function PaymentProcessingPage() {
  return (
    <Suspense>
      <ProcessingContent />
    </Suspense>
  );
}
