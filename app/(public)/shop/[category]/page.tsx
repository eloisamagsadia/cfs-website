import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const COLORS:Record<string,string>={apparel:"#F07228",photocards:"#F5C82A",accessories:"#8EE440",bundles:"#F04060",default:"#3CCE2A"};
export default async function ShopCategoryPage({ params }:{ params:{ category:string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: allCategories } = await supabase.from("product_categories").select("*");
  const category = (allCategories ?? []).find((c:any) => c.slug === params.category);
  if (!category) notFound();
  const { data: products } = await supabase.from("products").select("*").eq("category_id", category.id).eq("is_active", true).order("created_at",{ascending:false});
  const accent = COLORS[params.category] ?? COLORS.default;
  return (
    <div style={{minHeight:"100vh",background:"#0F1A0B"}}>
      <div style={{background:"#1A2614",borderBottom:"2px solid #2C4820",padding:"40px 24px"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto"}}>
          <Link href="/shop" style={{fontFamily:R,fontSize:"11px",color:"#5A7A50",textDecoration:"none",letterSpacing:"1px",display:"block",marginBottom:"16px"}}>← BACK TO SHOP</Link>
          <h1 style={{fontFamily:R,fontSize:"2.2rem",color:accent,letterSpacing:"4px",marginBottom:"4px"}}>{category.name.toUpperCase()}</h1>
          <p style={{fontFamily:B,fontSize:"13px",color:"#8AAA78"}}>{products?.length ?? 0} products</p>
        </div>
      </div>
      <div style={{background:"#1A2614",borderBottom:"1px solid #2C4820",padding:"0 24px"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",overflowX:"auto"}}>
          {(allCategories ?? []).map((cat:any) => (
            <Link key={cat.id} href={`/shop/${cat.slug}`} style={{fontFamily:R,fontSize:"12px",letterSpacing:"1.5px",padding:"14px 20px",textDecoration:"none",color:cat.slug===params.category?accent:"#5A7A50",borderBottom:cat.slug===params.category?`2px solid ${accent}`:"2px solid transparent",whiteSpace:"nowrap"}}>
              {cat.name.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
      <div style={{maxWidth:"1280px",margin:"0 auto",padding:"32px 24px"}}>
        {!products?.length ? (
          <div style={{background:"#1A2614",border:"2px solid #2C4820",borderRadius:"12px",padding:"56px",textAlign:"center"}}>
            <div style={{fontSize:"48px",marginBottom:"14px"}}>🛍</div>
            <div style={{fontFamily:R,fontSize:"14px",color:"#5A7A50",letterSpacing:"2px"}}>NO PRODUCTS YET</div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"16px"}}>
            {products.map((p:any) => (
              <Link key={p.id} href={`/shop/${params.category}/${p.id}`} style={{textDecoration:"none"}}>
                <div style={{position:"relative",padding:"4px 4px 8px 0"}}>
                  <div style={{position:"absolute",bottom:0,right:0,width:"calc(100% - 4px)",height:"calc(100% - 4px)",borderRadius:"12px",background:"#080F06"}}/>
                  <div style={{position:"relative",background:"#1A2614",border:"2px solid #2C4820",borderRadius:"12px",overflow:"hidden",zIndex:1}}>
                    <div style={{height:"220px",background:"#243520",overflow:"hidden",position:"relative"}}>
                      {p.images?.[0]?<img src={p.images[0]} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"48px"}}>🛍</div>}
                      {p.stock===0&&<div style={{position:"absolute",inset:0,background:"rgba(8,15,6,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:R,fontSize:"13px",color:"#F04060",background:"#3D0A18",border:"1.5px solid #F04060",borderRadius:"6px",padding:"6px 14px",letterSpacing:"1px"}}>OUT OF STOCK</span></div>}
                      {p.stock>0&&p.stock<=5&&<div style={{position:"absolute",top:"8px",right:"8px",background:"#F07228",border:"1.5px solid #080F06",borderRadius:"4px",padding:"2px 8px",fontFamily:R,fontSize:"9px",color:"#080F06",letterSpacing:"1px"}}>ONLY {p.stock} LEFT</div>}
                    </div>
                    <div style={{padding:"14px 16px"}}>
                      <div style={{fontFamily:R,fontSize:"14px",color:"#F0EAD6",letterSpacing:"1px",marginBottom:"6px"}}>{p.name}</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontFamily:R,fontSize:"18px",color:accent}}>₱{Number(p.price).toLocaleString()}</span>
                        <span style={{fontFamily:R,fontSize:"11px",color:"#3CCE2A",background:"#1A3D14",border:"1.5px solid #2C4820",borderRadius:"6px",padding:"5px 12px",letterSpacing:"1px"}}>VIEW →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
