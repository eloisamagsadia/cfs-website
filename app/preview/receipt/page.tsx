"use client";
import { useState } from "react";
import ReceiptBlock, { type Receipt } from "@/components/tickets/ReceiptBlock";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

const EVENT_ISO = "2026-09-14T19:00:00+08:00";
const PURCHASE_ISO = "2026-09-04T16:12:47+08:00";
const PAID_ISO     = "2026-09-04T16:14:22+08:00";

const SAMPLES: Record<string, Receipt> = {
  solo: {
    buyer: { name: "Sample Buyer", email: "sample.buyer@example.com" },
    ticket: {
      id: "00000000-0000-0000-0000-000000000001",
      ticket_number: "CFS-OPMN-A00042",
      status: "active",
      payment_status: "paid",
      bundle_id: null,
      bundle_size: 1,
      bundle_ticket_numbers: ["CFS-OPMN-A00042"],
      created_at: PURCHASE_ISO,
      is_comp: false,
      comp_note: null,
    },
    event: {
      title: "OPM Gig Night — BINI Colet Fan Support",
      date: EVENT_ISO,
      location: "The Nook, BGC, Taguig City",
    },
    tier: { name: "Regular", unit_price: 2000 },
    payment: {
      amount_paid: 2075,
      subtotal: 2000,
      fee: 75,
      currency: "PHP",
      status: "paid",
      paid_at: PAID_ISO,
      method: "gcash",
      reference: "BUNDLE-A1B2C3D4E5F6",
    },
  },
  bundle: {
    buyer: { name: "Bundle Buyer", email: "bundle.buyer@example.com" },
    ticket: {
      id: "00000000-0000-0000-0000-000000000002",
      ticket_number: "CFS-OPMN-B00013",
      status: "active",
      payment_status: "paid",
      bundle_id: "bundle-xyz",
      bundle_size: 4,
      bundle_ticket_numbers: [
        "CFS-OPMN-B00012",
        "CFS-OPMN-B00013",
        "CFS-OPMN-B00014",
        "CFS-OPMN-B00015",
      ],
      created_at: PURCHASE_ISO,
      is_comp: false,
      comp_note: null,
    },
    event: {
      title: "OPM Gig Night — BINI Colet Fan Support",
      date: EVENT_ISO,
      location: "The Nook, BGC, Taguig City",
    },
    tier: { name: "Bundle of Four", unit_price: 3750 },
    payment: {
      amount_paid: 15450,
      subtotal: 15000,
      fee: 450,
      currency: "PHP",
      status: "paid",
      paid_at: PAID_ISO,
      method: "card",
      reference: "BUNDLE-P9Q8R7S6T5U4",
    },
  },
  comp: {
    buyer: { name: "Sponsor Guest", email: "sponsor@example.com" },
    ticket: {
      id: "00000000-0000-0000-0000-000000000003",
      ticket_number: "CFS-OPMN-C00003",
      status: "active",
      payment_status: "paid",
      bundle_id: null,
      bundle_size: 1,
      bundle_ticket_numbers: ["CFS-OPMN-C00003"],
      created_at: PURCHASE_ISO,
      is_comp: true,
      comp_note: "Complimentary VIP for Gold Sponsor — thank you for supporting CFS!",
    },
    event: {
      title: "OPM Gig Night — BINI Colet Fan Support",
      date: EVENT_ISO,
      location: "The Nook, BGC, Taguig City",
    },
    tier: { name: "VIP", unit_price: 2500 },
    payment: null,
  },
};

export default function ReceiptPreviewPage() {
  const [variant, setVariant] = useState<"solo" | "bundle" | "comp">("bundle");
  const receipt = SAMPLES[variant];

  const tabBtn = (v: "solo" | "bundle" | "comp", label: string) => (
    <button
      key={v}
      onClick={() => setVariant(v)}
      className="cfs-no-print"
      style={{
        fontFamily: R,
        fontSize: "11px",
        letterSpacing: "1.5px",
        background: variant === v ? "#1B3A2D" : "#FFFFFF",
        color: variant === v ? "#FFFFFF" : "#1B3A2D",
        border: "1.5px solid #1B3A2D",
        borderRadius: "24px",
        padding: "8px 18px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#FAF6EE", padding: "32px 16px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* Header */}
        <div className="cfs-no-print" style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "2.5px" }}>+ PREVIEW +</div>
          <div style={{ fontFamily: S, fontSize: "20px", color: "#1B3A2D", marginTop: "4px" }}>Ticket Receipt Template</div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "4px" }}>Sample data — no real tickets used.</div>
        </div>

        {/* Variant tabs */}
        <div className="cfs-no-print" style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          {tabBtn("solo",   "SOLO PAID")}
          {tabBtn("bundle", "BUNDLE PAID")}
          {tabBtn("comp",   "COMP TICKET")}
        </div>

        {/* Receipt */}
        <ReceiptBlock receipt={receipt} />
      </div>
    </div>
  );
}
