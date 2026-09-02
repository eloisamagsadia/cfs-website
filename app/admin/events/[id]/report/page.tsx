import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import ReportActions from "./ReportActions";

export const metadata: Metadata = { title: "Event Summary Report" };
export const revalidate = 30;


const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const S  = "var(--font-dm-serif,'DM Serif Display',Georgia,serif)";

function money(n: number) {
  return `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function EventReportPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();

  const [{ data: event }, { data: tiers }, { data: tickets }] = await Promise.all([
    (admin as any).from("events").select("*").eq("id", params.id).maybeSingle(),
    (admin as any).from("event_tiers").select("*").eq("event_id", params.id).order("price", { ascending: false }),
    (admin as any).from("event_tickets")
      .select("id, ticket_number, status, payment_status, tier_id, checked_in_at, created_at, profiles:user_id(display_name, avatar_url), event_tiers:tier_id(name, price)")
      .eq("event_id", params.id)
      .order("created_at", { ascending: true })
      .limit(2000),
  ]);

  if (!event) notFound();

  const tickList: any[] = tickets ?? [];
  const tierList: any[] = tiers ?? [];

  // Payment transactions for gross-paid lookup
  const ticketIds = tickList.map(t => t.id);
  const { data: txns } = ticketIds.length > 0 ? await (admin as any)
    .from("payment_transactions")
    .select("reference_id, amount, status")
    .eq("type", "ticket")
    .in("reference_id", ticketIds)
    : { data: [] };
  const paidByTicket: Record<string, number> = {};
  for (const t of (txns ?? [])) {
    if (t.status === "paid") paidByTicket[t.reference_id] = Number(t.amount);
  }

  // Aggregates
  const soldCount     = tickList.filter(t => ["active", "used"].includes(t.status)).length;
  const activeCount   = tickList.filter(t => t.status === "active").length;
  const usedCount     = tickList.filter(t => t.status === "used").length;
  const cancelledCount = tickList.filter(t => t.status === "cancelled").length;
  const pendingCount  = tickList.filter(t => t.status === "pending_payment").length;
  const checkedIn     = tickList.filter(t => !!t.checked_in_at).length;
  const noShow        = tickList.filter(t => t.status === "active" && !t.checked_in_at).length;
  const noShowRate    = soldCount > 0 ? ((soldCount - checkedIn) / soldCount) * 100 : 0;

  // Financials
  let gross = 0;
  let subtotalRevenue = 0;
  for (const t of tickList) {
    if (["active", "used"].includes(t.status)) {
      const paid = paidByTicket[t.id] ?? 0;
      gross += paid;
      subtotalRevenue += Number(t.event_tiers?.price ?? event.price ?? 0);
    }
  }
  const fees = Math.max(0, gross - subtotalRevenue);
  const net = subtotalRevenue;

  // Per-tier breakdown
  const tierRows = tierList.map(tier => {
    const rows = tickList.filter(t => t.tier_id === tier.id && ["active", "used"].includes(t.status));
    const sold = rows.length;
    const rev  = sold * Number(tier.price);
    return { id: tier.id, name: tier.name, price: Number(tier.price), sold, revenue: rev, capacity: tier.capacity };
  });
  const untieredSold = tickList.filter(t => !t.tier_id && ["active", "used"].includes(t.status)).length;
  if (untieredSold > 0) {
    tierRows.push({
      id: "__untiered__",
      name: "General Admission",
      price: Number(event.price ?? 0),
      sold: untieredSold,
      revenue: untieredSold * Number(event.price ?? 0),
      capacity: null,
    });
  }

  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  const timeStr = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
  const generatedAt = new Date().toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });

  // Attendee rows for CSV
  const csvRows = tickList.map(t => ({
    ticket_number: t.ticket_number,
    name: t.profiles?.display_name ?? "Member",
    tier: t.event_tiers?.name ?? "General Admission",
    tier_price: Number(t.event_tiers?.price ?? event.price ?? 0),
    status: t.status,
    payment_status: t.payment_status,
    amount_paid: paidByTicket[t.id] ?? 0,
    purchased_at: t.created_at,
    checked_in_at: t.checked_in_at,
  }));

  return (
    <div style={{ background: "#F7FAF5", minHeight: "100vh", padding: "24px 16px" }}>
      <style>{`
        @media print {
          @page { margin: 12mm; size: A4; }
          html, body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .report-page { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
          .report-section { break-inside: avoid; page-break-inside: avoid; }
          .report-table tr { break-inside: avoid; page-break-inside: avoid; }
          a { color: #1B3A2D !important; text-decoration: none !important; }
        }
        .report-table th, .report-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #E4EDE4; font-family: ${B}; font-size: 12px; color: #1B3A2D; }
        .report-table th { font-family: ${SG}; font-size: 10px; font-weight: 700; color: #5A7A60; letter-spacing: 1.5px; text-transform: uppercase; background: #F7FAF5; }
        .report-table tr:last-child td { border-bottom: none; }
      `}</style>

      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        {/* Toolbar (hidden on print) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <Link href={`/admin/events/${event.id}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.5px" }}>
            ← BACK TO EVENT
          </Link>
          <ReportActions
            eventTitle={event.title}
            csvRows={csvRows}
            summary={{ gross, fees, net, subtotalRevenue, soldCount, checkedIn, noShow, capacity: event.capacity, dateStr, location: event.location ?? "" }}
            tierRows={tierRows}
          />
        </div>

        {/* Report page */}
        <div className="report-page" style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "40px 44px", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 6px 20px rgba(15,42,30,0.06)" }}>

          {/* Header */}
          <div className="report-section" style={{ borderBottom: "2px solid #1B3A2D", paddingBottom: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontFamily: S, fontSize: "22px", fontWeight: 700, letterSpacing: "4px", color: "#1B3A2D" }}>CFS</div>
                <div style={{ fontFamily: SG, fontSize: "10px", color: "#5A7A60", letterSpacing: "2.5px", marginTop: "2px" }}>COLET FAN SUPORTA</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: SG, fontSize: "10px", color: "#5A7A60", letterSpacing: "2px" }}>EVENT SUMMARY REPORT</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "4px" }}>Generated {generatedAt}</div>
              </div>
            </div>
            <h1 style={{ fontFamily: S, fontSize: "30px", lineHeight: 1.15, color: "#1B3A2D", margin: "20px 0 6px" }}>{event.title}</h1>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>
              {dateStr} · {timeStr}
              {event.location && ` · ${event.location}`}
            </div>
          </div>

          {/* Overview stats */}
          <div className="report-section" style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>AT A GLANCE</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {[
                { label: "TICKETS SOLD",  value: `${soldCount}${event.capacity ? ` / ${event.capacity}` : ""}` },
                { label: "CHECKED IN",    value: `${checkedIn}` },
                { label: "NO-SHOW RATE",  value: `${noShowRate.toFixed(1)}%` },
                { label: "GROSS",         value: money(gross) },
              ].map(s => (
                <div key={s.label} style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "10px", padding: "12px 14px" }}>
                  <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.5px", marginBottom: "6px" }}>{s.label}</div>
                  <div style={{ fontFamily: R, fontSize: "18px", color: "#1B3A2D", letterSpacing: "0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket sales */}
          <div className="report-section" style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>TICKET SALES</div>
            <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff", border: "1px solid #E4EDE4", borderRadius: "8px", overflow: "hidden" }}>
              <tbody>
                <tr><td>Total tickets issued</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{tickList.length}</td></tr>
                <tr><td>Active (unused)</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{activeCount}</td></tr>
                <tr><td>Used (checked in)</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{usedCount}</td></tr>
                <tr><td>Pending payment</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{pendingCount}</td></tr>
                <tr><td>Cancelled</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{cancelledCount}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Tiers */}
          {tierRows.length > 0 && (
            <div className="report-section" style={{ marginBottom: "28px" }}>
              <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>TIER BREAKDOWN</div>
              <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff", border: "1px solid #E4EDE4", borderRadius: "8px", overflow: "hidden" }}>
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Sold</th>
                    <th style={{ textAlign: "right" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {tierRows.map(t => (
                    <tr key={t.id}>
                      <td>{t.name}{t.capacity ? ` (cap ${t.capacity})` : ""}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>{money(t.price)}</td>
                      <td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{t.sold}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", color: "#1A8040" }}>{money(t.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financials */}
          <div className="report-section" style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>FINANCIAL SUMMARY</div>
            <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff", border: "1px solid #E4EDE4", borderRadius: "8px", overflow: "hidden" }}>
              <tbody>
                <tr>
                  <td>Gross collected (from buyers)</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>{money(gross)}</td>
                </tr>
                <tr>
                  <td>PayMongo processing fees</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", color: "#CC3344" }}>−{money(fees)}</td>
                </tr>
                <tr style={{ background: "#F7FAF5" }}>
                  <td style={{ fontWeight: 700 }}>Net to CFS</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1A8040", fontSize: "14px" }}>{money(net)}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", marginTop: "8px", lineHeight: 1.5 }}>
              Gross = total buyers paid via PayMongo. Fees = amount buyers paid on top of the ticket price to cover the payment processor. Net = the base ticket price × sold.
            </div>
          </div>

          {/* Check-in stats */}
          <div className="report-section" style={{ marginBottom: "28px" }}>
            <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>CHECK-IN STATS</div>
            <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff", border: "1px solid #E4EDE4", borderRadius: "8px", overflow: "hidden" }}>
              <tbody>
                <tr><td>Attended (checked in)</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700, color: "#1A8040" }}>{checkedIn}</td></tr>
                <tr><td>No-show (paid but didn't check in)</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{noShow}</td></tr>
                <tr><td>No-show rate</td><td style={{ textAlign: "right", fontFamily: SG, fontWeight: 700 }}>{noShowRate.toFixed(1)}%</td></tr>
              </tbody>
            </table>
          </div>

          {/* Attendee list */}
          <div className="report-section" style={{ marginBottom: "8px" }}>
            <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>
              ATTENDEE LIST ({tickList.length})
            </div>
            {tickList.length === 0 ? (
              <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", textAlign: "center", padding: "20px 0", border: "1px dashed #DDE8DD", borderRadius: "8px" }}>
                No tickets to list.
              </div>
            ) : (
              <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff", border: "1px solid #E4EDE4", borderRadius: "8px", overflow: "hidden" }}>
                <thead>
                  <tr>
                    <th style={{ width: "36px" }}>#</th>
                    <th>Attendee</th>
                    <th>Ticket #</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Checked in</th>
                  </tr>
                </thead>
                <tbody>
                  {tickList.map((t, i) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "monospace", color: "#7A8E7A" }}>{i + 1}</td>
                      <td>{t.profiles?.display_name ?? "Member"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{t.ticket_number}</td>
                      <td>{t.event_tiers?.name ?? "General Admission"}</td>
                      <td style={{
                        fontFamily: SG, fontWeight: 700, fontSize: "10px", letterSpacing: "1px",
                        color: t.status === "used" ? "#1A8040" : t.status === "cancelled" ? "#CC3344" : t.status === "pending_payment" ? "#B45309" : "#1B3A2D",
                      }}>{t.status.toUpperCase().replace("_", " ")}</td>
                      <td style={{ textAlign: "right", fontFamily: B, fontSize: "11px", color: t.checked_in_at ? "#1A8040" : "#B7CDB7" }}>
                        {t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="report-section" style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #DDE8DD", textAlign: "center", fontFamily: B, fontSize: "10px", color: "#7A8E7A", letterSpacing: "0.5px" }}>
            coletfs.com · @coletfansuporta · Report generated {generatedAt}
          </div>
        </div>
      </div>
    </div>
  );
}
