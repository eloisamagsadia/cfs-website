"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTicket, IconCheck } from "@/components/shared/Icons";
import { PAYMENT_METHOD_RATES, PAYMENT_METHOD_LABELS, calculateFee, type PaymentMethod } from "@/lib/paymongo";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const PAYMENT_METHODS: PaymentMethod[] = ["gcash", "maya", "grab_pay", "card"];
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
  const [method, setMethod] = useState<PaymentMethod>("gcash");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();
  const calcFee = (base: number) => calculateFee(base, method);

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
    const requiresPayment = (!hasTiers && event.price > 0) || (tier && tier.price > 0);
    if (requiresPayment && !termsAccepted) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }

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
              metadata: { payment_method: method },
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
            metadata: { payment_method: method },
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
        <div style={{ background: "#E8F5E9", border: "2px solid #1A8040", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
          <div style={{ marginBottom: "8px" }}><IconTicket size={28} color="#1A8040" /></div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#1A8040", letterSpacing: "1.5px", marginBottom: "4px" }}>YOU'RE REGISTERED!</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>Your ticket is ready</div>
        </div>
        {ticketId && (
          <button onClick={() => router.push(`/members/tickets/${ticketId}`)}
            style={{ width: "100%", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
            VIEW MY TICKET →
          </button>
        )}
      </div>
    );
  }

  if (isFull && !hasTiers) {
    return (
      <div style={{ background: "#FFE8EC", border: "2px solid #CC3344", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
        <div style={{ fontFamily: R, fontSize: "14px", color: "#CC3344", letterSpacing: "1.5px" }}>EVENT IS FULL</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Early access badge */}
      {sponsorDate && isSponsor && memberDate && now < memberDate && (
        <div style={{ background: "#1A804020", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>✦</span>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#1A8040" }}>Sponsor early access active · General opens {memberDate.toLocaleDateString("en-PH", { month: "long", day: "numeric" })}</span>
        </div>
      )}

      {/* Not open yet */}
      {isNotOpenYet && (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#5A7A60", letterSpacing: "1px" }}>REGISTRATION OPENS</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", marginTop: "4px" }}>{sponsorDate?.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</div>
        </div>
      )}

      {/* Early access only — show to non-sponsors */}
      {isEarlyAccessOnly && (
        <div style={{ background: "#1A804010", border: "1.5px solid #1A804060", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", marginBottom: "6px" }}>✦</div>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "1px", marginBottom: "4px" }}>SPONSOR EARLY ACCESS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>
            General registration opens {memberDate?.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      )}

      {/* Tier selection */}
      {hasTiers && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "4px" }}>SELECT TIER</div>
          {tiers.map(tier => {
            const isSoldOut = tier.slots_remaining !== null && tier.slots_remaining <= 0;
            const isSelected = selectedTier?.id === tier.id;
            return (
              <button key={tier.id} onClick={() => !isSoldOut && setSelectedTier(tier)} disabled={isSoldOut}
                style={{ background: isSelected ? tier.color + "20" : "#ffffff", border: `1.5px solid ${isSelected ? tier.color : "#DDE8DD"}`, borderRadius: "10px", padding: "12px 14px", cursor: isSoldOut ? "not-allowed" : "pointer", textAlign: "left", opacity: isSoldOut ? 0.5 : 1, transition: "all 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tier.perks?.length ? "6px" : 0 }}>
                  <span style={{ fontFamily: R, fontSize: "13px", color: isSelected ? tier.color : "#1B3A2D", letterSpacing: "1px" }}>{tier.name}</span>
                  <span style={{ fontFamily: R, fontSize: "13px", color: tier.price > 0 ? "#1A8040" : "#1A8040" }}>
                    {tier.price > 0 ? `₱${Number(tier.price).toLocaleString()}` : "FREE"}
                  </span>
                </div>
                {tier.perks?.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {tier.perks.map((p: string) => (
                      <span key={p} style={{ fontFamily: B, fontSize: "9px", color: tier.color, background: tier.color + "20", borderRadius: "10px", padding: "1px 8px", display: "inline-flex", alignItems: "center", gap: "3px" }}><IconCheck size={7} color={tier.color} /> {p}</span>
                    ))}
                  </div>
                )}
                {isSoldOut && <div style={{ fontFamily: B, fontSize: "10px", color: "#CC3344", marginTop: "4px" }}>SOLD OUT</div>}
                {!isSoldOut && tier.slots_remaining !== null && (
                  <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", marginTop: "4px" }}>{tier.slots_remaining} slots left</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "6px" }}>PAYMENT METHOD</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "6px" }}>
                {PAYMENT_METHODS.map(m => {
                  const { rate, fixed } = PAYMENT_METHOD_RATES[m];
                  const feeText = `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1)}%${fixed ? ` +₱${fixed}` : ""}`;
                  const selected = method === m;
                  return (
                    <button key={m} onClick={() => setMethod(m)} type="button"
                      style={{ fontFamily: B, fontSize: "11px", fontWeight: 600, background: selected ? "#1A8040" : "#F7FAF5", color: selected ? "#FFFFFF" : "#1B3A2D", border: `1.5px solid ${selected ? "#1A8040" : "#DDE8DD"}`, borderRadius: "6px", padding: "6px 8px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                      <span>{PAYMENT_METHOD_LABELS[m]}</span>
                      <span style={{ fontSize: "9px", color: selected ? "rgba(255,255,255,0.85)" : "#5A7A60" }}>{feeText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>Ticket price</span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>₱{fmt(basePrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>Processing fee <span style={{ fontSize: "10px" }}>({PAYMENT_METHOD_LABELS[method]})</span></span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#CC3344" }}>+₱{fmt(fee)}</span>
              </div>
              <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "1px" }}>TOTAL</span>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>₱{fmt(total)}</span>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#1A8040", marginTop: "2px", flexShrink: 0 }} />
              <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", lineHeight: 1.5 }}>
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#1A8040", textDecoration: "underline" }}>Terms &amp; Conditions</a> and understand tickets are non-refundable except where required by law.
              </span>
            </label>
          </div>
        );
      })()}

      {!isNotOpenYet && !isEarlyAccessOnly && (() => {
        const basePrice = selectedTier?.price > 0 ? selectedTier.price : (!hasTiers && event.price > 0) ? event.price : 0;
        const total = basePrice ? Math.round(basePrice + calcFee(basePrice)) : 0;
        const paidAndUnaccepted = basePrice > 0 && !termsAccepted;
        const disabled = loading || paidAndUnaccepted;
        return (
          <button onClick={handleRegister} disabled={disabled}
            style={{ position: "relative", display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "8px" }} />
            <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "15px", background: loading ? "#E8F5E9" : "#1A8040", color: loading ? "#4A7C59" : "#ffffff", padding: "14px", border: "2px solid #1B3A2D", borderRadius: "8px", textAlign: "center", letterSpacing: "2px" }}>
              {loading ? "LOADING..." : !isLoggedIn ? "LOGIN TO REGISTER" : basePrice ? `PAY ₱${fmt(total)} →` : "RSVP FREE ✦"}
            </span>
          </button>
        );
      })()}
      {!isLoggedIn && (
        <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", textAlign: "center" }}>Login required to register</p>
      )}
    </div>
  );
}
