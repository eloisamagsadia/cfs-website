"use client";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Point = { day: string; value: number };

interface Props {
  data: Point[];
  color?: string;
  variant?: "bar" | "line";
  valueFormatter?: (v: number) => string;
  height?: number;
}

const tooltipStyle: React.CSSProperties = {
  background: "#1B3A2D", border: "none", borderRadius: "8px", padding: "8px 12px",
  fontFamily: B, fontSize: "12px", color: "#F0EAD6",
};

function fmtDay(day: string) {
  // day comes as "YYYY-MM-DD"; render short form.
  const d = new Date(day + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function AnalyticsChart({ data, color = "#1A8040", variant = "bar", valueFormatter, height = 240 }: Props) {
  const tick = { fontFamily: SG, fontSize: 10, fill: "#5A7A60" };
  const fmt = valueFormatter ?? ((v: number) => String(v));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EDE4" vertical={false} />
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={40} tickFormatter={fmt} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} formatter={(v: any) => [fmt(Number(v)), ""]} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5, fill: color }} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4EDE4" vertical={false} />
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={40} tickFormatter={fmt} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} formatter={(v: any) => [fmt(Number(v)), ""]} cursor={{ fill: "rgba(26,128,64,0.08)" }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
