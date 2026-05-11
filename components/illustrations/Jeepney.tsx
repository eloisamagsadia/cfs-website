export default function Jeepney({ width = 230, className = "" }: { width?: number; className?: string }) {
  return (
    <svg
      width={width}
      height={Math.round(width * 110 / 230)}
      viewBox="0 0 230 110"
      fill="none"
      className={className}
      aria-label="CFS Jeepney illustration"
    >
      {/* Shadow */}
      <ellipse cx="115" cy="106" rx="105" ry="5" fill="#1A6E0E" opacity="0.35"/>
      {/* Chassis */}
      <rect x="20" y="68" width="188" height="10" rx="3" fill="#888" stroke="#1A1E14" strokeWidth="1.5"/>
      {/* Main body */}
      <path d="M14 24 L14 72 L214 72 L214 30 C214 24 205 18 192 18 L46 18 C30 18 14 24 14 24Z" fill="#2CB520" stroke="#1A1E14" strokeWidth="2"/>
      {/* Roof rack chrome */}
      <rect x="35" y="12" width="158" height="8" rx="3" fill="#D8D8D8" stroke="#1A1E14" strokeWidth="1.5"/>
      {/* Pennant flags */}
      {[50,70,90,110,130,150,170].map((x, i) => (
        <polygon key={x} points={`${x},12 ${x+6},4 ${x+12},12`}
          fill={["#E86818","#F0C020","#F5F0E0","#E86818","#F0C020","#7ED430","#E86818"][i]}
          stroke="#1A1E14" strokeWidth="1"/>
      ))}
      {/* Front face */}
      <rect x="3" y="24" width="18" height="46" rx="5" fill="#1A6E0E" stroke="#1A1E14" strokeWidth="2"/>
      {/* Chrome grill */}
      <rect x="4" y="30" width="16" height="26" rx="2" fill="#F0C020" stroke="#1A1E14" strokeWidth="1.5"/>
      <line x1="4" y1="36" x2="20" y2="36" stroke="#1A1E14" strokeWidth="0.8"/>
      <line x1="4" y1="42" x2="20" y2="42" stroke="#1A1E14" strokeWidth="0.8"/>
      <line x1="4" y1="48" x2="20" y2="48" stroke="#1A1E14" strokeWidth="0.8"/>
      {/* Headlight */}
      <circle cx="9" cy="26" r="5" fill="#FFFF90" stroke="#1A1E14" strokeWidth="1.2"/>
      <circle cx="9" cy="26" r="3" fill="#FFEE20"/>
      {/* Route sign */}
      <rect x="4" y="58" width="16" height="9" rx="1" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="1"/>
      <text x="12" y="65.5" fontFamily="Bangers, cursive" fontSize="5.5" fill="#1A1E14" textAnchor="middle">COLET</text>
      {/* Windows */}
      {[24,55,86,117,148,179].map((x) => (
        <rect key={x} x={x} y={20} width={26} height={26} rx={3} fill="#B0D8FF" stroke="#1A1E14" strokeWidth="1.8"/>
      ))}
      {/* Orange stripe */}
      <rect x="14" y="52" width="200" height="11" rx="0" fill="#E86818" stroke="#1A1E14" strokeWidth="1.2"/>
      <text x="80" y="61" fontFamily="Bangers, cursive" fontSize="8" fill="#F5F0E0" letterSpacing="1.5">CFS ✦ COLET FAN SUPORTA</text>
      {/* Star decoration */}
      <path d="M30 42L31.2 38.5L34.8 37L31.2 35.5L30 32L28.8 35.5L25.2 37L28.8 38.5Z" fill="#F0C020" stroke="#1A1E14" strokeWidth="0.8"/>
      {/* Flower on back */}
      <ellipse cx="202" cy="38" rx="3.5" ry="5" fill="#7ED430" stroke="#1A1E14" strokeWidth="1"/>
      <ellipse cx="202" cy="32" rx="3.5" ry="5" fill="#7ED430" stroke="#1A1E14" strokeWidth="1"/>
      <ellipse cx="196" cy="35" rx="5" ry="3.5" fill="#7ED430" stroke="#1A1E14" strokeWidth="1"/>
      <ellipse cx="208" cy="35" rx="5" ry="3.5" fill="#7ED430" stroke="#1A1E14" strokeWidth="1"/>
      <circle cx="202" cy="35" r="3.5" fill="#F0C020" stroke="#1A1E14" strokeWidth="1"/>
      {/* Front wheel */}
      <circle cx="50" cy="84" r="17" fill="#1A1E14" stroke="#1A1E14" strokeWidth="2"/>
      <circle cx="50" cy="84" r="11" fill="#C0C0C0"/>
      <circle cx="50" cy="84" r="7" fill="#888"/>
      <circle cx="50" cy="84" r="3" fill="#1A1E14"/>
      {/* Rear wheel */}
      <circle cx="170" cy="84" r="17" fill="#1A1E14" stroke="#1A1E14" strokeWidth="2"/>
      <circle cx="170" cy="84" r="11" fill="#C0C0C0"/>
      <circle cx="170" cy="84" r="7" fill="#888"/>
      <circle cx="170" cy="84" r="3" fill="#1A1E14"/>
      {/* Rear */}
      <rect x="210" y="24" width="14" height="46" rx="4" fill="#1A6E0E" stroke="#1A1E14" strokeWidth="2"/>
      <rect x="211" y="55" width="12" height="8" rx="1" fill="#E83858" stroke="#1A1E14" strokeWidth="1"/>
      <text x="217" y="61.5" fontFamily="Bangers, cursive" fontSize="5" fill="white" textAnchor="middle">STOP</text>
      <circle cx="217" cy="28" r="4" fill="#E86818" stroke="#1A1E14" strokeWidth="1"/>
    </svg>
  );
}
