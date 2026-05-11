export default function ColetCharacter({
  height = 148,
  animate = true,
  className = "",
}: {
  height?: number;
  animate?: boolean;
  className?: string;
}) {
  const width = Math.round(height * 100 / 148);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 148"
      fill="none"
      className={className}
      style={animate ? { animation: "cfs-bounce 2.5s ease-in-out infinite" } : {}}
      aria-label="Colet chibi character illustration"
    >
      {/* Beret hat */}
      <ellipse cx="50" cy="30" rx="30" ry="24" fill="#2CB520" stroke="#1A1E14" strokeWidth="2"/>
      <ellipse cx="62" cy="14" rx="10" ry="8" fill="#2CB520" stroke="#1A1E14" strokeWidth="1.5"/>
      {/* Hat band */}
      <rect x="22" y="44" width="56" height="9" rx="3" fill="#1A6E0E" stroke="#1A1E14" strokeWidth="2"/>
      {/* Flower on beret */}
      <ellipse cx="68" cy="22" rx="5" ry="7" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="1.5"/>
      <ellipse cx="68" cy="36" rx="5" ry="7" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="1.5"/>
      <ellipse cx="61" cy="29" rx="7" ry="5" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="1.5"/>
      <ellipse cx="75" cy="29" rx="7" ry="5" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="1.5"/>
      <circle cx="68" cy="29" r="5" fill="#F0C020" stroke="#1A1E14" strokeWidth="1.5"/>
      {/* 4-pointed star on hat */}
      <path d="M32 28L33 24.5L36.5 23.5L33 22.5L32 19L31 22.5L27.5 23.5L31 24.5Z" fill="#F0C020" stroke="#1A1E14" strokeWidth="0.8"/>
      {/* Hair */}
      <path d="M24 50 C18 58 16 72 18 84 L26 90" fill="#2A1A0A" stroke="#1A1E14" strokeWidth="1.8"/>
      <path d="M76 50 C82 58 84 72 82 84 L74 90" fill="#2A1A0A" stroke="#1A1E14" strokeWidth="1.8"/>
      <path d="M30 52 C28 60 26 66 28 72" fill="#2A1A0A" stroke="#1A1E14" strokeWidth="1.5"/>
      {/* Head */}
      <ellipse cx="50" cy="70" rx="26" ry="25" fill="#FFD9A8" stroke="#1A1E14" strokeWidth="2.5"/>
      {/* Eyes */}
      <ellipse cx="39" cy="68" rx="6" ry="7.5" fill="#1A1E14"/>
      <ellipse cx="39" cy="65" rx="3.5" ry="3.5" fill="white"/>
      <circle cx="40.5" cy="64" r="1.5" fill="white"/>
      <ellipse cx="61" cy="68" rx="6" ry="7.5" fill="#1A1E14"/>
      <ellipse cx="61" cy="65" rx="3.5" ry="3.5" fill="white"/>
      <circle cx="62.5" cy="64" r="1.5" fill="white"/>
      {/* Blush */}
      <ellipse cx="30" cy="76" rx="7" ry="4" fill="#FFB0B0" opacity="0.55"/>
      <ellipse cx="70" cy="76" rx="7" ry="4" fill="#FFB0B0" opacity="0.55"/>
      {/* Nose */}
      <circle cx="50" cy="74" r="1.5" fill="#E8A880"/>
      {/* Smile */}
      <path d="M41 81 Q50 89 59 81" stroke="#1A1E14" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M44 82 Q50 87 56 82" fill="white"/>
      {/* Neck */}
      <rect x="43" y="93" width="14" height="9" rx="3" fill="#FFD9A8" stroke="#1A1E14" strokeWidth="1.8"/>
      {/* Body / white shirt */}
      <rect x="24" y="100" width="52" height="28" rx="7" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="2.5"/>
      <path d="M40 100 L50 110 L60 100" fill="#F5F0E0" stroke="#1A1E14" strokeWidth="1.5"/>
      {/* Green bow */}
      <path d="M38 104 L50 112 L62 104" fill="#2CB520" stroke="#1A1E14" strokeWidth="1.5"/>
      <circle cx="50" cy="112" r="3.5" fill="#2CB520" stroke="#1A1E14" strokeWidth="1.2"/>
      {/* Star on shirt */}
      <path d="M32 116L33 113.5L35.5 112.5L33 111.5L32 109L31 111.5L28.5 112.5L31 113.5Z" fill="#F0C020" stroke="#1A1E14" strokeWidth="0.8"/>
      {/* Green skirt */}
      <path d="M22 126 C20 138 22 144 24 147 L76 147 C78 144 80 138 78 126 Z" fill="#2CB520" stroke="#1A1E14" strokeWidth="2.5"/>
      <line x1="38" y1="127" x2="36" y2="146" stroke="#1A6E0E" strokeWidth="1.2"/>
      <line x1="50" y1="127" x2="50" y2="147" stroke="#1A6E0E" strokeWidth="1.2"/>
      <line x1="62" y1="127" x2="64" y2="146" stroke="#1A6E0E" strokeWidth="1.2"/>
      {/* Left arm (waving) */}
      <path d="M24 106 C14 104 8 98 6 90 L14 88 C14 94 18 100 24 104Z" fill="#FFD9A8" stroke="#1A1E14" strokeWidth="2"/>
      <circle cx="10" cy="87" r="8" fill="#FFD9A8" stroke="#1A1E14" strokeWidth="1.8"/>
      {/* Right arm (holding guitar pick) */}
      <path d="M76 106 C86 104 90 96 88 88 L80 90 C80 96 78 102 76 106Z" fill="#FFD9A8" stroke="#1A1E14" strokeWidth="2"/>
      <ellipse cx="88" cy="85" rx="8" ry="8" fill="#FFD9A8" stroke="#1A1E14" strokeWidth="1.8"/>
      {/* Guitar pick */}
      <path d="M88 75 C84 75 81 78 82 81 C83 84 88 87 88 87 C88 87 93 84 94 81 C95 78 92 75 88 75Z" fill="#E86818" stroke="#1A1E14" strokeWidth="1.5"/>
      <path d="M88 78L88.8 80.4L91.2 80.4L89.3 81.8L90 84L88 82.7L86 84L86.7 81.8L84.8 80.4L87.2 80.4Z" fill="#F0C020"/>
      {/* Shoes */}
      <ellipse cx="35" cy="148" rx="13" ry="6" fill="#1A1E14"/>
      <ellipse cx="65" cy="148" rx="13" ry="6" fill="#1A1E14"/>
      <circle cx="30" cy="146" r="1.5" fill="#444"/>
      <circle cx="60" cy="146" r="1.5" fill="#444"/>
    </svg>
  );
}
