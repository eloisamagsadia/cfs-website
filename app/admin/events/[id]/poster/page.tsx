"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const ACCENTS = [
  { label: "GREEN",   bg: "#1B3A2D", ink: "#F7FAF5", chip: "#F0D889" },
  { label: "CREAM",   bg: "#FAF6EE", ink: "#1B3A2D", chip: "#1A8040" },
  { label: "SUNRISE", bg: "#B78A1F", ink: "#FFFDF4", chip: "#FFFDF4" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
}
function siteOrigin() {
  if (typeof window === "undefined") return "https://coletfansuporta.com";
  return window.location.origin;
}

export default function EventPosterPage() {
  const params = useParams();
  const id     = String(params?.id ?? "");
  const [event, setEvent]   = useState<any>(null);
  const [error, setError]   = useState("");
  const [accent, setAccent] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [showPrice, setShowPrice]   = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/events?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setEvent(d.event ?? d); })
      .catch(e => setError(e.message));
  }, [id]);

  if (error)  return <div style={{ padding: 48, textAlign: "center", fontFamily: B, color: "#CC3344" }}>{error}</div>;
  if (!event) return <div style={{ padding: 48, textAlign: "center", fontFamily: SG, letterSpacing: 2, color: "#7A8E7A" }}>LOADING…</div>;

  const a = ACCENTS[accent];
  const url = `${siteOrigin()}/events/${event.id}`;
  const isFree = !event.price || Number(event.price) === 0;

  return (
    <>
      <style>{`
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .poster-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 24px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" }}>
        <Link href={`/admin/events/${id}`} style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: 1.2 }}>← BACK TO EVENT</Link>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3 }}>THEME</span>
          {ACCENTS.map((x, i) => (
            <button key={i} onClick={() => setAccent(i)}
              style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: accent === i ? "#ffffff" : "#1B3A2D", background: accent === i ? "#1A8040" : "#ffffff", border: "1.5px solid " + (accent === i ? "#1A8040" : "#DDE8DD"), borderRadius: 999, padding: "5px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
              {x.label}
            </button>
          ))}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: B, fontSize: 12, color: "#5A7A60" }}>
            <input type="checkbox" checked={showBanner} onChange={e => setShowBanner(e.target.checked)} /> Banner
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: B, fontSize: 12, color: "#5A7A60" }}>
            <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} /> Price
          </label>
          <button onClick={() => window.print()}
            style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", letterSpacing: 1.3 }}>
            🖨 PRINT / SAVE PDF
          </button>
        </div>
      </div>

      {/* Poster (A4 portrait, 210×297 mm) */}
      <div className="poster-page" style={{
        width: "210mm", minHeight: "297mm",
        margin: "24px auto", background: a.bg, color: a.ink,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" as const,
      }}>

        {/* Green stripe accent along top */}
        <div style={{ height: 8, background: "linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%)" }} />

        {/* Wordmark */}
        <div style={{ padding: "24mm 20mm 8mm", textAlign: "center" as const }}>
          <div style={{ fontFamily: SG, fontSize: 12, fontWeight: 700, color: a.ink, letterSpacing: 4, opacity: 0.75 }}>COLET FAN SUPORTA · PRESENTS</div>
        </div>

        {/* Banner image */}
        {showBanner && event.banner_url && (
          <div style={{ margin: "0 20mm 8mm", borderRadius: 6, overflow: "hidden", border: `2px solid ${a.chip}40` }}>
            <img src={event.banner_url} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}

        {/* Title */}
        <div style={{ padding: "0 20mm", textAlign: "center" as const }}>
          <h1 style={{ fontFamily: R, fontSize: "42px", lineHeight: 1.05, letterSpacing: 3, margin: 0, color: a.ink }}>
            {event.title}
          </h1>
        </div>

        {/* Divider */}
        <div style={{ height: 2, background: a.chip, margin: "10mm 40mm", opacity: 0.9 }} />

        {/* Meta grid */}
        <div style={{ padding: "0 20mm", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm 12mm", textAlign: "left" as const }}>
          <div>
            <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.75, marginBottom: 4 }}>DATE</div>
            <div style={{ fontFamily: R, fontSize: 16, letterSpacing: 1.2 }}>{fmtDate(event.date)}</div>
          </div>
          <div>
            <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.75, marginBottom: 4 }}>TIME</div>
            <div style={{ fontFamily: R, fontSize: 16, letterSpacing: 1.2 }}>{fmtTime(event.date)}</div>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.75, marginBottom: 4 }}>LOCATION</div>
            <div style={{ fontFamily: R, fontSize: 16, letterSpacing: 1.2 }}>{event.location ?? "TBA"}</div>
          </div>
          {showPrice && (
            <div>
              <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.75, marginBottom: 4 }}>ENTRY</div>
              <div style={{ fontFamily: R, fontSize: 16, letterSpacing: 1.2 }}>{isFree ? "FREE" : `₱${Number(event.price).toLocaleString("en-PH")}`}</div>
            </div>
          )}
          {event.capacity && (
            <div>
              <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.75, marginBottom: 4 }}>CAPACITY</div>
              <div style={{ fontFamily: R, fontSize: 16, letterSpacing: 1.2 }}>{event.capacity}</div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ padding: "10mm 20mm 0", textAlign: "center" as const }}>
            <p style={{ fontFamily: B, fontSize: 13, lineHeight: 1.6, color: a.ink, opacity: 0.9, margin: 0, maxWidth: "160mm", marginLeft: "auto", marginRight: "auto" }}>
              {event.description.length > 260 ? event.description.slice(0, 260) + "…" : event.description}
            </p>
          </div>
        )}

        {/* Spacer pushes the QR block to the bottom */}
        <div style={{ flex: 1 }} />

        {/* QR + CTA */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10mm", padding: "10mm 20mm 20mm", alignItems: "center" }}>
          <div style={{ background: "#ffffff", padding: 12, borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
            <QRCode value={url} size={140} bgColor="#ffffff" fgColor="#1B3A2D" />
          </div>
          <div>
            <div style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: a.chip, letterSpacing: 2.5, marginBottom: 6 }}>SCAN TO REGISTER</div>
            <div style={{ fontFamily: R, fontSize: 20, letterSpacing: 2, color: a.ink }}>coletfansuporta.com</div>
            <div style={{ fontFamily: B, fontSize: 11, color: a.ink, opacity: 0.7, marginTop: 4, wordBreak: "break-all" as const }}>{url}</div>
          </div>
        </div>

        {/* Bottom green stripe accent */}
        <div style={{ height: 8, background: "linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%)" }} />
      </div>
    </>
  );
}
