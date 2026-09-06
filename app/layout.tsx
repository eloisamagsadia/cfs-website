import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, Barlow, Caveat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import PageViewTracker from "@/components/shared/PageViewTracker";
import MaintenanceGate from "@/components/shared/MaintenanceGate";
import "./globals.css";

export const viewport = { themeColor: "#FAFDF9" };

const spaceGrotesk = Space_Grotesk({
  weight: ["300","400","500","600","700"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: ["normal","italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});
const barlow = Barlow({
  weight: ["400","500","600"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});
// Handwritten accent for scrapbook labels, memo notes, and signed
// touches. Used sparingly — never for body copy.
const caveat = Caveat({
  weight: ["400","500","600","700"],
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CFS Bini Colet — Colet Fan Suporta", template: "%s | CFS Bini Colet" },
  description: "The official home of Colet Fan Suporta (CFS) — the Bini Colet fansupport community of the Philippines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${spaceGrotesk.variable} ${dmSerifDisplay.variable} ${barlow.variable} ${caveat.variable}`}
        suppressHydrationWarning
      >
        <body
          className="antialiased min-h-screen"
          style={{ backgroundColor: "#FAFDF9", color: "#1A1A18", fontFamily: "var(--font-barlow,'Barlow',sans-serif)" }}
        >
          {/* MaintenanceGate runs everywhere — public, members, admin, super.
              Admins bypass automatically. The announcement banner is rendered
              by the (public) and (members) nested layouts, which own their
              own header/footer chrome. */}
          <MaintenanceGate>{children}</MaintenanceGate>
          <PageViewTracker />
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            duration={4000}
            toastOptions={{
              style: {
                fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
                fontSize: "13px",
                borderRadius: "12px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
