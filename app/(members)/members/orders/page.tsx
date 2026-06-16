import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { IconShoppingBag } from "@/components/shared/Icons";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title:"My Orders" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const payColors:Record<string,string>={paid:"#1A8040",pending:"#156530",failed:"#CC3344",cancelled:"#5A7A60"};
const orderColors:Record<string,string>={processing:"#1A8040",shipped:"#1A8040",delivered:"#1A8040",cancelled:"#CC3344",pending:"#156530"};

export default async function MyOrdersPage() {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const { data: orders } = await supabase
    .from("orders").select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const display = orders ?? [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#1B3A2D", letterSpacing:"3px", marginBottom:"4px" }}>MY ORDERS</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#4A7C59" }}>{display.length} order{display.length !== 1 ? "s" : ""}</p>
      </div>

      {display.length === 0 ? (
        <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ marginBottom:"12px" }}><IconShoppingBag size={40} color="#DDE8DD" /></div>
          <div style={{ fontFamily:R, fontSize:"14px", color:"#5A7A60", letterSpacing:"2px", marginBottom:"16px" }}>NO ORDERS YET</div>
          <a href="/shop" style={{ fontFamily:R, fontSize:"12px", color:"#1A8040", textDecoration:"none", border:"1.5px solid #DDE8DD", borderRadius:"6px", padding:"8px 18px", letterSpacing:"1.5px" }}>SHOP NOW →</a>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {display.map((order: any) => {
            const payColor = payColors[order.payment_status] ?? "#5A7A60";
            const orderColor = orderColors[order.order_status] ?? "#5A7A60";
            const items = Array.isArray(order.items) ? order.items : [];
            return (
              <div key={order.id} style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                  <div>
                    <div style={{ fontFamily:R, fontSize:"11px", color:"#5A7A60", letterSpacing:"1px", marginBottom:"3px" }}>ORDER ID</div>
                    <div style={{ fontFamily:B, fontSize:"12px", color:"#4A7C59" }}>{order.id.slice(0,8).toUpperCase()}...</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:R, fontSize:"1.1rem", color:"#1A8040", letterSpacing:"1px" }}>₱{Number(order.total).toLocaleString()}</div>
                    <div style={{ fontFamily:B, fontSize:"11px", color:"#5A7A60" }}>
                      {new Date(order.created_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  <span style={{ fontFamily:R, fontSize:"10px", color:payColor, background:`${payColor}20`, border:`1px solid ${payColor}40`, borderRadius:"20px", padding:"2px 10px", letterSpacing:"1px" }}>
                    {order.payment_status.toUpperCase()}
                  </span>
                  <span style={{ fontFamily:R, fontSize:"10px", color:orderColor, background:`${orderColor}20`, border:`1px solid ${orderColor}40`, borderRadius:"20px", padding:"2px 10px", letterSpacing:"1px" }}>
                    {(order.order_status ?? "pending").toUpperCase()}
                  </span>
                  <span style={{ fontFamily:B, fontSize:"11px", color:"#5A7A60" }}>
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
