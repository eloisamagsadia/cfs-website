const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080F06",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background radial glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, #1A3D0F22 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top accent line */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, transparent, #3CCE2A, #8AAA78, #3CCE2A, transparent)",
      }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: "560px" }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-block",
          fontFamily: B,
          fontSize: "11px",
          color: "#3CCE2A",
          letterSpacing: "4px",
          textTransform: "uppercase",
          border: "1px solid #2C4820",
          borderRadius: "20px",
          padding: "5px 18px",
          marginBottom: "32px",
          background: "#3CCE2A12",
        }}>
          BINI COLET FAN SOCIETY
        </div>

        {/* Main heading */}
        <h1 style={{
          fontFamily: R,
          fontSize: "clamp(3rem, 10vw, 5.5rem)",
          color: "#F0EAD6",
          letterSpacing: "6px",
          margin: "0 0 8px",
          lineHeight: 1,
        }}>
          COMING
        </h1>
        <h1 style={{
          fontFamily: R,
          fontSize: "clamp(3rem, 10vw, 5.5rem)",
          color: "#3CCE2A",
          letterSpacing: "6px",
          margin: "0 0 40px",
          lineHeight: 1,
        }}>
          SOON
        </h1>

        {/* Divider */}
        <div style={{
          width: "60px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #3CCE2A, transparent)",
          margin: "0 auto 36px",
        }} />

        {/* Launch date */}
        <p style={{
          fontFamily: B,
          fontSize: "18px",
          color: "#8AAA78",
          letterSpacing: "2px",
          margin: "0 0 12px",
          textTransform: "uppercase",
        }}>
          Launching June 17, 2026
        </p>

        <p style={{
          fontFamily: B,
          fontSize: "13px",
          color: "#4A6240",
          letterSpacing: "1px",
          margin: "0 0 48px",
          lineHeight: 1.7,
        }}>
          CFS is the official fan community for Colet of BINI.<br />
          We&apos;re putting the final touches — see you tomorrow!
        </p>

        {/* Follow line */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", letterSpacing: "1px" }}>
            FOLLOW US FOR UPDATES
          </span>
          <span style={{ color: "#2C4820" }}>·</span>
          <a
            href="https://twitter.com/coletfansociety"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A", textDecoration: "none", letterSpacing: "1px" }}
          >
            X / TWITTER
          </a>
          <span style={{ color: "#2C4820" }}>·</span>
          <a
            href="https://www.facebook.com/coletfansociety"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A", textDecoration: "none", letterSpacing: "1px" }}
          >
            FACEBOOK
          </a>
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, transparent, #3CCE2A, #8AAA78, #3CCE2A, transparent)",
      }} />

      {/* Members login link — subtle */}
      <div style={{ position: "absolute", bottom: "20px", right: "24px" }}>
        <a href="/members" style={{
          fontFamily: B,
          fontSize: "11px",
          color: "#2C4820",
          textDecoration: "none",
          letterSpacing: "1px",
        }}>
          MEMBER LOGIN →
        </a>
      </div>
    </div>
  );
}
