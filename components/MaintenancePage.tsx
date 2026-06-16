const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFDF9",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Soft radial background */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "700px",
        height: "700px",
        background: "radial-gradient(circle, #E4F0E4 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Decorative circles */}
      {[480, 340, 220].map((size, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          border: "1px solid #DDE8DD",
          pointerEvents: "none",
        }} />
      ))}

      <div style={{ position: "relative", textAlign: "center", maxWidth: "560px" }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-block",
          fontFamily: B,
          fontSize: "10px",
          color: "#4A7C59",
          letterSpacing: "3px",
          textTransform: "uppercase",
          border: "1px solid #DDE8DD",
          borderRadius: "20px",
          padding: "5px 18px",
          marginBottom: "36px",
          background: "#F2F7F2",
        }}>
          BINI COLET FAN SOCIETY
        </div>

        {/* Main heading */}
        <h1 style={{
          fontFamily: S,
          fontSize: "clamp(3rem, 10vw, 5.5rem)",
          color: "#1B3A2D",
          margin: "0 0 4px",
          lineHeight: 1.05,
          letterSpacing: "-1px",
        }}>
          Coming Soon
        </h1>

        <p style={{
          fontFamily: S,
          fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
          color: "#4A7C59",
          fontStyle: "italic",
          margin: "0 0 40px",
          lineHeight: 1.2,
        }}>
          The Ace is on her way.
        </p>

        {/* Divider */}
        <div style={{
          width: "48px",
          height: "2px",
          background: "#DDE8DD",
          margin: "0 auto 36px",
        }} />

        {/* Launch date */}
        <p style={{
          fontFamily: B,
          fontSize: "15px",
          color: "#1B3A2D",
          letterSpacing: "1px",
          margin: "0 0 10px",
          fontWeight: 600,
        }}>
          Launching July 1, 2026
        </p>

        <p style={{
          fontFamily: B,
          fontSize: "13px",
          color: "#7A8E7A",
          margin: "0 0 48px",
          lineHeight: 1.8,
        }}>
          CFS (Colet Fan Suporta) is a fan support group for Colet of BINI.<br />
          We&apos;re putting the final touches — see you soon!
        </p>

        {/* Follow line */}
        <p style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", letterSpacing: "1px", margin: "0 0 20px", textTransform: "uppercase" }}>
          Follow us for updates
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          {/* Twitter / X */}
          <a href="https://twitter.com/coletfansuporta" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1B3A2D", textDecoration: "none", fontFamily: B, fontSize: "12px", padding: "10px 18px", border: "1.5px solid #DDE8DD", borderRadius: "8px", background: "#F2F7F2", transition: "border-color 0.15s" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter
          </a>

          {/* Facebook */}
          <a href="https://facebook.com/coletfansuporta" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1B3A2D", textDecoration: "none", fontFamily: B, fontSize: "12px", padding: "10px 18px", border: "1.5px solid #DDE8DD", borderRadius: "8px", background: "#F2F7F2" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>

          {/* Instagram */}
          <a href="https://instagram.com/coletfansuporta" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1B3A2D", textDecoration: "none", fontFamily: B, fontSize: "12px", padding: "10px 18px", border: "1.5px solid #DDE8DD", borderRadius: "8px", background: "#F2F7F2" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Instagram
          </a>
        </div>
      </div>

      {/* Members login link — subtle, bottom right */}
      <div style={{ position: "absolute", bottom: "24px", right: "28px" }}>
        <a href="/members" style={{
          fontFamily: B,
          fontSize: "11px",
          color: "#C0CEC0",
          textDecoration: "none",
          letterSpacing: "1px",
        }}>
          MEMBER LOGIN →
        </a>
      </div>
    </div>
  );
}
