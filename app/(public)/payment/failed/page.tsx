"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = { paper: "#FAFDF9", forest: "#1B3A2D", border: "#DDE8DD", red: "#CC3344", muted: "#7A8E7A" };

const RETRY_HREF: Record<string, string> = {
  ticket: "/events",
  donation: "/donate",
  order: "/shop",
};

function FailedContent() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? "order";
  const retryHref = RETRY_HREF[type] ?? "/";

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>😞</div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.red + "18", border: `1px solid ${C.red}40`, borderRadius: "20px", padding: "5px 14px", marginBottom: "24px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.red, letterSpacing: "1px" }}>PAYMENT FAILED</span>
        </div>

        <h1 style={{ fontFamily: S, fontSize: "2rem", color: C.forest, marginBottom: "12px", lineHeight: 1.15 }}>Something went wrong</h1>
        <p style={{ fontFamily: B, fontSize: "14px", color: C.muted, lineHeight: 1.8, marginBottom: "32px" }}>
          Your payment could not be processed. No charges were made. Please try again or use a different payment method.
        </p>

        <button
          onClick={() => router.push(retryHref)}
          style={{ width: "100%", fontFamily: SG, fontSize: "14px", fontWeight: 700, background: C.forest, color: "#ffffff", border: "none", borderRadius: "10px", padding: "14px", cursor: "pointer", letterSpacing: "1.5px", marginBottom: "12px" }}
        >
          TRY AGAIN
        </button>

        <a
          href="mailto:support@coletfs.com"
          style={{ display: "block", fontFamily: B, fontSize: "13px", color: C.muted, textAlign: "center", textDecoration: "none", padding: "12px", border: `1px solid ${C.border}`, borderRadius: "10px" }}
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense>
      <FailedContent />
    </Suspense>
  );
}
