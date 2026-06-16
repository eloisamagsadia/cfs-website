import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { IconTicket } from "@/components/shared/Icons";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title:"My Codes" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";

export default async function CodesPage() {
  const { userId } = auth();
  const supabase = createAdminClient();
  
  if (!userId) redirect("/sign-in");

  const { data: userCodes } = await supabase
    .from("user_promo_codes")
    .select("*, promo_codes(*)")
    .eq("user_id", userId);

  const codes = (userCodes ?? []).map((uc:any) => ({
    ...uc.promo_codes,
    assigned_at: uc.assigned_at,
  }));

  const getStatus = (code:any) => {
    if (!code.is_active) return { label:"INACTIVE", color:"#5A7A60" };
    if (code.expires_at && new Date(code.expires_at) < new Date()) return { label:"EXPIRED", color:"#CC3344" };
    if (code.max_uses && code.used_count >= code.max_uses) return { label:"USED UP", color:"#CC3344" };
    return { label:"ACTIVE", color:"#1A8040" };
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#1B3A2D", letterSpacing:"3px", marginBottom:"4px" }}>MY CODES</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#4A7C59" }}>Promo codes assigned to your account</p>
      </div>

      {codes.length === 0 ? (
        <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ marginBottom:"12px" }}><IconTicket size={40} color="#DDE8DD" /></div>
          <div style={{ fontFamily:R, fontSize:"14px", color:"#5A7A60", letterSpacing:"2px" }}>NO CODES YET</div>
          <div style={{ fontFamily:B, fontSize:"13px", color:"#5A7A60", marginTop:"8px" }}>Promo codes will appear here when assigned by the admin.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {codes.map((code:any) => {
            const status = getStatus(code);
            return (
              <div key={code.id} style={{ background:"#FFFFFF", border:`2px solid ${status.color === "#1A8040" ? "#DDE8DD" : "#2C2020"}`, borderRadius:"12px", padding:"20px 22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                  {/* Code display */}
                  <div>
                    <div style={{ fontFamily:R, fontSize:"22px", color:status.color, letterSpacing:"4px", marginBottom:"4px" }}>{code.code}</div>
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <span style={{ fontFamily:R, fontSize:"10px", color:status.color, background:`${status.color}20`, border:`1px solid ${status.color}40`, borderRadius:"20px", padding:"2px 10px", letterSpacing:"1px" }}>
                        {status.label}
                      </span>
                      <span style={{ fontFamily:R, fontSize:"12px", color:"#156530", letterSpacing:"1px" }}>
                        {code.discount_type === "percent" ? `${code.discount_value}% OFF` : `₱${code.discount_value} OFF`}
                      </span>
                    </div>
                  </div>
                  {/* Copy button */}
                  {status.label === "ACTIVE" && (
                    <button
                      onClick={() => navigator.clipboard?.writeText(code.code)}
                      style={{ fontFamily:R, fontSize:"11px", background:"#E8F0E4", border:"1.5px solid #DDE8DD", borderRadius:"6px", color:"#1A8040", padding:"8px 16px", cursor:"pointer", letterSpacing:"1px" }}
                    >
                      COPY
                    </button>
                  )}
                </div>
                <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
                  {code.expires_at && (
                    <span style={{ fontFamily:B, fontSize:"12px", color:"#5A7A60" }}>
                      Expires: {new Date(code.expires_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}
                    </span>
                  )}
                  {code.max_uses && (
                    <span style={{ fontFamily:B, fontSize:"12px", color:"#5A7A60" }}>
                      Uses: {code.used_count}/{code.max_uses}
                    </span>
                  )}
                  <span style={{ fontFamily:B, fontSize:"12px", color:"#5A7A60" }}>Use at Shop checkout</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
