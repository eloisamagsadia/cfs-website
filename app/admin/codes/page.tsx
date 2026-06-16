"use client";
import { useState, useEffect } from "react";
import { IconSparkle, IconCheck, IconTrash } from "@/components/shared/Icons";
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const FILTERS=["ALL","ACTIVE","INACTIVE","EXPIRED","USED UP"];
export default function AdminCodesPage() {
  const [codes,setCodes]=useState<any[]>([]);
  const [filter,setFilter]=useState("ALL");
  const [search,setSearch]=useState("");
  const [form,setForm]=useState({code:"",discount_type:"percent",discount_value:"10",max_uses:"",expires_at:"",product_ids:[] as string[]});
  const [products,setProducts]=useState<any[]>([]);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{loadCodes();loadProducts();},[]);
  async function loadProducts(){
    const res=await fetch("/api/admin/products"); const d=await res.json(); setProducts(d.products??[]);
  }
  async function loadCodes(){
    const res=await fetch("/api/admin/codes"); const d=await res.json(); setCodes(d.codes??[]);
  }
  function generateCode(){
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code="CFS"+Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
    setForm(p=>({...p,code}));
  }
  async function saveCode(){
    if(!form.code||!form.discount_value)return;
    setSaving(true);
    await fetch("/api/admin/codes", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({code:form.code,discount_type:form.discount_type,discount_value:Number(form.discount_value),max_uses:form.max_uses?Number(form.max_uses):null,expires_at:form.expires_at||null,is_active:true,product_ids:form.product_ids}) });
    setForm({code:"",discount_type:"percent",discount_value:"10",max_uses:"",expires_at:"",product_ids:[]});
    await loadCodes();
    setSaving(false);
  }
  async function toggleActive(id: string, current: boolean){
    await fetch(`/api/admin/codes?id=${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({is_active:!current}) });
    loadCodes();
  }
  async function deleteCode(id: string){
    if(!confirm("Delete this code?"))return;
    await fetch(`/api/admin/codes?id=${id}`, { method: "DELETE" });
    loadCodes();
  }
  function getStatus(c: any){
    if(!c.is_active)return"INACTIVE";
    if(c.expires_at&&new Date(c.expires_at)<new Date())return"EXPIRED";
    if(c.max_uses&&(c.used_count??0)>=c.max_uses)return"USED UP";
    return"ACTIVE";
  }
  const filtered=codes.filter(c=>{
    const s=getStatus(c);
    if(filter!=="ALL"&&s!==filter)return false;
    if(search&&!c.code.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const inp={background:"#F2F7F2",border:"1.5px solid #DDE8DD",borderRadius:"6px",padding:"10px 12px",color:"#1B3A2D",fontFamily:B,fontSize:"13px",outline:"none",width:"100%",boxSizing:"border-box" as const};
  const SC={ACTIVE:"#1A8040",INACTIVE:"#5A7A60",EXPIRED:"#CC3344","USED UP":"#1A8040"};
  const SB={ACTIVE:"#E8F0E4",INACTIVE:"#F2F7F2",EXPIRED:"#3D0A18","USED UP":"#E8F4EC"};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
      <div>
        <h1 style={{fontFamily:R,fontSize:"1.6rem",color:"#1B3A2D",letterSpacing:"3px",marginBottom:"4px"}}>PROMO CODES</h1>
        <p style={{fontFamily:B,fontSize:"13px",color:"#4A7C59"}}>{codes.length} total · {codes.filter(c=>getStatus(c)==="ACTIVE").length} active</p>
      </div>
      <div style={{background:"#FFFFFF",border:"2px solid #DDE8DD",borderRadius:"12px",padding:"20px"}}>
        <div style={{fontFamily:R,fontSize:"13px",color:"#156530",letterSpacing:"2px",marginBottom:"14px"}}>GENERATE NEW CODE</div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
          <div style={{display:"flex",gap:"10px"}}>
            <input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="CODE (e.g. CFS2026)" style={{...inp,flex:1,letterSpacing:"2px",fontFamily:R}}/>
            <button onClick={generateCode} style={{background:"#E8F4EC",border:"2px solid #156530",borderRadius:"6px",color:"#156530",padding:"10px 20px",cursor:"pointer",fontFamily:R,fontSize:"12px",letterSpacing:"1.5px",whiteSpace:"nowrap",flexShrink:0,display:"inline-flex",alignItems:"center",gap:"6px"}}><IconSparkle size={12} color="#156530" /> GENERATE</button>
          </div>
          <div className="codes-form-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"10px"}}>
            <select value={form.discount_type} onChange={e=>setForm(p=>({...p,discount_type:e.target.value}))} style={inp}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (₱)</option>
            </select>
            <input type="number" value={form.discount_value} onChange={e=>setForm(p=>({...p,discount_value:e.target.value}))} placeholder="10" style={inp}/>
            <input type="number" value={form.max_uses} onChange={e=>setForm(p=>({...p,max_uses:e.target.value}))} placeholder="Max uses (blank=∞)" style={inp}/>
            <input type="date" value={form.expires_at} onChange={e=>setForm(p=>({...p,expires_at:e.target.value}))} style={inp}/>
          </div>
        </div>
        <div style={{marginBottom:"14px"}}>
          <div style={{fontFamily:B,fontSize:"11px",color:"#5A7A60",letterSpacing:"1px",marginBottom:"8px"}}>RESTRICT TO PRODUCTS (leave empty = applies to all)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
            {products.map((p:any)=>{
              const selected=form.product_ids.includes(p.id);
              return(
                <button key={p.id} onClick={()=>setForm(prev=>({...prev,product_ids:selected?prev.product_ids.filter((id:string)=>id!==p.id):[...prev.product_ids,p.id]}))}
                  style={{fontFamily:B,fontSize:"11px",background:selected?"#E8F0E4":"#F2F7F2",border:`1.5px solid ${selected?"#1A8040":"#DDE8DD"}`,borderRadius:"6px",padding:"6px 12px",color:selected?"#1A8040":"#4A7C59",cursor:"pointer"}}>
                  {selected ? <><IconCheck size={10} color="#1A8040" style={{ verticalAlign: "middle" }} />{" "}</> : ""}{p.name} — ₱{Number(p.price).toLocaleString()}
                </button>
              );
            })}
            {products.length===0&&<span style={{fontFamily:B,fontSize:"12px",color:"#5A7A60"}}>No products found</span>}
          </div>
        </div>
        <button onClick={saveCode} disabled={saving||!form.code} style={{fontFamily:R,fontSize:"12px",background:saving||!form.code?"#F2F7F2":"#156530",color:saving||!form.code?"#5A7A60":"#080F06",border:"2px solid #1B3A2D",borderRadius:"6px",padding:"10px 24px",cursor:"pointer",letterSpacing:"1.5px"}}>
          {saving ? "SAVING..." : <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>SAVE CODE <IconSparkle size={12} color="#FFFFFF" /></span>}
        </button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{fontFamily:R,fontSize:"11px",letterSpacing:"1px",background:filter===f?"#E8F0E4":"transparent",border:`1.5px solid ${filter===f?"#1A8040":"#DDE8DD"}`,color:filter===f?"#1A8040":"#5A7A60",borderRadius:"20px",padding:"5px 14px",cursor:"pointer"}}>{f}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search code..." style={{...inp,width:"220px"}}/>
      </div>
      <div style={{background:"#FFFFFF",border:"2px solid #DDE8DD",borderRadius:"12px",overflow:"hidden"}}>
        <div className="codes-table-header" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 100px",background:"#F2F7F2",borderBottom:"2px solid #DDE8DD",padding:"10px 18px",gap:"0"}}>
          {["CODE","DISCOUNT","USES","EXPIRES","STATUS","ACTIONS"].map(h=>(
            <div key={h} style={{fontFamily:B,fontSize:"11px",color:"#5A7A60",letterSpacing:"1.5px"}}>{h}</div>
          ))}
        </div>
        {filtered.length===0?(
          <div style={{padding:"48px",textAlign:"center",fontFamily:R,fontSize:"13px",color:"#5A7A60",letterSpacing:"2px"}}>NO CODES FOUND</div>
        ):filtered.map(c=>{
          const status=getStatus(c);
          return(
            <div key={c.id} className="codes-table-row" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 100px",padding:"12px 18px",borderBottom:"1px solid #DDE8DD",alignItems:"center",gap:"0"}}>
              <div><div style={{fontFamily:R,fontSize:"15px",color:"#156530",letterSpacing:"2px"}}>{c.code}</div>
              <div style={{fontFamily:B,fontSize:"10px",color:"#5A7A60",marginTop:"2px"}}>{c.product_ids?.length>0?c.product_ids.map((id:string)=>{const p=products.find((pr:any)=>pr.id===id);return p?.name??id;}).join(", "):"All products"}</div></div>
              <div style={{fontFamily:R,fontSize:"13px",color:"#1A8040"}}>{c.discount_type==="percent"?`${c.discount_value}% OFF`:`₱${c.discount_value} OFF`}</div>
              <div style={{fontFamily:B,fontSize:"12px",color:"#4A7C59"}}>{c.used_count??0}/{c.max_uses??"∞"}</div>
              <div style={{fontFamily:B,fontSize:"12px",color:"#4A7C59"}}>{c.expires_at?new Date(c.expires_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"}):"Never"}</div>
              <div><span style={{fontFamily:R,fontSize:"10px",color:SC[status],background:SB[status],border:`1.5px solid ${SC[status]}40`,borderRadius:"20px",padding:"2px 10px",letterSpacing:"1px"}}>{status}</span></div>
              <div style={{display:"flex",gap:"6px"}}>
                <button onClick={()=>toggleActive(c.id,c.is_active)} style={{background:"#E8F4EC",border:"1.5px solid #156530",borderRadius:"6px",color:"#156530",width:"32px",height:"32px",cursor:"pointer",fontSize:"13px"}}>{c.is_active?"⏸":"▶"}</button>
                <button onClick={()=>deleteCode(c.id)} style={{background:"#FFE8EC",border:"1.5px solid #CC3344",borderRadius:"6px",color:"#CC3344",width:"32px",height:"32px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><IconTrash size={13} color="#CC3344" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
