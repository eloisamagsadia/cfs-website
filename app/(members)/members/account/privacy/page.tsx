"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconWarning, IconMessage } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Access {
  id: string;
  user_id: string;
  action: string;
  target_id: string;
  details: any;
  created_at: string;
  profiles?: { display_name?: string; avatar_url?: string; role?: string } | null;
}

function stamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
}

export default function PrivacyPage() {
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/members/privacy/dm-access")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setAccesses(d.accesses ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
      <div>
        <Link href="/members/account" style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: 1.2 }}>← ACCOUNT</Link>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: 3, marginTop: 4, marginBottom: 4 }}>PRIVACY</h1>
        <p style={{ fontFamily: B, fontSize: 13, color: "#4A7C59" }}>
          Your DMs are private. If a moderator opens a conversation you're part of — for example while investigating a report — the access is logged here so you always know.
        </p>
      </div>

      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: 14, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <IconWarning size={16} color="#7A5A0F" />
        <div style={{ fontFamily: B, fontSize: 13, color: "#7A5A0F", lineHeight: 1.55 }}>
          <strong>What triggers a log entry?</strong> A moderator opens the message view of a private DM. Group chats aren't listed here — they're semi-public by design.
        </div>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "10px 14px", fontFamily: B, fontSize: 13, color: "#CC3344", display: "flex", gap: 8, alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", fontFamily: SG, letterSpacing: 2, color: "#7A8E7A" }}>LOADING…</div>
      ) : accesses.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #B7D8B7", borderRadius: 14, padding: "40px 20px", textAlign: "center" }}>
          <IconMessage size={26} color="#1A8040" />
          <div style={{ fontFamily: R, fontSize: "1.1rem", color: "#156530", letterSpacing: 2, marginTop: 8 }}>NO DM ACCESSES</div>
          <div style={{ fontFamily: B, fontSize: 13, color: "#4A7C59", marginTop: 4 }}>No moderator has opened any of your private conversations.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.5 }}>
            {accesses.length} ACCESS{accesses.length === 1 ? "" : "ES"} ON RECORD
          </div>
          {accesses.map(a => (
            <div key={a.id} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {a.profiles?.avatar_url
                    ? <img src={a.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#1A8040" }}>{(a.profiles?.display_name ?? "?")[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", fontWeight: 600 }}>
                    {a.profiles?.display_name ?? "A moderator"}
                    {a.profiles?.role && <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#1A8040", background: "#E8F0E4", borderRadius: 6, padding: "1px 7px", letterSpacing: 1.1, marginLeft: 6 }}>{a.profiles.role.toUpperCase()}</span>}
                  </div>
                  <div style={{ fontFamily: B, fontSize: 12, color: "#5A7A60" }}>
                    opened your DM · {stamp(a.created_at)}
                  </div>
                </div>
              </div>
              {a.details?.reason && (
                <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: 10, padding: "10px 12px", fontFamily: B, fontSize: 12, color: "#1B3A2D", lineHeight: 1.55 }}>
                  <div style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3, marginBottom: 3 }}>REASON GIVEN</div>
                  <div style={{ whiteSpace: "pre-wrap" as const }}>{a.details.reason}</div>
                </div>
              )}
              {typeof a.details?.message_count === "number" && (
                <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A" }}>
                  {a.details.message_count} message{a.details.message_count === 1 ? "" : "s"} were loaded in that session.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", padding: "12px 0" }}>
        Notice something that doesn't look right? Reach out via <Link href="/members/support" style={{ color: "#1A8040" }}>support</Link>.
      </div>
    </div>
  );
}
