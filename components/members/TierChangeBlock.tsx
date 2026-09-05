"use client";
import { useEffect, useState } from "react";
import { IconRotate, IconLock, IconWarning, IconCheck } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Option {
  tier: { id: string; name: string; price: number; color?: string; slots_remaining: number | null };
  current_price: number;
  new_price: number;
  delta: number;
  direction: "upgrade" | "downgrade" | "same";
  eligible: boolean;
  reason: string | null;
}

interface Data {
  current: { tier: { id: string; name: string; price: number; color?: string } | null; ticket: any; event: any };
  options: Option[];
  hours_until_event: number;
}

const DIR_COLOR: Record<Option["direction"], { fg: string; bg: string; label: string }> = {
  upgrade:   { fg: "#156530", bg: "#E8F0E4", label: "UPGRADE" },
  downgrade: { fg: "#7A5A0F", bg: "#FFF3D6", label: "DOWNGRADE" },
  same:      { fg: "#5A7A60", bg: "#F2F7F2", label: "SWAP" },
};

function peso(n: number) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TierChangeBlock({ ticketId }: { ticketId: string }) {
  const [data, setData]     = useState<Data | null>(null);
  const [open, setOpen]     = useState(false);
  const [busy, setBusy]     = useState<string | null>(null);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [gateErr, setGateErr] = useState<string>("");

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ticketId]);

  async function load() {
    try {
      const r = await fetch(`/api/events/tier-change?ticket_id=${ticketId}`);
      const d = await r.json();
      if (!r.ok) { setGateErr(d.error ?? ""); return; }
      setData(d);
    } catch (e: any) { setGateErr(e.message); }
  }

  async function apply(o: Option) {
    if (!o.eligible) return;
    if (o.direction === "downgrade") {
      if (!confirm(`Downgrade to ${o.tier.name}? You'll receive a ${peso(Math.abs(o.delta))} refund to your original payment method within 3–5 business days after we process it.`)) return;
    } else if (o.direction === "same") {
      if (!confirm(`Switch to ${o.tier.name}? Same price, instant swap.`)) return;
    }
    setBusy(o.tier.id); setMsg(null);
    try {
      const r = await fetch("/api/events/tier-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, new_tier_id: o.tier.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      if (d.direction === "upgrade" && d.checkout_url) {
        window.location.href = d.checkout_url;
        return;
      }
      if (d.direction === "downgrade") {
        setMsg({ ok: true, text: `Downgrade request submitted. Refund of ${peso(d.refund_amount)} will be processed within 3–5 business days. We'll email you when it's done.` });
        setOpen(false);
        load();
        return;
      }
      if (d.swapped) {
        setMsg({ ok: true, text: `Swapped to ${o.tier.name}. Your new ticket is ready.` });
        setOpen(false);
        load();
        return;
      }
    } catch (e: any) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(null); }
  }

  if (gateErr) {
    // Locked (event too close / cancelled / etc.) — show a subtle disabled state so members know why
    return (
      <div style={{ background: "#F7FAF5", border: "1.5px dashed #DDE8DD", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
        <IconLock size={14} color="#7A8E7A" />
        <span style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A" }}>Tier change unavailable · {gateErr}</span>
      </div>
    );
  }
  if (!data || data.options.length === 0) return null;

  return (
    <div style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: R, fontSize: 12, color: "#1B3A2D", letterSpacing: 2 }}>CHANGE TIER</div>
          <div style={{ fontFamily: B, fontSize: 12, color: "#5A7A60", marginTop: 2 }}>
            Currently on <strong>{data.current.tier?.name ?? "—"}</strong> at {peso(Number(data.current.tier?.price ?? 0))}. Change is available until 12h before the event.
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)}
          style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: open ? "#5A7A60" : "#ffffff", background: open ? "#F2F7F2" : "#1A8040", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <IconRotate size={11} color={open ? "#5A7A60" : "#ffffff"} /> {open ? "CLOSE" : "CHANGE TIER"}
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.ok ? "#E8F0E4" : "#FFE8EC", border: `1.5px solid ${msg.ok ? "#B7D8B7" : "#F1C0C6"}`, borderRadius: 8, padding: "8px 12px", fontFamily: B, fontSize: 12, color: msg.ok ? "#156530" : "#8A1E27", display: "inline-flex", alignItems: "center", gap: 6 }}>
          {msg.ok ? <IconCheck size={12} color="#156530" /> : <IconWarning size={12} color="#8A1E27" />} {msg.text}
        </div>
      )}

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.options.map(o => {
            const meta = DIR_COLOR[o.direction];
            const disabled = !o.eligible || busy === o.tier.id;
            return (
              <div key={o.tier.id} style={{ background: disabled ? "#FBFDFB" : "#ffffff", border: `1px solid ${o.tier.color ?? "#DDE8DD"}30`, borderRadius: 10, padding: "10px 12px", display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 10, alignItems: "center", opacity: disabled && !o.eligible ? 0.6 : 1 }}>
                <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: meta.fg, background: meta.bg, borderRadius: 6, padding: "2px 7px", letterSpacing: 1.2 }}>{meta.label}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", fontWeight: 600 }}>{o.tier.name}</div>
                  <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>
                    {peso(o.new_price)}
                    {o.delta !== 0 && (
                      <span style={{ marginLeft: 6, color: o.delta > 0 ? "#8A1E27" : "#156530", fontWeight: 700 }}>
                        {o.delta > 0 ? `+${peso(o.delta)}` : `−${peso(Math.abs(o.delta))}`}
                      </span>
                    )}
                    {o.tier.slots_remaining !== null && <span style={{ marginLeft: 6 }}>· {o.tier.slots_remaining} slot{o.tier.slots_remaining === 1 ? "" : "s"} left</span>}
                    {o.reason && <span style={{ marginLeft: 6, color: "#8A1E27" }}>· {o.reason}</span>}
                  </div>
                </div>
                <button onClick={() => apply(o)} disabled={disabled}
                  style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: o.eligible ? (o.direction === "upgrade" ? "#1A8040" : o.direction === "downgrade" ? "#7A5A0F" : "#5A7A60") : "#B7CDB7", border: "none", borderRadius: 8, padding: "7px 12px", cursor: disabled ? "not-allowed" : "pointer", letterSpacing: 1.2, whiteSpace: "nowrap" as const, gridColumn: "4 / 5" }}>
                  {busy === o.tier.id ? "…" : o.direction === "upgrade" ? "UPGRADE" : o.direction === "downgrade" ? "REQUEST" : "SWAP"}
                </button>
              </div>
            );
          })}
          <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", marginTop: 4 }}>
            <strong>Upgrades</strong> charge only the difference and swap on payment. <strong>Downgrades</strong> create a refund request our team processes within 3–5 business days.
          </div>
        </div>
      )}
    </div>
  );
}
