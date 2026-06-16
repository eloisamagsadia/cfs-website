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
          CFS is the official fan community for Colet of BINI.<br />
          We&apos;re putting the final touches — see you soon!
        </p>

        {/* Follow line */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", letterSpacing: "1px" }}>
            FOLLOW US
          </span>
          <span style={{ color: "#DDE8DD" }}>·</span>
          <a
            href="https://twitter.com/coletfansociety"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", textDecoration: "none", letterSpacing: "1px" }}
          >
            X / TWITTER
          </a>
          <span style={{ color: "#DDE8DD" }}>·</span>
          <a
            href="https://www.facebook.com/coletfansociety"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", textDecoration: "none", letterSpacing: "1px" }}
          >
            FACEBOOK
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
