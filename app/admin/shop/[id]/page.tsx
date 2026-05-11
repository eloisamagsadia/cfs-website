"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name:"", description:"", price:"", stock:"", is_active:true, images:[""] });
  useEffect(() => { loadProduct(); }, []);
  async function loadProduct() {
    const { data, error } = await supabase.from("products").select("*").eq("id", params.id).single();
    if (error || !data) { setError("RLS error: " + error?.message); setLoading(false); return; }
    setForm({ name:data.name??"", description:data.description??"", price:String(data.price??""), stock:String(data.stock??""), is_active:data.is_active??true, images:data.images?.length?data.images:[""] });
    setLoading(false);
  }
  function upd(k:string,v:any){setForm(p=>({...p,[k]:v}));}
  async function handleSave(){
    if(!form.name||!form.price){setError("Name and price required.");return;}
    setSaving(true);setError("");setSuccess("");
    const{error:err}=await supabase.from("products").update({name:form.name,description:form.description||null,price:Number(form.price),stock:Number(form.stock)||0,is_active:form.is_active,images:form.images.filter(Boolean)}).eq("id",params.id as string);
    setSaving(false);
    if(err){setError(err.message);return;}
    setSuccess("Saved!");setTimeout(()=>setSuccess(""),3000);
  }
  async function handleDelete(){
    if(!confirm("Delete this product?"))return;
    await supabase.from("products").delete().eq("id",params.id as string);
    router.push("/admin/shop");
  }
  const inp={width:"100%",background:"#243520",border:"1.5px solid #2C4820",borderRadius:"6px",padding:"10px 14px",color:"#F0EAD6",fontFamily:B,fontSize:"14px",outline:"none",boxSizing:"border-box" as const};
  const lbl={fontFamily:B,fontSize:"11px",color:"#5A7A50",letterSpacing:"1px",textTransform:"uppercase" as const,display:"block",marginBottom:"6px"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"20px",maxWidth:"640px"}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <h1 style={{fontFamily:R,fontSize:"1.6rem",color:"#F0EAD6",letterSpacing:"3px"}}>EDIT PRODUCT</h1>
        <button onClick={()=>router.back()} style={{fontFamily:R,fontSize:"11px",color:"#5A7A50",background:"transparent",border:"none",cursor:"pointer"}}>Back</button>
      </div>
      {error&&<div style={{background:"#3D0A18",border:"1.5px solid #F04060",borderRadius:"8px",padding:"12px",fontFamily:B,fontSize:"13px",color:"#F04060"}}>{error}</div>}
      {success&&<div style={{background:"#1A3D14",border:"1.5px solid #3CCE2A",borderRadius:"8px",padding:"12px",fontFamily:R,fontSize:"13px",color:"#3CCE2A"}}>{success}</div>}
      {!loading&&(
        <div style={{background:"#1A2614",border:"2px solid #2C4820",borderRadius:"12px",padding:"24px",display:"flex",flexDirection:"column",gap:"14px"}}>
          <div><label style={lbl}>Name *</label><input style={inp} value={form.name} onChange={e=>upd("name",e.target.value)}/></div>
          <div><label style={lbl}>Description</label><textarea style={{...inp,resize:"vertical",minHeight:"80px"}} value={form.description} onChange={e=>upd("description",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <div><label style={lbl}>Price (P) *</label><input type="number" style={inp} value={form.price} onChange={e=>upd("price",e.target.value)}/></div>
            <div><label style={lbl}>Stock</label><input type="number" style={inp} value={form.stock} onChange={e=>upd("stock",e.target.value)}/></div>
          </div>
          <div>
            <label style={lbl}>Images</label>
            {form.images.map((img,i)=>(
              <div key={i} style={{display:"flex",gap:"8px",marginBottom:"6px"}}>
                <input style={{...inp,flex:1}} value={img} onChange={e=>{const a=[...form.images];a[i]=e.target.value;upd("images",a);}} placeholder="Image URL"/>
                {form.images.length>1&&<button onClick={()=>upd("images",form.images.filter((_,j)=>j!==i))} style={{background:"#3D0A18",border:"1.5px solid #F04060",borderRadius:"6px",color:"#F04060",padding:"8px 10px",cursor:"pointer"}}>X</button>}
              </div>
            ))}
            <button onClick={()=>upd("images",[...form.images,""])} style={{fontFamily:R,fontSize:"11px",color:"#3CCE2A",background:"transparent",border:"1.5px solid #2C4820",borderRadius:"6px",padding:"6px 12px",cursor:"pointer"}}>+ ADD IMAGE</button>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}}>
            <input type="checkbox" checked={form.is_active} onChange={e=>upd("is_active",e.target.checked)} style={{width:"18px",height:"18px",accentColor:"#3CCE2A"}}/>
            <span style={{fontFamily:R,fontSize:"12px",color:"#8AAA78"}}>ACTIVE IN SHOP</span>
          </label>
          <div style={{display:"flex",gap:"10px",paddingTop:"10px",borderTop:"1px solid #2C4820"}}>
            <button onClick={handleSave} disabled={saving} style={{flex:1,fontFamily:R,fontSize:"12px",background:saving?"#243520":"#3CCE2A",color:saving?"#5A7A50":"#080F06",border:"2px solid #080F06",borderRadius:"6px",padding:"10px",cursor:"pointer",letterSpacing:"1px"}}>{saving?"SAVING...":"SAVE"}</button>
            <button onClick={handleDelete} style={{fontFamily:R,fontSize:"11px",background:"transparent",border:"1.5px solid #F04060",borderRadius:"6px",color:"#F04060",padding:"10px 14px",cursor:"pointer"}}>DELETE</button>
          </div>
        </div>
      )}
    </div>
  );
}
