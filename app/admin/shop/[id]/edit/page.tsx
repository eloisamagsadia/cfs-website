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
  const [uploading, setUploading] = useState<number | null>(null);
  const [form, setForm] = useState({ name:"", description:"", price:"", stock:"", weight_kg:"0.5", is_active:true, images:[""] });
  useEffect(() => { loadProduct(); }, []);
  async function loadProduct() {
    const res = await fetch("/api/admin/products?id=" + params.id);
    const data = await res.json();
    if (!res.ok || !data.product) { setError("Failed to load: " + (data.error ?? "not found")); setLoading(false); return; }
    const p = data.product;
    setForm({ name:p.name??"", description:p.description??"", price:String(p.price??""), stock:String(p.stock??""), weight_kg:String(p.weight_kg??0.5), is_active:p.is_active??true, images:p.images?.length?p.images:[""] });
    setLoading(false);
  }
  function upd(k: string, v: any){setForm(p=>({...p,[k]:v}));}
  async function handleSave(){
    if(!form.name||!form.price){setError("Name and price required.");return;}
    setSaving(true);setError("");setSuccess("");
    const res = await fetch("/api/admin/products?id=" + params.id, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:form.name,description:form.description||null,price:Number(form.price),stock:Number(form.stock)||0,weight_kg:Number(form.weight_kg)||0.5,is_active:form.is_active,images:form.images.filter(Boolean)})
    });
    const data = await res.json();
    setSaving(false);
    if(!res.ok){setError(data.error);return;}
    setSuccess("Saved!");setTimeout(()=>setSuccess(""),3000);loadProduct();
  }
  async function handleDelete(){
    if(!confirm("Delete this product?"))return;
    await fetch("/api/admin/products?id=" + params.id, {method:"DELETE"});
    router.push("/admin/shop");
  }
  async function uploadImage(index: number, file: File) {
    setUploading(index);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) {
      const a = [...form.images];
      a[index] = data.url;
      upd("images", a);
    } else {
      setError(data.error ?? "Upload failed");
    }
    setUploading(null);
  }
  const inp={width:"100%",background:"#F2F7F2",border:"1.5px solid #DDE8DD",borderRadius:"6px",padding:"10px 14px",color:"#1B3A2D",fontFamily:B,fontSize:"14px",outline:"none",boxSizing:"border-box" as const};
  const lbl={fontFamily:B,fontSize:"11px",color:"#5A7A60",letterSpacing:"1px",textTransform:"uppercase",display:"block",marginBottom:"6px"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"20px",maxWidth:"640px"}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <h1 style={{fontFamily:R,fontSize:"1.6rem",color:"#1B3A2D",letterSpacing:"3px"}}>EDIT PRODUCT</h1>
        <button onClick={()=>router.back()} style={{fontFamily:R,fontSize:"11px",color:"#5A7A60",background:"transparent",border:"none",cursor:"pointer"}}>Back</button>
      </div>
      {error&&<div style={{background:"#3D0A18",border:"1.5px solid #CC3344",borderRadius:"8px",padding:"12px",fontFamily:B,fontSize:"13px",color:"#CC3344"}}>{error}</div>}
      {success&&<div style={{background:"#E8F0E4",border:"1.5px solid #1A8040",borderRadius:"8px",padding:"12px",fontFamily:R,fontSize:"13px",color:"#1A8040"}}>{success}</div>}
      {!loading&&(
        <div style={{background:"#FFFFFF",border:"2px solid #DDE8DD",borderRadius:"12px",padding:"24px",display:"flex",flexDirection:"column",gap:"14px"}}>
          <div><label style={lbl}>Name *</label><input style={inp} value={form.name} onChange={e=>upd("name",e.target.value)}/></div>
          <div><label style={lbl}>Description</label><textarea style={{...inp,resize:"vertical",minHeight:"80px"}} value={form.description} onChange={e=>upd("description",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px"}}>
            <div><label style={lbl}>Price (P) *</label><input type="number" style={inp} value={form.price} onChange={e=>upd("price",e.target.value)}/></div>
            <div><label style={lbl}>Stock</label><input type="number" style={inp} value={form.stock} onChange={e=>upd("stock",e.target.value)}/></div>
            <div><label style={lbl}>Weight (kg)</label><input type="number" step="0.01" style={inp} value={form.weight_kg} onChange={e=>upd("weight_kg",e.target.value)} placeholder="e.g. 0.3"/></div>
          </div>
          <div>
            <label style={lbl}>Images</label>
            {form.images.map((img, i) => (
              <div key={i} style={{marginBottom:"10px"}}>
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor="#1A8040"; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor="#DDE8DD"; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor="#DDE8DD";
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadImage(i, file);
                  }}
                  style={{border:"2px dashed #DDE8DD",borderRadius:"10px",padding:"16px",textAlign:"center",cursor:"pointer",transition:"border-color 0.15s",background:"#F7FAF5"}}
                >
                  {img ? (
                    <div style={{position:"relative",display:"inline-block"}}>
                      <img src={img} alt="" style={{height:"120px",width:"120px",borderRadius:"8px",objectFit:"cover",display:"block"}} />
                      <button onClick={()=>upd("images",form.images.map((v,j)=>j===i?"":v))}
                        style={{position:"absolute",top:"-8px",right:"-8px",background:"#CC3344",border:"none",borderRadius:"50%",width:"22px",height:"22px",color:"#fff",cursor:"pointer",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                    </div>
                  ) : (
                    <label style={{cursor:"pointer",display:"block"}}>
                      <div style={{fontSize:"28px",marginBottom:"6px"}}>{uploading===i ? "⏳" : "⬆"}</div>
                      <div style={{fontFamily:B,fontSize:"12px",color:"#5A7A60"}}>{uploading===i ? "Uploading..." : "Drop image here or click to upload"}</div>
                      <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])uploadImage(i,e.target.files[0]);}}/>
                    </label>
                  )}
                </div>
                <input style={{...inp,marginTop:"6px",fontSize:"11px",color:"#5A7A60"}} value={img} onChange={e=>{const a=[...form.images];a[i]=e.target.value;upd("images",a);}} placeholder="Or paste image URL"/>
              </div>
            ))}
            <button onClick={()=>upd("images",[...form.images,""])} style={{fontFamily:R,fontSize:"11px",color:"#1A8040",background:"transparent",border:"1.5px solid #DDE8DD",borderRadius:"6px",padding:"6px 12px",cursor:"pointer"}}>+ ADD IMAGE</button>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}}>
            <input type="checkbox" checked={form.is_active} onChange={e=>upd("is_active",e.target.checked)} style={{width:"18px",height:"18px",accentColor:"#1A8040"}}/>
            <span style={{fontFamily:R,fontSize:"12px",color:"#4A7C59"}}>ACTIVE IN SHOP</span>
          </label>
          <div style={{display:"flex",gap:"10px",paddingTop:"10px",borderTop:"1px solid #DDE8DD"}}>
            <button onClick={handleSave} disabled={saving} style={{flex:1,fontFamily:R,fontSize:"12px",background:saving?"#F2F7F2":"#1A8040",color:saving?"#5A7A60":"#080F06",border:"2px solid #080F06",borderRadius:"6px",padding:"10px",cursor:"pointer"}}>{saving?"SAVING...":"SAVE"}</button>
            <button onClick={handleDelete} style={{fontFamily:R,fontSize:"11px",background:"transparent",border:"1.5px solid #CC3344",borderRadius:"6px",color:"#CC3344",padding:"10px 14px",cursor:"pointer"}}>DELETE</button>
          </div>
        </div>
      )}
    </div>
  );
}
