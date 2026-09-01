import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconMail, IconSend, IconEdit } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Emails" };
export const dynamic = "force-dynamic";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default async function EmailsHub() {
  const admin = createAdminClient();
  const [{ count: manualCount }, { count: autoCount }] = await Promise.all([
    (admin as any).from("email_manual_templates").select("id", { count: "exact", head: true }),
    (admin as any).from("email_templates").select("id", { count: "exact", head: true }),
  ]);

  const cards = [
    {
      href: "/admin/email",
      label: "SEND EMAIL",
      description: "Compose custom one-off emails to any group of members. Save reusable templates you can pull up later.",
      icon: <IconSend size={18} color="#1A8040" />,
      count: manualCount ?? 0,
      countLabel: "SAVED TEMPLATES",
    },
    {
      href: "/admin/email-templates",
      label: "AUTOMATED EMAIL TEMPLATES",
      description: "Edit the emails the system sends automatically — ticket confirmations, donation receipts, order confirmations, welcome.",
      icon: <IconEdit size={18} color="#1A8040" />,
      count: autoCount ?? 0,
      countLabel: "TRANSACTIONAL TEMPLATES",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>EMAILS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          Everything email-related — the manual sender and the automated templates.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {cards.map(c => (
          <Link key={c.href} href={c.href}
            style={{ textDecoration: "none", background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column", gap: "14px", transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#E8F0E4", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {c.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "2px" }}>{c.label}</div>
                <div style={{ fontFamily: SG, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.3px", marginTop: "3px" }}>{c.count} {c.countLabel}</div>
              </div>
            </div>
            <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", lineHeight: 1.6, margin: 0 }}>{c.description}</p>
            <div style={{ paddingTop: "12px", borderTop: "1px dashed #E4EDE4", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", letterSpacing: "1.5px" }}>
              OPEN →
            </div>
          </Link>
        ))}
      </div>

      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "12px", padding: "14px 16px" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.5px", marginBottom: "6px" }}>WHICH ONE DO I USE?</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#5A4A0F", lineHeight: 1.7 }}>
          <strong>Send Email</strong> — one-off broadcasts you write yourself (thank-you notes, announcements, updates).<br/>
          <strong>Automated Email Templates</strong> — the emails the system sends without you, on triggers like ticket purchases and donations. Edit these once; they apply to every future send.
        </div>
      </div>
    </div>
  );
}
