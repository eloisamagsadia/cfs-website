"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface EventRegisterButtonProps {
  event: any;
  isLoggedIn: boolean;
  isRegistered: boolean;
  isFull: boolean;
}

export default function EventRegisterButton({ event, isLoggedIn, isRegistered, isFull }: EventRegisterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(isRegistered);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRegister() {
    if (!isLoggedIn) { router.push(`/login?redirect=/events/${event.id}`); return; }
    if (event.price > 0) {
      // Paid event — go to PayMongo
      setLoading(true);
      try {
        const res = await fetch("/api/paymongo/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "registration", referenceId: event.id,
            amount: event.price,
            description: `CFS Event: ${event.title}`,
          }),
        });
        const { checkoutUrl, error: err } = await res.json();
        if (err) throw new Error(err);
        window.location.href = checkoutUrl;
      } catch (e: any) {
        setError(e.message ?? "Payment error. Please try again.");
        setLoading(false);
      }
      return;
    }

    // Free event — direct RSVP
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRegistered(true);
    } catch (e: any) {
      setError(e.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎫</div>
        <div style={{ fontFamily: R, fontSize: "14px", color: "#3CCE2A", letterSpacing: "1.5px", marginBottom: "4px" }}>YOU'RE REGISTERED!</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>Check My Events for your ticket</div>
      </div>
    );
  }

  if (isFull) {
    return (
      <div style={{ background: "#3D0A18", border: "2px solid #F04060", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
        <div style={{ fontFamily: R, fontSize: "14px", color: "#F04060", letterSpacing: "1.5px" }}>EVENT IS FULL</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78", marginTop: "4px" }}>No more spots available</div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ background: "#3D0A18", border: "1.5px solid #F04060", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#F04060", marginBottom: "12px" }}>
          {error}
        </div>
      )}
      <button onClick={handleRegister} disabled={loading} style={{ position: "relative", display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: loading ? "not-allowed" : "pointer" }}>
        <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "8px" }}/>
        <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "15px", background: loading ? "#1A3D14" : event.price > 0 ? "#F07228" : "#3CCE2A", color: loading ? "#5A7A50" : "#080F06", padding: "14px", border: "2px solid #080F06", borderRadius: "8px", textAlign: "center", letterSpacing: "2px" }}>
          {loading ? "LOADING..." : !isLoggedIn ? "LOGIN TO REGISTER" : event.price > 0 ? `PAY ₱${Number(event.price).toLocaleString()} →` : "RSVP FREE ✦"}
        </span>
      </button>
      {!isLoggedIn && (
        <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", textAlign: "center", marginTop: "8px" }}>Login required to register</p>
      )}
    </div>
  );
}
