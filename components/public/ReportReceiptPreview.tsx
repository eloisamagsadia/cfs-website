"use client";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { IconLink } from "@/components/shared/Icons";

const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Receipt = { file_url: string; file_name: string };

function isPdf(r: Receipt) {
  return r.file_name.toLowerCase().endsWith(".pdf") || r.file_url.toLowerCase().includes(".pdf");
}

export default function ReportReceiptPreview({ receipts }: { receipts: Receipt[] }) {
  const [active, setActive] = useState<Receipt | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close]);

  if (!receipts.length) return null;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
        {receipts.map((r, i) => (
          <button key={i} onClick={() => setActive(r)}
            style={{
              fontFamily: B, fontSize: "10px", color: "#4A7C59",
              background: "#E8F0E4", border: "1px solid #DDE8DD",
              borderRadius: "4px", padding: "2px 7px",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px",
            }}>
            <IconLink size={10} color="#4A7C59" /> {receipts.length > 1 ? `Receipt ${i + 1}` : "Receipt"}
          </button>
        ))}
      </div>

      {active && createPortal(
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "14px", overflow: "hidden",
              width: "100%", maxWidth: "860px", maxHeight: "90vh",
              display: "flex", flexDirection: "column",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #DDE8DD", flexShrink: 0 }}>
              <span style={{ fontFamily: SG, fontSize: "12px", fontWeight: 600, color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <IconLink size={12} color="#1B3A2D" style={{ flexShrink: 0 }} /> {active.file_name}
              </span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "12px" }}>
                <a href={active.file_url} target="_blank" rel="noopener noreferrer" download={active.file_name}
                  style={{ fontFamily: SG, fontSize: "11px", color: "#4A7C59", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "5px 12px", textDecoration: "none" }}>
                  Download
                </a>
                <button onClick={close}
                  style={{ background: "#F2F7F2", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", fontSize: "16px", color: "#1B3A2D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", background: "#F2F7F2", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
              {isPdf(active) ? (
                <iframe
                  src={active.file_url}
                  style={{ width: "100%", height: "75vh", border: "none" }}
                  title={active.file_name}
                />
              ) : (
                <img
                  src={active.file_url}
                  alt={active.file_name}
                  style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", display: "block" }}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
