import type { Metadata } from "next";
import { Righteous, DM_Serif_Display, Barlow } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
  display: "swap",
});
const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});
const barlow = Barlow({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CFS Bini Colet — Colet Fan Suporta", template: "%s | CFS Bini Colet" },
  description: "The official home of Colet Fan Suporta (CFS) — the Bini Colet fansupport community of the Philippines.",
  themeColor: "#0F1A0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${righteous.variable} ${dmSerifDisplay.variable} ${barlow.variable}`}
        suppressHydrationWarning
      >
        <body
          className="antialiased min-h-screen"
          style={{ backgroundColor: "#0F1A0B", color: "#F0EAD6", fontFamily: "var(--font-barlow, Barlow, sans-serif)" }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}