import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F7FAF5",
        padding: "24px",
        gap: "24px",
      }}
    >
      {/* Logo / Club name */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-righteous, Righteous, sans-serif)",
            fontSize: "22px",
            color: "#1A8040",
            letterSpacing: "2px",
          }}
        >
          CFS · BINI COLET
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "#9DB88A",
            marginTop: "4px",
            letterSpacing: "1px",
          }}
        >
          Colet Fan Suporta
        </div>
      </div>

      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#1A8040",
            colorBackground: "#FFFFFF",
            colorText: "#1B3A2D",
            colorTextSecondary: "#9DB88A",
            colorInputBackground: "#F7FAF5",
            colorInputText: "#1B3A2D",
            colorNeutral: "#DDE8DD",
            borderRadius: "10px",
            fontFamily: "var(--font-barlow, Barlow, sans-serif)",
          },
          elements: {
            card: {
              border: "1px solid #DDE8DD",
              boxShadow: "none",
              backgroundColor: "#FFFFFF",
            },
            headerTitle: {
              color: "#1B3A2D",
              fontFamily: "var(--font-righteous, Righteous, sans-serif)",
            },
            headerSubtitle: {
              color: "#9DB88A",
            },
            formButtonPrimary: {
              backgroundColor: "#1A8040",
              color: "#F7FAF5",
              fontWeight: "700",
              "&:hover": { backgroundColor: "#2db824" },
            },
            footerActionLink: {
              color: "#1A8040",
            },
            formFieldInput: {
              borderColor: "#DDE8DD",
              backgroundColor: "#F7FAF5",
              color: "#1B3A2D",
            },
            formFieldLabel: {
              color: "#9DB88A",
            },
            dividerLine: {
              backgroundColor: "#DDE8DD",
            },
            dividerText: {
              color: "#9DB88A",
            },
            socialButtonsBlockButton: {
              borderColor: "#DDE8DD",
              backgroundColor: "#F7FAF5",
              color: "#1B3A2D",
            },
          },
        }}
      />
    </div>
  );
}