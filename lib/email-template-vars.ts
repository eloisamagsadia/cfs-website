// Documents which {{vars}} each template accepts, plus sample values
// used for the admin editor preview + test send. Keep in sync with
// lib/email.ts callers.

export type TemplateKey = "event_ticket" | "donation_receipt" | "order_confirmation" | "welcome";

export const TEMPLATE_META: Record<TemplateKey, { label: string; description: string; vars: { name: string; note: string; required?: boolean }[] }> = {
  event_ticket: {
    label: "Event Ticket",
    description: "Sent when a member's ticket becomes active (free registration or after PayMongo payment).",
    vars: [
      { name: "event_title",    note: "Event name",                             required: true },
      { name: "date_str",       note: "Long date, e.g. 'Sunday, October 12, 2026'", required: true },
      { name: "time_str",       note: "e.g. '4:00 PM'",                          required: true },
      { name: "event_location", note: "Venue / address",                        required: true },
      { name: "ticket_code",    note: "Short ticket ID shown to the door crew", required: true },
      { name: "qr_src",         note: "URL of the QR image (do not remove — the QR embed depends on this)", required: true },
      { name: "gcal_url",       note: "Google Calendar 'add to calendar' link" },
      { name: "tickets_url",    note: "Members tickets page URL" },
      { name: "site_url",       note: "coletfs.com" },
      { name: "banner_block",   note: "Pre-rendered banner (image or gradient). Remove to hide the banner." },
      { name: "invoice_block",  note: "Pre-rendered official-receipt block (empty for free tickets)." },
    ],
  },
  donation_receipt: {
    label: "Donation Receipt",
    description: "Sent after a donation successfully clears PayMongo.",
    vars: [
      { name: "ref_no",   note: "Short reference number",                required: true },
      { name: "amount",   note: "Formatted amount, e.g. '500.00'",       required: true },
      { name: "body_html", note: "Pre-rendered receipt body with barcode + line items. Editing the outer wrapper is safe; leave this variable in place." },
    ],
  },
  order_confirmation: {
    label: "Order Confirmation",
    description: "Sent when a shop order is confirmed by an admin.",
    vars: [
      { name: "order_short_id", note: "Short order ID",                          required: true },
      { name: "items_table",    note: "Pre-rendered <table> of line items + total" },
      { name: "ship_name",      note: "Recipient full name" },
      { name: "ship_line1",     note: "Street + barangay" },
      { name: "ship_line2",     note: "City, province, ZIP" },
      { name: "total",          note: "Order total (formatted)" },
    ],
  },
  welcome: {
    label: "Welcome",
    description: "Reserved for a member-welcome flow. Edit freely; wiring to send is not required until you decide to activate it.",
    vars: [
      { name: "member_name", note: "Display name" },
      { name: "site_url",    note: "coletfs.com" },
    ],
  },
};

// Sample values used by the admin preview and test-send so admins can
// see rendered output without needing a real event / order / donation.
export const SAMPLE_VARS: Record<TemplateKey, Record<string, string>> = {
  event_ticket: {
    event_title:    "Sample Meet-Up — Sunset Session",
    date_str:       "Sunday, October 12, 2026",
    time_str:       "4:00 PM",
    event_location: "Sample Venue, Quezon City",
    ticket_code:    "CFS-SAMPLE",
    qr_src:         "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=SAMPLE-TICKET",
    gcal_url:       "https://calendar.google.com/",
    tickets_url:    "https://coletfs.com/members/tickets",
    site_url:       "https://coletfs.com",
    banner_block:   `<div style="height:12px;background:linear-gradient(90deg,#1A8040 0%,#F5C82A 55%,#E88C4A 100%);border-top-left-radius:16px;border-top-right-radius:16px;"></div>`,
    invoice_block:  "",
  },
  donation_receipt: {
    ref_no:      "DONATE-SAMPLE",
    amount:      "500.00",
    date_str:    "09/01/2026",
    time_str:    "03:45 PM",
    message:     "",
    barcode_svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="56" style="display:block;margin:0 auto;"><rect x="0" y="0" width="2" height="56" fill="#111"/><rect x="4" y="0" width="1" height="56" fill="#111"/><rect x="8" y="0" width="3" height="56" fill="#111"/><rect x="14" y="0" width="1" height="56" fill="#111"/><rect x="18" y="0" width="2" height="56" fill="#111"/><rect x="24" y="0" width="1" height="56" fill="#111"/><rect x="28" y="0" width="3" height="56" fill="#111"/><rect x="34" y="0" width="2" height="56" fill="#111"/><rect x="38" y="0" width="1" height="56" fill="#111"/><rect x="42" y="0" width="3" height="56" fill="#111"/></svg>`,
    body_html: "",
  },
  order_confirmation: {
    order_short_id: "ORDER123",
    items_table:    `<table style="width:100%;border-collapse:collapse;border-top:1px solid #2C4820;"><tr><td style="padding:8px 0;color:#F0EAD6;">Sample Item × 1</td><td style="padding:8px 0;color:#F07228;text-align:right;">₱500</td></tr><tr><td colspan="2" style="border-top:1px solid #2C4820;padding-top:8px;"></td></tr><tr><td style="color:#F0EAD6;font-weight:bold;padding:4px 0;">TOTAL</td><td style="color:#F07228;font-weight:bold;text-align:right;">₱500</td></tr></table>`,
    ship_name:      "Sample Fan",
    ship_line1:     "123 Sample Street, Sample Barangay",
    ship_line2:     "Quezon City, Metro Manila 1100",
    total:          "500",
  },
  welcome: {
    member_name: "Sample Fan",
    site_url:    "https://coletfs.com",
  },
};
