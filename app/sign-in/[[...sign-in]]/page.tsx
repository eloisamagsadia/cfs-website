import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F1A0B",
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
            color: "#3CCE2A",
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

      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#3CCE2A",
            colorBackground: "#1A2614",
            colorText: "#F0EAD6",
            colorTextSecondary: "#9DB88A",
            colorInputBackground: "#0F1A0B",
            colorInputText: "#F0EAD6",
            colorNeutral: "#2C4820",
            borderRadius: "10px",
            fontFamily: "var(--font-barlow, Barlow, sans-serif)",
          },
          elements: {
            card: {
              border: "1px solid #2C4820",
              boxShadow: "none",
              backgroundColor: "#1A2614",
            },
            headerTitle: {
              color: "#F0EAD6",
              fontFamily: "var(--font-righteous, Righteous, sans-serif)",
            },
            headerSubtitle: {
              color: "#9DB88A",
            },
            formButtonPrimary: {
              backgroundColor: "#3CCE2A",
              color: "#0F1A0B",
              fontWeight: "700",
              "&:hover": { backgroundColor: "#2db824" },
            },
            footerActionLink: {
              color: "#3CCE2A",
            },
            identityPreviewText: {
              color: "#F0EAD6",
            },
            formFieldInput: {
              borderColor: "#2C4820",
              backgroundColor: "#0F1A0B",
              color: "#F0EAD6",
            },
            formFieldLabel: {
              color: "#9DB88A",
            },
            dividerLine: {
              backgroundColor: "#2C4820",
            },
            dividerText: {
              color: "#9DB88A",
            },
            socialButtonsBlockButton: {
              borderColor: "#2C4820",
              backgroundColor: "#0F1A0B",
              color: "#F0EAD6",
            },
          },
        }}
      />
    </div>
  );
}