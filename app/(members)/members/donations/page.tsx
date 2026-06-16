import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "My Donations" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

const SC: Record<string, string> = {
  completed: "#3CCE2A",
  pending:   "#F5C82A",
  failed:    "#F04060",
};

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
  const totalGiven = display
    .filter(d => d.status === "completed")
    .reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MY DONATIONS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>
          {display.filter(d => d.status === "completed").length} donation{display.length !== 1 ? "s" : ""} · <span style={{ color: "#3CCE2A" }}>₱{totalGiven.toLocaleString()} contributed</span>
        </p>
      </div>

      {totalGiven > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0A2614, #1A3D14)", border: "2px solid #3CCE2A40", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ fontSize: "36px" }}>💚</div>
          <div>
            <div style={{ fontFamily: S, fontSize: "1.8rem", color: "#3CCE2A" }}>₱{totalGiven.toLocaleString()}</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Total contributed to CFS — thank you for your support!</div>
          </div>
        </div>
      )}

      {display.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>💚</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A50", letterSpacing: "2px", marginBottom: "16px" }}>NO DONATIONS YET</div>
          <a href="/donate" style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", textDecoration: "none", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "8px 18px", letterSpacing: "1.5px" }}>DONATE NOW →</a>
        </div>
      ) : (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#243520", padding: "10px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: "12px" }}>
            {["AMOUNT", "STATUS", "DATE", "MESSAGE"].map(h => (
              <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
            ))}
          </div>

          {display.map((d, i) => (
            <div key={d.id} style={{ padding: "14px 20px", borderTop: "1px solid #2C4820", background: i % 2 === 0 ? "#1A2614" : "#162212", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: "12px", alignItems: "center" }}>
              <span style={{ fontFamily: R, fontSize: "15px", color: "#3CCE2A" }}>
                ₱{Number(d.amount).toLocaleString()}
              </span>
              <span style={{ fontFamily: R, fontSize: "10px", color: SC[d.status] ?? "#5A7A50", background: (SC[d.status] ?? "#5A7A50") + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px", width: "fit-content" }}>
                {(d.status ?? "pending").toUpperCase()}
              </span>
              <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                {new Date(d.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78", fontStyle: d.message ? "italic" : "normal" }}>
                {d.message ? `"${d.message}"` : <span style={{ color: "#3A5230" }}>—</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <a href="/donate" style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", textDecoration: "none", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "10px 24px", letterSpacing: "1.5px", display: "inline-block" }}>
          DONATE AGAIN →
        </a>
      </div>
    </div>
  );
}
