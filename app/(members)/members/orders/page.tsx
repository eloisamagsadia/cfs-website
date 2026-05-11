import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"My Orders" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const payColors:Record<string,string>={paid:"#3CCE2A",pending:"#F5C82A",failed:"#F04060",cancelled:"#5A7A50"};
const orderColors:Record<string,string>={processing:"#F07228",shipped:"#8EE440",delivered:"#3CCE2A",cancelled:"#F04060",pending:"#F5C82A"};

export default async function MyOrdersPage() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>MY ORDERS</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#8AAA78" }}>{display.length} order{display.length !== 1 ? "s" : ""}</p>
      </div>

      {display.length === 0 ? (
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🛍</div>
          <div style={{ fontFamily:R, fontSize:"14px", color:"#5A7A50", letterSpacing:"2px", marginBottom:"16px" }}>NO ORDERS YET</div>
          <a href="/shop" style={{ fontFamily:R, fontSize:"12px", color:"#F07228", textDecoration:"none", border:"1.5px solid #3D1A0A", borderRadius:"6px", padding:"8px 18px", letterSpacing:"1.5px" }}>SHOP NOW →</a>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {display.map((order: any) => {
            const payColor = payColors[order.payment_status] ?? "#5A7A50";
            const orderColor = orderColors[order.order_status] ?? "#5A7A50";
            const items = Array.isArray(order.items) ? order.items : [];
            return (
              <div key={order.id} style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                  <div>
                    <div style={{ fontFamily:R, fontSize:"11px", color:"#5A7A50", letterSpacing:"1px", marginBottom:"3px" }}>ORDER ID</div>
                    <div style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>{order.id.slice(0,8).toUpperCase()}...</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:R, fontSize:"1.1rem", color:"#F07228", letterSpacing:"1px" }}>₱{Number(order.total).toLocaleString()}</div>
                    <div style={{ fontFamily:B, fontSize:"11px", color:"#5A7A50" }}>
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
                  <span style={{ fontFamily:B, fontSize:"11px", color:"#5A7A50" }}>
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
