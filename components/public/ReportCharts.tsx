"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  forest: "#1B3A2D", sage: "#4A7C59", border: "#DDE8DD",
  muted: "#7A8E7A", green: "#1A8040", cream: "#F2F7F2", mist: "#E8F0E4",
};

const COLORS = ["#4A7C59","#1A8040","#156530","#1A8040","#CC3344","#1A8040","#8B5CF6","#1A8040"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"10px", padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
        <div style={{ fontFamily:SG, fontSize:"11px", fontWeight:700, color:C.forest, marginBottom:"4px" }}>{payload[0].name}</div>
        <div style={{ fontFamily:S, fontSize:"16px", color:payload[0].payload.color || C.sage }}>₱{Number(payload[0].value).toLocaleString()}</div>
        <div style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{payload[0].payload.pct}% of total</div>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
  if (pct < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontFamily:SG, fontSize:"11px", fontWeight:700 }}>
      {pct}%
    </text>
  );
};

export function BreakdownChart({ items, total, title, accentColor }: {
  items: { label: string; amount: number; color?: string }[];
  total: number;
  title: string;
  accentColor: string;
}) {
  const data = items.map((item, i) => ({
    name: item.label,
    value: Number(item.amount),
    pct: total > 0 ? Math.round((Number(item.amount) / total) * 100) : 0,
    color: item.color || COLORS[i % COLORS.length],
  }));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"32px", alignItems:"center" }}>
      {/* Pie chart */}
      <div style={{ height:"280px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" labelLine={false} label={renderCustomLabel}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {data.map((item, i) => (
          <div key={i}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:item.color, flexShrink:0 }} />
                <span style={{ fontFamily:B, fontSize:"12px", color:C.forest, lineHeight:1.3 }}>{item.name}</span>
              </div>
              <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                <span style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color:item.color }}>₱{item.value.toLocaleString()}</span>
                <span style={{ fontFamily:B, fontSize:"10px", color:C.muted, width:"30px", textAlign:"right" }}>{item.pct}%</span>
              </div>
            </div>
            <div style={{ height:"6px", background:C.mist, borderRadius:"20px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${item.pct}%`, background:item.color, borderRadius:"20px", transition:"width 0.8s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashflowBar({ inflow, outflow, remaining }: { inflow: number; outflow: number; remaining: number }) {
  const data = [
    { name: "Inflow",    amount: inflow,    fill: "#1A8040" },
    { name: "Outflow",   amount: outflow,   fill: "#CC3344" },
    { name: "Remaining", amount: remaining, fill: "#156530" },
  ];

  return (
    <div style={{ height:"200px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={48}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fontFamily:SG, fontSize:11, fontWeight:700, fill:C.forest }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} tick={{ fontFamily:B, fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => [`₱${Number(v).toLocaleString()}`, ""]} contentStyle={{ fontFamily:B, borderRadius:"10px", border:`1px solid ${C.border}`, boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }} />
          <Bar dataKey="amount" radius={[6,6,0,0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
