"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { IconTicket, IconHeart, IconPackage } from "@/components/shared/Icons";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = { paper: "#FAFDF9", forest: "#1B3A2D", sage: "#4A7C59", border: "#DDE8DD", green: "#1A8040", muted: "#7A8E7A" };

const CONFIG: Record<string, { icon: React.ReactNode; headline: string; body: string; cta: string; href: string }> = {
  ticket: {
    icon: <IconTicket size={40} color="#1A8040" />,
    headline: "You're going!",
    body: "Your ticket has been confirmed. Check your tickets in the members area.",
    cta: "VIEW MY TICKETS",
    href: "/members/events",
  },
  donation: {
    icon: <IconHeart size={40} color="#1A8040" />,
    headline: "Salamat! Thank you for supporting CFS!",
    body: "Your donation has been received. Every peso funds fan projects, events, and Colet. A receipt has been sent to your email.",
    cta: "VIEW MY DONATIONS",
    href: "/members/donations",
  },
  order: {
    icon: <IconPackage size={40} color="#1A8040" />,
    headline: "Order confirmed!",
    body: "Payment received. You'll get an email once your order ships. Track it in your orders.",
    cta: "VIEW MY ORDERS",
    href: "/members/orders",
  },
};

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? "order";
  const config = CONFIG[type] ?? CONFIG.order;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", borderRadius: "50%", background: C.green + "18", border: `2px solid ${C.green}40`, margin: "0 auto 20px" }}>{config.icon}</div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.green + "18", border: `1px solid ${C.green}40`, borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.green, letterSpacing: "1px" }}>PAYMENT SUCCESSFUL</span>
        </div>

        <h1 style={{ fontFamily: S, fontSize: "2rem", color: C.forest, marginBottom: "12px", lineHeight: 1.15 }}>{config.headline}</h1>
        <p style={{ fontFamily: B, fontSize: "14px", color: C.muted, lineHeight: 1.8, marginBottom: "32px" }}>{config.body}</p>

        <button
          onClick={() => router.push(config.href)}
          style={{ width: "100%", fontFamily: SG, fontSize: "14px", fontWeight: 700, background: C.forest, color: "#ffffff", border: "none", borderRadius: "10px", padding: "14px", cursor: "pointer", letterSpacing: "1.5px", marginBottom: "12px" }}
        >
          {config.cta}
        </button>

        <button
          onClick={() => router.push("/")}
          style={{ width: "100%", fontFamily: B, fontSize: "13px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", cursor: "pointer" }}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
