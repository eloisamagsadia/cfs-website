import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
import { IconMail, IconEdit } from "@/components/shared/Icons";
import { TEMPLATE_META, type TemplateKey } from "@/lib/email-template-vars";

export const metadata: Metadata = { title: "Email Templates" };
export const dynamic = "force-dynamic";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default async function AdminEmailTemplatesPage() {
  const admin = createAdminClient();
  const { data: rows } = await (admin as any)
    .from("email_templates")
    .select("key, subject, updated_at, updated_by")
    .order("key", { ascending: true });

  const byKey = new Map<string, any>((rows ?? []).map((r: any) => [r.key, r]));
  const keys = Object.keys(TEMPLATE_META) as TemplateKey[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>EMAIL TEMPLATES</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          Edit the subject line and HTML body sent for each automated email. Changes take effect immediately.
        </p>
      </div>

      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "18px" }}>⚠️</span>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", lineHeight: 1.6 }}>
          <strong>Heads up:</strong> Template variables like <code style={{ background: "#FFF3D6", padding: "1px 6px", borderRadius: "4px" }}>{"{{event_title}}"}</code> are replaced at send time. Keep required variables in place — removing <code>{"{{qr_src}}"}</code> from the ticket template will break the QR embed. If a template errors, the send falls back to the original built-in HTML so nothing bounces.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
        {keys.map(key => {
          const row = byKey.get(key);
          const meta = TEMPLATE_META[key];
          const updated = row?.updated_at ? new Date(row.updated_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) : null;
          return (
            <Link key={key} href={`/admin/email-templates/${key}`}
              style={{ textDecoration: "none", background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px", transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#E8F0E4", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <IconMail size={16} color="#1A8040" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1.5px" }}>{meta.label.toUpperCase()}</div>
                  <div style={{ fontFamily: SG, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1.2px" }}>{key}</div>
                </div>
                <IconEdit size={14} color="#5A7A60" />
              </div>
              <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", lineHeight: 1.5 }}>{meta.description}</div>
              <div style={{ paddingTop: "8px", borderTop: "1px dashed #E4EDE4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{row?.subject ?? "—"}</span>
                {updated && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1px" }}>UPDATED {updated}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
