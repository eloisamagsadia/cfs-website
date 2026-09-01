"use client";
import { useEffect, useState } from "react";
import { IconLightning, IconCheck } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Flag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
};

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/super/feature-flags", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setFlags(data.flags ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggle(key: string, enabled: boolean) {
    setSaving(key); setError(""); setStatus("");
    try {
      const res = await fetch("/api/super/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setFlags(prev => prev.map(f => f.key === key ? data.flag : f));
      setStatus(`${key} → ${enabled ? "ON" : "OFF"}`);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>FEATURE FLAGS</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0" }}>
          Runtime toggles read by app code. Changes take effect immediately (or on next render, depending on caller).
        </p>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={14} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A", fontSize: "12px" }}>LOADING…</div>
      ) : flags.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "40px", textAlign: "center", fontFamily: B, color: "#7A8E7A" }}>No feature flags defined yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {flags.map(f => (
            <div key={f.key} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "12px", padding: "16px 18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ marginTop: "4px" }}>
                <IconLightning size={16} color={f.enabled ? "#1A8040" : "#B7CDB7"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "13px", color: "#1B3A2D", fontWeight: 700 }}>{f.key}</code>
                  <button onClick={() => toggle(f.key, !f.enabled)} disabled={saving === f.key}
                    style={{ width: "50px", height: "26px", borderRadius: "13px", border: "none", cursor: saving === f.key ? "wait" : "pointer", background: f.enabled ? "#1A8040" : "#DDE8DD", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: "3px", left: f.enabled ? "26px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
                  </button>
                </div>
                {f.description && <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "6px 0 0", lineHeight: 1.5 }}>{f.description}</p>}
                {f.updated_at && (
                  <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#9AA870", letterSpacing: "1px", marginTop: "6px" }}>
                    UPDATED {new Date(f.updated_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}
                    {f.updated_by ? ` · BY ${f.updated_by.slice(0, 12)}` : ""}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "10px", padding: "12px 14px", fontFamily: B, fontSize: "11px", color: "#7A5A0F", lineHeight: 1.6 }}>
        <strong>Adding a new flag?</strong> Insert a row into <code style={{ background: "#FFF3D6", padding: "1px 5px", borderRadius: "4px" }}>feature_flags</code>, then add its key to the <code style={{ background: "#FFF3D6", padding: "1px 5px", borderRadius: "4px" }}>FeatureFlagKey</code> type in <code style={{ background: "#FFF3D6", padding: "1px 5px", borderRadius: "4px" }}>lib/feature-flags.ts</code>. Use <code style={{ background: "#FFF3D6", padding: "1px 5px", borderRadius: "4px" }}>isFeatureEnabled(&quot;your_key&quot;)</code> anywhere server-side to read it.
      </div>
    </div>
  );
}
