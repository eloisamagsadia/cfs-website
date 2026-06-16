function Sk({ w="100%", h="14px", r="6px" }: { w?:string; h?:string; r?:string }) {
  return <div style={{ width:w, height:h, borderRadius:r, background:"linear-gradient(90deg,#E4EDE4 25%,#DDE8DD 50%,#E4EDE4 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }}/>;
}
export default function Loading() {
  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          <Sk h="28px" w="180px" r="6px"/>
          <Sk h="13px" w="120px" r="4px"/>
        </div>
        {Array.from({length:4}).map((_,i) => (
          <div key={i} style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"18px 20px", display:"flex", gap:"14px", alignItems:"center" }}>
            <Sk w="44px" h="44px" r="50%"/>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px" }}>
              <Sk h="14px" w="55%"/>
              <Sk h="12px" w="35%"/>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
