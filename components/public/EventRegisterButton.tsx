"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const PAYMONGO_RATE  = 0.025; // GCash rate — most common PH payment method
const PAYMONGO_FIXED = 0;     // No fixed fee for e-wallets
function calcFee(base: number) { return (base * PAYMONGO_RATE) + PAYMONGO_FIXED; }
function fmt(n: number) { return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

interface EventRegisterButtonProps {
  event: any;
  isLoggedIn: boolean;
  isRegistered: boolean;
  isFull: boolean;
  tiers?: any[];
  existingTicketId?: string | null;
  isSponsor?: boolean;
}

export default function EventRegisterButton({ event, isLoggedIn, isRegistered, isFull, tiers = [], existingTicketId = null, isSponsor = false }: EventRegisterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(isRegistered);
  const [ticketId, setTicketId] = useState<string | null>(existingTicketId);
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<any>(tiers[0] ?? null);
  const router = useRouter();

  const hasTiers = tiers.length > 0;

  // Early access check
  const now = new Date(); // UTC internally — dates stored with +08:00 offset so comparisons are consistent
  const sponsorDate = event.sponsor_access_at ? new Date(event.sponsor_access_at) : null;
  const memberDate = event.member_access_at ? new Date(event.member_access_at) : null;
  const isEarlyAccessOnly = sponsorDate && memberDate && now >= sponsorDate && now < memberDate && !isSponsor;
  const isNotOpenYet = sponsorDate && now < sponsorDate;

  async function handleRegister() {
    if (!isLoggedIn) { router.push(`/sign-in?redirect=/events/${event.id}`); return; }

    const tier = selectedTier;

    if (!hasTiers) {
      if (event.price > 0) {
        // Legacy paid event without tiers — create ticket then pay
        setLoading(true); setError("");
        try {
          const ticketRes = await fetch("/api/events/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: event.id, tier_id: null }),
          });
          const ticketData = await ticketRes.json();
          if (!ticketRes.ok) throw new Error(ticketData.error);
          const legacyTotal = Math.round(event.price + calcFee(event.price));
          const payRes = await fetch("/api/paymongo/create-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: legacyTotal,
              description: `${event.title} — Ticket`,
              type: "ticket",
              reference_id: ticketData.ticket.id,
              success_url: `${window.location.origin}/payment/success?type=ticket&ref=${ticketData.ticket.id}`,
            }),
          });
          const payData = await payRes.json();
          if (!payRes.ok) throw new Error(payData.error);
          window.location.href = payData.checkout_url;
        } catch (e: any) {
          setError(e.message ?? "Could not initiate payment.");
          setLoading(false);
        }
        return;
      }
      // Free event — old register route
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
      return;
    }

    if (!tier) { setError("Please select a tier."); return; }

    if (tier.price > 0) {
      // Paid tier — create ticket with pending_payment status, then redirect to checkout
      setLoading(true); setError("");
      try {
        const ticketRes = await fetch("/api/events/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: event.id, tier_id: tier.id }),
        });
        const ticketData = await ticketRes.json();
        if (!ticketRes.ok) throw new Error(ticketData.error);
        const tierTotal = Math.round(tier.price + calcFee(tier.price));
        const payRes = await fetch("/api/paymongo/create-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: tierTotal,
            description: `${event.title} — ${tier.name}`,
            type: "ticket",
            reference_id: ticketData.ticket.id,
            success_url: `${window.location.origin}/payment/success?type=ticket&ref=${ticketData.ticket.id}`,
          }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error);
        window.location.href = payData.checkout_url;
      } catch (e: any) {
        setError(e.message ?? "Could not initiate payment.");
        setLoading(false);
      }
      return;
    }

    // Free tier — create ticket
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/events/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.id, tier_id: tier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTicketId(data.ticket.id);
      setRegistered(true);
    } catch (e: any) {
      setError(e.message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ background: "#E8F5E9", border: "2px solid #3CCE2A", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎫</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#3CCE2A", letterSpacing: "1.5px", marginBottom: "4px" }}>YOU'RE REGISTERED!</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>Your ticket is ready</div>
        </div>
        {ticketId && (
          <button onClick={() => router.push(`/members/tickets/${ticketId}`)}
            style={{ width: "100%", fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#1B3A2D", border: "none", borderRadius: "8px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
            VIEW MY TICKET →
          </button>
        )}
      </div>
    );
  }

  if (isFull && !hasTiers) {
    return (
      <div style={{ background: "#3D0A18", border: "2px solid #F04060", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
        <div style={{ fontFamily: R, fontSize: "14px", color: "#F04060", letterSpacing: "1.5px" }}>EVENT IS FULL</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Early access badge */}
      {sponsorDate && isSponsor && memberDate && now < memberDate && (
        <div style={{ background: "#B47FE320", border: "1.5px solid #B47FE3", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>✦</span>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#B47FE3" }}>Early access — open for sponsors {memberDate.toLocaleDateString("en-PH", { month: "long", day: "numeric" })}</span>
        </div>
      )}

      {/* Not open yet */}
      {isNotOpenYet && (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#5A7A50", letterSpacing: "1px" }}>REGISTRATION OPENS</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", marginTop: "4px" }}>{sponsorDate?.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</div>
        </div>
      )}

      {/* Early access only — show to non-sponsors */}
      {isEarlyAccessOnly && (
        <div style={{ background: "#B47FE310", border: "1.5px solid #B47FE360", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", marginBottom: "6px" }}>✦</div>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#B47FE3", letterSpacing: "1px", marginBottom: "4px" }}>SPONSOR EARLY ACCESS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>
            General registration opens {memberDate?.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      )}

      {/* Tier selection */}
      {hasTiers && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", letterSpacing: "2px", marginBottom: "4px" }}>SELECT TIER</div>
          {tiers.map(tier => {
            const isSoldOut = tier.slots_remaining !== null && tier.slots_remaining <= 0;
            const isSelected = selectedTier?.id === tier.id;
            return (
              <button key={tier.id} onClick={() => !isSoldOut && setSelectedTier(tier)} disabled={isSoldOut}
                style={{ background: isSelected ? tier.color + "20" : "#ffffff", border: `1.5px solid ${isSelected ? tier.color : "#DDE8DD"}`, borderRadius: "10px", padding: "12px 14px", cursor: isSoldOut ? "not-allowed" : "pointer", textAlign: "left", opacity: isSoldOut ? 0.5 : 1, transition: "all 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tier.perks?.length ? "6px" : 0 }}>
                  <span style={{ fontFamily: R, fontSize: "13px", color: isSelected ? tier.color : "#1B3A2D", letterSpacing: "1px" }}>{tier.name}</span>
                  <span style={{ fontFamily: R, fontSize: "13px", color: tier.price > 0 ? "#F07228" : "#3CCE2A" }}>
                    {tier.price > 0 ? `₱${Number(tier.price).toLocaleString()}` : "FREE"}
                  </span>
                </div>
                {tier.perks?.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {tier.perks.map((p: string) => (
                      <span key={p} style={{ fontFamily: B, fontSize: "9px", color: tier.color, background: tier.color + "20", borderRadius: "10px", padding: "1px 8px" }}>✓ {p}</span>
                    ))}
                  </div>
                )}
                {isSoldOut && <div style={{ fontFamily: B, fontSize: "10px", color: "#F04060", marginTop: "4px" }}>SOLD OUT</div>}
                {!isSoldOut && tier.slots_remaining !== null && (
                  <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", marginTop: "4px" }}>{tier.slots_remaining} slots left</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div style={{ background: "#3D0A18", border: "1.5px solid #F04060", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>
          {error}
        </div>
      )}

      {/* Fee breakdown for paid tiers */}
      {!isNotOpenYet && !isEarlyAccessOnly && (() => {
        const basePrice = selectedTier?.price > 0 ? selectedTier.price : (!hasTiers && event.price > 0) ? event.price : 0;
        if (!basePrice) return null;
        const fee   = calcFee(basePrice);
        const total = basePrice + fee;
        return (
          <div style={{ background: "#0F1A0B", border: "1px solid #2C4820", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>Ticket price</span>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#F0EAD6" }}>₱{fmt(basePrice)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>Processing fee <span style={{ fontSize: "10px" }}>(est. · GCash 2.5% · Maya 2% · Card 3.5%+₱15)</span></span>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#F04060" }}>+₱{fmt(fee)}</span>
            </div>
            <div style={{ borderTop: "1px solid #2C4820", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "1px" }}>TOTAL</span>
              <span style={{ fontFamily: R, fontSize: "13px", color: "#F07228" }}>₱{fmt(total)}</span>
            </div>
          </div>
        );
      })()}

      {!isNotOpenYet && !isEarlyAccessOnly && (() => {
        const basePrice = selectedTier?.price > 0 ? selectedTier.price : (!hasTiers && event.price > 0) ? event.price : 0;
        const total = basePrice ? Math.round(basePrice + calcFee(basePrice)) : 0;
        return (
          <button onClick={handleRegister} disabled={loading}
            style={{ position: "relative", display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: loading ? "not-allowed" : "pointer" }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "8px" }} />
            <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "15px", background: loading ? "#E8F5E9" : basePrice ? "#F07228" : "#3CCE2A", color: loading ? "#4A7C59" : "#080F06", padding: "14px", border: "2px solid #080F06", borderRadius: "8px", textAlign: "center", letterSpacing: "2px" }}>
              {loading ? "LOADING..." : !isLoggedIn ? "LOGIN TO REGISTER" : basePrice ? `PAY ₱${fmt(total)} →` : "RSVP FREE ✦"}
            </span>
          </button>
        );
      })()}
      {!isLoggedIn && (
        <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", textAlign: "center" }}>Login required to register</p>
      )}
    </div>
  );
}
