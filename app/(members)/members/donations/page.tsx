import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { IconHeart } from "@/components/shared/Icons";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "My Donations" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

const SC: Record<string, string> = {
  completed: "#1A8040",
  pending:   "#156530",
  failed:    "#CC3344",
};

const TIERS = [
  { name: "Supermoon",    min: 8000,  max: Infinity, color: "#156530" },
  { name: "Blue Moon",    min: 5000,  max: 7999,     color: "#1A8040" },
  { name: "Harvest Moon", min: 3000,  max: 4999,     color: "#1A8040" },
  { name: "Blood Moon",   min: 1500,  max: 2999,     color: "#CC3344" },
];

function getTier(amount: number) {
  return TIERS.find(t => amount >= t.min && amount <= t.max) ?? null;
}

function fmt(n: number) {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function MyDonationsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();
  const { data: donations } = await supabase
    .from("donations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const display = donations ?? [];
  const completed = display.filter(d => d.status === "completed");
  const totalGiven = completed.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MY DONATIONS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          {completed.length} donation{completed.length !== 1 ? "s" : ""} · <span style={{ color: "#1A8040" }}>₱{totalGiven.toLocaleString()} contributed</span>
        </p>
      </div>

      {totalGiven > 0 && (
        <div style={{ background: "linear-gradient(135deg, #E8F0E4, #D4EAD0)", border: "2px solid #1A804040", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div><IconHeart size={36} color="#1A8040" /></div>
          <div>
            <div style={{ fontFamily: S, fontSize: "1.8rem", color: "#1A8040" }}>₱{totalGiven.toLocaleString()}</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Total contributed to CFS — thank you for your support!</div>
          </div>
        </div>
      )}

      {display.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ marginBottom: "12px" }}><IconHeart size={40} color="#DDE8DD" /></div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "16px" }}>NO DONATIONS YET</div>
          <a href="/donate" style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", textDecoration: "none", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 18px", letterSpacing: "1.5px" }}>DONATE NOW →</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {display.map(d => {
            const total      = Number(d.amount);
            const intended   = d.donation_amount ? Number(d.donation_amount) : null;
            const fee        = intended != null ? total - intended : null;
            const refNo      = (d.id as string).slice(0, 8).toUpperCase();
            const tier       = intended != null ? getTier(intended) : getTier(total);
            const statusColor = SC[d.status] ?? "#5A7A60";
            const dt         = new Date(d.created_at);
            const dateStr    = dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
            const timeStr    = dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });

            return (
              <div key={d.id} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
                {/* Header row */}
                <div style={{ background: "#F2F7F2", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px" }}>REF #</span>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", fontWeight: 700 }}>{refNo}</span>
                    {d.is_anonymous && (
                      <span style={{ fontFamily: R, fontSize: "9px", color: "#4A7C59", background: "#DDE8DD", borderRadius: "10px", padding: "2px 8px", letterSpacing: "1px" }}>ANON</span>
                    )}
                    {tier && (
                      <span style={{ fontFamily: R, fontSize: "9px", color: tier.color, background: tier.color + "18", border: `1px solid ${tier.color}40`, borderRadius: "10px", padding: "2px 8px", letterSpacing: "1px" }}>
                        {tier.name.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{dateStr} · {timeStr}</span>
                    <span style={{ fontFamily: R, fontSize: "10px", color: statusColor, background: statusColor + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px" }}>
                      {(d.status ?? "pending").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "start" }}>
                  {/* Left: breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {intended != null ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>Donation amount</span>
                          <span style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D" }}>₱{fmt(intended)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>Processing fee <span style={{ fontSize: "10px" }}>(GCash 2.5% · Maya 2% · Card 3.5%+₱15)</span></span>
                          <span style={{ fontFamily: R, fontSize: "12px", color: "#CC3344" }}>+₱{fmt(fee!)}</span>
                        </div>
                        <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px" }}>TOTAL CHARGED</span>
                          <span style={{ fontFamily: S, fontSize: "1.3rem", color: "#1A8040" }}>₱{fmt(total)}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px" }}>AMOUNT PAID</span>
                        <span style={{ fontFamily: S, fontSize: "1.3rem", color: "#1A8040" }}>₱{fmt(total)}</span>
                      </div>
                    )}
                    {d.message && (
                      <div style={{ marginTop: "4px", background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px" }}>
                        <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px" }}>MESSAGE · </span>
                        <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", fontStyle: "italic" }}>"{d.message}"</span>
                      </div>
                    )}
                  </div>

                  {/* Right: payment info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", minWidth: "120px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                      <span style={{ fontFamily: R, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px" }}>PAYMENT METHOD</span>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59" }}>QR PH / Online</span>
                    </div>
                    {d.paymongo_ref && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                        <span style={{ fontFamily: R, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px" }}>PAYMONGO REF</span>
                        <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#5A7A60" }}>
                          {(d.paymongo_ref as string).slice(-12)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <a href="/donate" style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", textDecoration: "none", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 24px", letterSpacing: "1.5px", display: "inline-block" }}>
          DONATE AGAIN →
        </a>
      </div>
    </div>
  );
}
