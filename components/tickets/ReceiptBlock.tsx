"use client";
import QRCode from "react-qr-code";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

export type Receipt = {
  buyer: { name: string | null; email: string | null };
  ticket: {
    id: string;
    ticket_number: string;
    status: string;
    payment_status?: string;
    bundle_id: string | null;
    bundle_size: number;
    bundle_ticket_numbers: string[];
    created_at: string;
    is_comp: boolean;
    comp_note: string | null;
  };
  event: { title: string | null; date: string | null; location: string | null };
  tier: { name: string; unit_price: number };
  payment: {
    amount_paid: number;
    subtotal: number;
    fee: number;
    currency: string;
    status: string;
    paid_at: string | null;
    method: string | null;
    reference: string;
  } | null;
};

export default function ReceiptBlock({ receipt, showPrintButton = true }: { receipt: Receipt; showPrintButton?: boolean }) {
  const refCode = (receipt.payment?.reference ?? receipt.ticket.ticket_number ?? receipt.ticket.id).slice(0, 24).toUpperCase();
  const purchasedAt = receipt.ticket.created_at
    ? new Date(receipt.ticket.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })
    : "—";
  const eventWhen = receipt.event.date
    ? new Date(receipt.event.date).toLocaleString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })
    : "TBA";
  const qrValue = typeof window !== "undefined"
    ? `${window.location.origin}/verify/${receipt.ticket.ticket_number}`
    : `/verify/${receipt.ticket.ticket_number}`;

  return (
    <>
      <div id="cfs-receipt-block" style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "20px 22px", boxShadow: "0 4px 12px rgba(15,42,30,0.04)" }}>
        {/* Business header */}
        <div style={{ textAlign: "center", paddingBottom: "10px", borderBottom: "2px solid #1B3A2D" }}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#1A8040", letterSpacing: "2.5px" }}>+ CFS +</div>
          <div style={{ fontFamily: S, fontSize: "15px", color: "#1B3A2D", marginTop: "2px" }}>Colet Fan Suporta</div>
          <div style={{ fontFamily: B, fontSize: "9.5px", color: "#5A7A60", marginTop: "2px", letterSpacing: "0.5px" }}>Bini Colet Fansupport Community of the Philippines</div>
          <div style={{ fontFamily: B, fontSize: "9px", color: "#7A8E7A", marginTop: "4px" }}>coletfs.com</div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", padding: "12px 0 10px", borderBottom: "1px dashed #DDE8DD" }}>
          <div style={{ fontFamily: S, fontSize: "13px", letterSpacing: "4px", color: "#1B3A2D", fontWeight: 700 }}>OFFICIAL RECEIPT</div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10.5px", color: "#7A8E7A", marginTop: "4px", letterSpacing: "1px" }}>REF #{refCode}</div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#7A8E7A", marginTop: "2px" }}>Issued {purchasedAt}</div>
        </div>

        {/* Buyer info */}
        <div style={{ padding: "10px 0", borderBottom: "1px dashed #DDE8DD" }}>
          <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "3px" }}>BILLED TO</div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "12px", color: "#1B3A2D" }}>{receipt.buyer?.name ?? "—"}</div>
          {receipt.buyer?.email && <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10.5px", color: "#5A7A60", marginTop: "1px" }}>{receipt.buyer.email}</div>}
        </div>

        {/* Event block */}
        <div style={{ padding: "10px 0", borderBottom: "1px dashed #DDE8DD" }}>
          <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "3px" }}>EVENT</div>
          <div style={{ fontFamily: S, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.35 }}>{receipt.event.title ?? "Event"}</div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10.5px", color: "#5A7A60", marginTop: "4px" }}>When: {eventWhen}</div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10.5px", color: "#5A7A60", marginTop: "1px" }}>Where: {receipt.event.location ?? "TBA"}</div>
        </div>

        {/* Ticket numbers */}
        <div style={{ padding: "10px 0", borderBottom: "1px dashed #DDE8DD" }}>
          <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "6px" }}>
            {receipt.ticket.bundle_size > 1 ? `${receipt.ticket.bundle_size} TICKETS ISSUED` : "TICKET NUMBER"}
          </div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: "#1B3A2D", lineHeight: 1.7 }}>
            {(receipt.ticket.bundle_ticket_numbers ?? [receipt.ticket.ticket_number]).map((n: string, i: number) => (
              <div key={n ?? i}>
                <span style={{ color: "#7A8E7A", marginRight: "6px" }}>{String(i + 1).padStart(2, "0")}.</span>
                <span style={{ letterSpacing: "1px" }}>{n ?? "—"}</span>
                {n === receipt.ticket.ticket_number && receipt.ticket.bundle_size > 1 && (
                  <span style={{ fontFamily: B, fontSize: "9px", color: "#1A8040", marginLeft: "8px", letterSpacing: "1px" }}>← THIS PAGE</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Line items + totals */}
        <table style={{ width: "100%", marginTop: "10px", fontFamily: "'Courier New',monospace", color: "#1B3A2D", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", fontSize: "12px" }}>{receipt.tier.name}{receipt.ticket.bundle_size > 1 ? ` × ${receipt.ticket.bundle_size}` : ""}</td>
              <td style={{ textAlign: "right", padding: "4px 0", fontSize: "12px" }}>
                {receipt.tier.unit_price > 0
                  ? `₱${(receipt.tier.unit_price * receipt.ticket.bundle_size).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                  : "FREE"}
              </td>
            </tr>
            {receipt.payment && receipt.payment.fee > 0 && (
              <tr>
                <td style={{ padding: "2px 0", fontSize: "11px", color: "#7A8E7A" }}>Payment processing fee</td>
                <td style={{ textAlign: "right", padding: "2px 0", fontSize: "11px", color: "#7A8E7A" }}>
                  ₱{receipt.payment.fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            <tr><td colSpan={2} style={{ borderTop: "1px dashed #DDE8DD", paddingTop: "8px" }}></td></tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "1px" }}>{receipt.payment ? "TOTAL PAID" : "TOTAL"}</td>
              <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px", color: "#1A8040" }}>
                {receipt.payment
                  ? `₱${receipt.payment.amount_paid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                  : (receipt.tier.unit_price > 0
                      ? `₱${(receipt.tier.unit_price * receipt.ticket.bundle_size).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                      : "FREE")}
              </td>
            </tr>
            {receipt.payment && (
              <>
                <tr>
                  <td style={{ paddingTop: "10px", color: "#7A8E7A", fontSize: "10px", letterSpacing: "1.5px" }}>METHOD</td>
                  <td style={{ textAlign: "right", paddingTop: "10px", color: "#7A8E7A", fontSize: "10px", letterSpacing: "1px" }}>
                    {(receipt.payment.method ?? "ONLINE").toString().toUpperCase().replace(/_/g, " ")}
                  </td>
                </tr>
                {receipt.payment.paid_at && (
                  <tr>
                    <td style={{ color: "#7A8E7A", fontSize: "10px", letterSpacing: "1.5px" }}>PAID ON</td>
                    <td style={{ textAlign: "right", color: "#7A8E7A", fontSize: "10px" }}>
                      {new Date(receipt.payment.paid_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })}
                    </td>
                  </tr>
                )}
              </>
            )}
            {receipt.ticket.is_comp && (
              <tr>
                <td colSpan={2} style={{ paddingTop: "10px", textAlign: "center" }}>
                  <span style={{ display: "inline-block", background: "#FFF3D6", border: "1px solid #F0D889", color: "#7A5A0F", fontSize: "10px", fontFamily: "'Courier New',monospace", letterSpacing: "1px", padding: "3px 10px", borderRadius: "999px" }}>
                    COMPLIMENTARY · ISSUED BY CFS ADMIN
                  </span>
                </td>
              </tr>
            )}
            {receipt.ticket.is_comp && receipt.ticket.comp_note && (
              <tr>
                <td colSpan={2} style={{ paddingTop: "6px", textAlign: "center", fontFamily: B, fontSize: "10px", color: "#7A5A0F", fontStyle: "italic" }}>
                  &ldquo;{receipt.ticket.comp_note}&rdquo;
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Verify QR */}
        <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #DDE8DD", display: "flex", gap: "12px", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "6px", border: "1px solid #DDE8DD", borderRadius: "6px" }}>
            <QRCode value={qrValue} size={64} level="M" />
          </div>
          <div style={{ fontFamily: B, fontSize: "9.5px", color: "#5A7A60", lineHeight: 1.5, letterSpacing: "0.3px" }}>
            Scan to verify authenticity<br />
            <span style={{ fontFamily: "'Courier New',monospace", color: "#7A8E7A" }}>coletfs.com/verify</span>
          </div>
        </div>

        {/* Footer notices */}
        <div style={{ textAlign: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #DDE8DD", fontFamily: B, fontSize: "10px", color: "#7A8E7A", letterSpacing: "0.3px", lineHeight: 1.65 }}>
          <div style={{ color: "#5A7A60", fontWeight: 600, marginBottom: "4px" }}>All ticket sales are final and non-refundable.</div>
          Keep this receipt as proof of purchase. If you didn&apos;t receive an email confirmation, this page is your record.
          <div style={{ marginTop: "8px" }}>
            Need help? <a href="/support" style={{ color: "#1A8040", textDecoration: "none", fontWeight: 600 }}>Open a support ticket at coletfs.com/support</a>
          </div>
          <div style={{ marginTop: "4px" }}>
            or DM us on <a href="https://twitter.com/coletfansuporta" target="_blank" rel="noopener noreferrer" style={{ color: "#1A8040", textDecoration: "none" }}>@coletfansuporta</a>
          </div>
        </div>
      </div>

      {showPrintButton && (
        <div className="cfs-no-print" style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
          <button
            onClick={() => window.print()}
            style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1.5px", background: "#1A8040", color: "#fff", border: "none", borderRadius: "24px", padding: "10px 22px", cursor: "pointer" }}
          >
            PRINT / SAVE AS PDF
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #cfs-receipt-block, #cfs-receipt-block * { visibility: visible !important; }
          #cfs-receipt-block {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .cfs-no-print { display: none !important; }
        }
      ` }} />
    </>
  );
}
