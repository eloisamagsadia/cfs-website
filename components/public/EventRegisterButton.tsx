"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTicket, IconCheck, IconClock } from "@/components/shared/Icons";
import { calculateFee, type PaymentMethod } from "@/lib/paymongo";
import WaitlistButton from "@/components/public/WaitlistButton";
import { evaluateRegistrationGate } from "@/lib/event-registration";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

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
  const [method] = useState<PaymentMethod>("qrph");
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
        // Legacy paid event without tiers — create ticket(s) then pay
        setLoading(true); setError("");
        try {
          const ticketRes = await fetch("/api/events/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: event.id, tier_id: null }),
          });
          const ticketData = await ticketRes.json();
          if (!ticketRes.ok) throw new Error(ticketData.error);
          // No-tier events are always solo (bundle_size lives on tiers now).
          const legacyTotal = Math.round(event.price + calcFee(event.price));
          const ref = ticketData.bundle_id ?? ticketData.ticket.id;
          const payRes = await fetch("/api/paymongo/create-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: legacyTotal,
              description: `${event.title} — Ticket`,
              type: "ticket",
              reference_id: ref,
              success_url: `${window.location.origin}/payment/success?type=ticket&ref=${ref}`,
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
      // Paid tier — create ticket(s) with pending_payment status, then redirect to checkout
      setLoading(true); setError("");
      try {
        const ticketRes = await fetch("/api/events/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: event.id, tier_id: tier.id }),
        });
        const ticketData = await ticketRes.json();
        if (!ticketRes.ok) throw new Error(ticketData.error);
        // tier.price is the FLAT bundle total — do not multiply by bundle_size.
        const qty = Number(tier.bundle_size ?? 1) || 1;
        const tierTotal = Math.round(tier.price + calcFee(tier.price));
        const ref = ticketData.bundle_id ?? ticketData.ticket.id;
        const payRes = await fetch("/api/paymongo/create-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: tierTotal,
            description: qty > 1 ? `${event.title} — ${tier.name} (${qty} tickets)` : `${event.title} — ${tier.name}`,
            type: "ticket",
            reference_id: ref,
            success_url: `${window.location.origin}/payment/success?type=ticket&ref=${ref}`,
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

  // Registration closed (manual toggle or auto cutoff) — hard block, even for tiers.
  // "ended" and "cancelled" fall through to other panels rendered elsewhere.
  const gate = evaluateRegistrationGate(event);
  if (!gate.open && (gate.reason === "manual" || gate.reason === "auto")) {
    return (
      <div style={{ background: "#FFE8EC", border: "2px solid #CC3344", borderRadius: 10, padding: 16, textAlign: "center" as const, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontFamily: R, fontSize: 14, color: "#CC3344", letterSpacing: 1.5 }}>REGISTRATION CLOSED</div>
        <div style={{ fontFamily: B, fontSize: 12, color: "#8A1E27", lineHeight: 1.5 }}>
          {gate.reason === "manual"
            ? "Sign-ups are locked. Reach out via support if you think this is a mistake."
            : "The registration window has ended. Follow us for future events!"}
        </div>
      </div>
    );
  }

  if (isFull && !hasTiers) {
    return <WaitlistButton eventId={event.id} isLoggedIn={isLoggedIn} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Scheduled close countdown */}
      {gate.closes_at && (() => {
        const ms = new Date(gate.closes_at).getTime() - Date.now();
        if (ms <= 0 || ms > 30 * 86400 * 1000) return null;   // only show within 30 days
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const label = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
        const soon = ms < 24 * 3600 * 1000;
        return (
          <div style={{ background: soon ? "#FFE8EC" : "#FFF3D6", border: `1.5px solid ${soon ? "#F1C0C6" : "#F0D889"}`, borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <IconClock size={13} color={soon ? "#8A1E27" : "#7A5A0F"} />
            <span style={{ fontFamily: B, fontSize: 12, color: soon ? "#8A1E27" : "#7A5A0F" }}>
              Registration closes in <strong>{label}</strong>
            </span>
          </div>
        );
      })()}

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
        // tier.price is the FLAT total for the whole bundle (bundle-ness lives on tier).
        // For events without tiers, event.price is a single-ticket price.
        const basePrice = selectedTier?.price > 0 ? selectedTier.price : (!hasTiers && event.price > 0) ? event.price : 0;
        if (!basePrice) return null;
        const qty = Math.max(1, Number(selectedTier?.bundle_size ?? 1) || 1);
        const fee   = calcFee(basePrice);
        const total = basePrice + fee;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {qty > 1 && (
              <div style={{ background: "#FFF9E5", border: "1.5px solid #F0D889", borderRadius: "10px", padding: "10px 14px", display: "flex", gap: "8px", alignItems: "center" }}>
                <IconTicket size={16} color="#7A5A0F" />
                <span style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", lineHeight: 1.5 }}>
                  <strong>Bundle tier</strong> — flat price includes {qty} tickets & {qty} QR codes to share.
                </span>
              </div>
            )}
            <div style={{ background: "#F0F7F0", border: "1.5px solid #B7D8B7", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ display: "inline-flex", flexShrink: 0, width: "28px", height: "28px", borderRadius: "6px", background: "#ffffff", border: "1px solid #DDE8DD", alignItems: "center", justifyContent: "center", fontFamily: B, fontSize: "10px", fontWeight: 700, color: "#1B3A2D", letterSpacing: "0.5px" }}>QR</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "1.5px" }}>PAY VIA QR PH</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", lineHeight: 1.5 }}>
                  You&apos;ll be redirected to PayMongo&apos;s secure checkout. Scan the QR code with <strong>GCash</strong>, <strong>Maya</strong>, or any Philippine bank app to pay.
                </div>
              </div>
            </div>
            <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>{qty > 1 ? `Bundle price (${qty} tickets)` : "Ticket price"}</span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>₱{fmt(basePrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>Processing fee <span style={{ fontSize: "10px" }}>(QR Ph)</span></span>
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
        // tier.price is the FLAT total; qty comes from the tier itself.
        const basePrice = selectedTier?.price > 0 ? selectedTier.price : (!hasTiers && event.price > 0) ? event.price : 0;
        const qty = Math.max(1, Number(selectedTier?.bundle_size ?? 1) || 1);
        const total = basePrice ? Math.round(basePrice + calcFee(basePrice)) : 0;
        const paidAndUnaccepted = basePrice > 0 && !termsAccepted;
        const disabled = loading || paidAndUnaccepted;
        const freeLabel = qty > 1 ? `RSVP FREE — ${qty} TICKETS ✦` : "RSVP FREE ✦";
        const paidLabel = qty > 1 ? `PAY ₱${fmt(total)} FOR ${qty} TICKETS →` : `PAY ₱${fmt(total)} →`;
        return (
          <button onClick={handleRegister} disabled={disabled}
            style={{ position: "relative", display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "8px" }} />
            <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "15px", background: loading ? "#E8F5E9" : "#1A8040", color: loading ? "#4A7C59" : "#ffffff", padding: "14px", border: "2px solid #1B3A2D", borderRadius: "8px", textAlign: "center", letterSpacing: "2px" }}>
              {loading ? "LOADING..." : !isLoggedIn ? "LOGIN TO REGISTER" : basePrice ? paidLabel : freeLabel}
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
