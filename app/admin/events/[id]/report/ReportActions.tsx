"use client";
import { IconDownload } from "@/components/shared/Icons";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type CsvRow = {
  ticket_number: string;
  name: string;
  tier: string;
  tier_price: number;
  status: string;
  payment_status: string;
  amount_paid: number;
  purchased_at: string;
  checked_in_at: string | null;
};

type Summary = {
  gross: number;
  fees: number;
  net: number;
  subtotalRevenue: number;
  soldCount: number;
  checkedIn: number;
  noShow: number;
  capacity: number | null;
  dateStr: string;
  location: string;
};

type TierRow = { id: string; name: string; price: number; sold: number; revenue: number; capacity: number | null };

function esc(v: any) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function download(filename: string, content: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function ReportActions({
  eventTitle, csvRows, summary, tierRows,
}: {
  eventTitle: string;
  csvRows: CsvRow[];
  summary: Summary;
  tierRows: TierRow[];
}) {
  function makeCsv() {
    const lines: string[] = [];

    // Summary block
    lines.push("EVENT SUMMARY REPORT");
    lines.push(`Event,${esc(eventTitle)}`);
    lines.push(`Date,${esc(summary.dateStr)}`);
    lines.push(`Location,${esc(summary.location)}`);
    lines.push(`Capacity,${summary.capacity ?? "n/a"}`);
    lines.push(`Tickets sold,${summary.soldCount}`);
    lines.push(`Checked in,${summary.checkedIn}`);
    lines.push(`No-show,${summary.noShow}`);
    lines.push(`Gross collected,${summary.gross.toFixed(2)}`);
    lines.push(`PayMongo fees,${summary.fees.toFixed(2)}`);
    lines.push(`Net to CFS,${summary.net.toFixed(2)}`);
    lines.push("");

    // Tiers
    lines.push("TIER BREAKDOWN");
    lines.push("Tier,Price,Sold,Revenue");
    for (const t of tierRows) {
      lines.push(`${esc(t.name)},${t.price.toFixed(2)},${t.sold},${t.revenue.toFixed(2)}`);
    }
    lines.push("");

    // Attendees
    lines.push("ATTENDEE LIST");
    lines.push("Ticket #,Name,Tier,Tier Price,Status,Payment Status,Amount Paid,Purchased At,Checked In At");
    for (const r of csvRows) {
      lines.push([
        esc(r.ticket_number),
        esc(r.name),
        esc(r.tier),
        r.tier_price.toFixed(2),
        esc(r.status),
        esc(r.payment_status),
        r.amount_paid.toFixed(2),
        esc(r.purchased_at),
        esc(r.checked_in_at ?? ""),
      ].join(","));
    }

    return lines.join("\n");
  }

  function onDownloadCsv() {
    const safeTitle = eventTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");
    download(`cfs-report-${safeTitle}.csv`, makeCsv());
  }

  function onPrint() { window.print(); }

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px",
    borderRadius: "10px", padding: "9px 14px", cursor: "pointer",
    transition: "all 0.15s",
  };

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <button onClick={onDownloadCsv}
        style={{ ...btnBase, color: "#1B3A2D", background: "#ffffff", border: "1.5px solid #DDE8DD" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#1A8040"; e.currentTarget.style.color = "#1A8040"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#DDE8DD"; e.currentTarget.style.color = "#1B3A2D"; }}>
        <IconDownload size={12} color="currentColor" /> DOWNLOAD CSV
      </button>
      <button onClick={onPrint}
        style={{ ...btnBase, color: "#ffffff", background: "#1A8040", border: "1.5px solid #1A8040", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#156530"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#1A8040"; e.currentTarget.style.transform = "translateY(0)"; }}>
        PRINT / SAVE PDF
      </button>
    </div>
  );
}
