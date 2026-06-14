import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, Barlow } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

export const metadata: Metadata = {
  title: { default: "CFS Bini Colet — Colet Fan Suporta", template: "%s | CFS Bini Colet" },
  description: "The official home of Colet Fan Suporta (CFS) — the Bini Colet fansupport community of the Philippines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${spaceGrotesk.variable} ${dmSerifDisplay.variable} ${barlow.variable}`}
        suppressHydrationWarning
      >
        <body
          className="antialiased min-h-screen"
          style={{ backgroundColor: "#FAFDF9", color: "#1A1A18", fontFamily: "var(--font-barlow,'Barlow',sans-serif)" }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
