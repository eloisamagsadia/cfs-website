"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

type ScanResult = {
  success: boolean;
  ticket?: any;
  error?: string;
};

export default function CheckInPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  async function checkIn(ticket_id: string) {
    setLoading(true);
    const res = await fetch("/api/admin/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id }),
    });
    const data = await res.json();
    setResult({ success: res.ok, ticket: data.ticket, error: data.error });
    setLoading(false);
  }

  async function startScanner() {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          await scanner.stop();
          setScanning(false);
          try {
            const data = JSON.parse(text);
            await checkIn(data.ticket_id ?? data.id ?? text);
          } catch {
            await checkIn(text);
          }
        },
        () => {}
      );
      setScanning(true);
    } catch {
      alert("Camera access denied. Please use manual entry.");
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
    }
    setScanning(false);
  }

  useEffect(() => { return () => { stopScanner(); }; }, []);

  function reset() {
    setResult(null);
    setManualId("");
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>CHECK-IN</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Scan QR or enter ticket ID</p>
        </div>
        <Link href="/admin/events" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", textDecoration: "none" }}>← Events</Link>
      </div>

      {!result ? (
        <>
          {/* QR Scanner */}
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", overflow: "hidden" }}>
            <div id="qr-reader" style={{ width: "100%" }} />
            {!scanning && (
              <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "48px" }}>📷</div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>Camera not started</div>
              </div>
            )}
            <div style={{ padding: "16px", display: "flex", gap: "10px" }}>
              {!scanning ? (
                <button onClick={startScanner}
                  style={{ flex: 1, fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "8px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
                  START CAMERA
                </button>
              ) : (
                <button onClick={stopScanner}
                  style={{ flex: 1, fontFamily: R, fontSize: "12px", background: "transparent", color: "#F04060", border: "1.5px solid #F04060", borderRadius: "8px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
                  STOP CAMERA
                </button>
              )}
            </div>
          </div>

          {/* Manual entry */}
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "16px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#5A7A50", letterSpacing: "2px", marginBottom: "12px" }}>MANUAL ENTRY</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && manualId.trim()) checkIn(manualId.trim()); }}
                placeholder="Enter CFS-1000 or ticket UUID"
                style={{ flex: 1, background: "#243520", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none" }}
              />
              <button
                onClick={() => { if (manualId.trim()) checkIn(manualId.trim()); }}
                disabled={!manualId.trim() || loading}
                style={{ fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1px", opacity: (!manualId.trim() || loading) ? 0.5 : 1 }}>
                {loading ? "..." : "CHECK IN"}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Result */
        <div style={{ background: "#1A2614", border: `2px solid ${result.success ? "#3CCE2A" : "#F04060"}`, borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px" }}>{result.success ? "✅" : result.error?.includes("already") ? "⚠️" : "❌"}</div>
            <div style={{ fontFamily: R, fontSize: "1.2rem", color: result.success ? "#3CCE2A" : "#F04060", letterSpacing: "2px", marginTop: "8px" }}>
              {result.success ? "CHECKED IN!" : result.error?.includes("already") ? "ALREADY USED" : "INVALID TICKET"}
            </div>
            {result.error && <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78", marginTop: "6px" }}>{result.error}</div>}
          </div>

          {result.ticket && (
            <div style={{ background: "#0F1A0B", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1A3D14", border: "2px solid #2C4820", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {result.ticket.profiles?.avatar_url
                    ? <img src={result.ticket.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: R, fontSize: "18px", color: "#3CCE2A" }}>{(result.ticket.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontFamily: R, fontSize: "15px", color: "#F0EAD6" }}>{result.ticket.profiles?.display_name ?? result.ticket.qr_data?.member_name ?? "Member"}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{result.ticket.ticket_number}</div>
                </div>
              </div>
              {[
                { label: "Event", value: result.ticket.events?.title ?? result.ticket.qr_data?.event_name },
                { label: "Tier", value: result.ticket.event_tiers?.name ?? result.ticket.qr_data?.tier_name },
                { label: "Date", value: result.ticket.events?.date ? new Date(result.ticket.events.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50" }}>{label}</span>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#F0EAD6" }}>{value ?? "—"}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={reset}
            style={{ fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "8px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
            SCAN NEXT TICKET
          </button>
        </div>
      )}
    </div>
  );
}
