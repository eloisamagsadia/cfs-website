function Sk({ w="100%", h="14px", r="6px" }: { w?:string; h?:string; r?:string }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:"linear-gradient(90deg,#1A2614 25%,#1E2A18 50%,#1A2614 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }}/>;
}
export default function AdminLoading() {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display:"flex", gap:"28px", padding:"32px 24px", maxWidth:"1280px", margin:"0 auto" }}>
        <div style={{ width:"220px", flexShrink:0, display:"flex", flexDirection:"column", gap:"6px" }}>
          {Array.from({length:8}).map((_,i) => (
            <div key={i} style={{ display:"flex", gap:"10px", padding:"10px 14px", alignItems:"center" }}>
              <Sk w="18px" h="18px" r="4px"/>
              <Sk w="80px" h="12px"/>
            </div>
          ))}
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <Sk h="28px" w="220px"/>
            <Sk h="13px" w="140px"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }}>
            {Array.from({length:4}).map((_,i) => (
              <div key={i} style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"10px", padding:"18px 16px", display:"flex", flexDirection:"column", gap:"8px" }}>
                <Sk h="32px" w="50px"/>
                <Sk h="12px" w="90px"/>
              </div>
            ))}
          </div>
          {Array.from({length:5}).map((_,i) => (
            <div key={i} style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"14px 20px", display:"flex", gap:"12px", alignItems:"center" }}>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"7px" }}>
                <Sk h="14px" w="50%"/>
                <Sk h="12px" w="30%"/>
              </div>
              <Sk w="70px" h="26px" r="6px"/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
