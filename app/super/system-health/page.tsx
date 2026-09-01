import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck, IconWarning, IconX } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "System Health" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// ─── HELPERS ────────────────────────────────────────────────────────────────

type Status = "ok" | "warn" | "err";

function fmtAge(iso: string | null): { text: string; hours: number } {
  if (!iso) return { text: "never", hours: Infinity };
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  const hours = ms / (60 * 60 * 1000);
  if (mins < 1)  return { text: "just now", hours };
  if (mins < 60) return { text: `${mins}m ago`, hours };
  const h = Math.floor(mins / 60);
  if (h < 24)    return { text: `${h}h ago`, hours };
  const d = Math.floor(h / 24);
  return { text: `${d}d ago`, hours };
}

/** Turn an age (hours) + warn/err thresholds into a status. */
function ageStatus(hours: number, warnAfter: number, errAfter: number): Status {
  if (!isFinite(hours)) return "err";
  if (hours >= errAfter) return "err";
  if (hours >= warnAfter) return "warn";
  return "ok";
}

const STATUS_STYLE: Record<Status, { bg: string; fg: string; label: string; icon: React.ReactNode }> = {
  ok:   { bg: "#E8F0E4", fg: "#156530", label: "HEALTHY",  icon: <IconCheck   size={11} color="#156530" /> },
  warn: { bg: "#FFF3D6", fg: "#7A5A0F", label: "WATCH",    icon: <IconWarning size={11} color="#7A5A0F" /> },
  err:  { bg: "#FFE8EC", fg: "#8A1E27", label: "ATTENTION",icon: <IconX       size={11} color="#8A1E27" /> },
};

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default async function SystemHealthPage() {
  const db = createAdminClient();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Environment presence (server-side only reads presence, never values)
  const env = {
    supabase_url:            !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon:           !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_role:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    clerk_publishable:       !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerk_secret:            !!process.env.CLERK_SECRET_KEY,
    clerk_webhook_secret:    !!process.env.CLERK_WEBHOOK_SECRET,
    paymongo_secret:         !!process.env.PAYMONGO_SECRET_KEY,
    paymongo_webhook_secret: !!process.env.PAYMONGO_WEBHOOK_SECRET,
    resend_api:              !!process.env.RESEND_API_KEY,
    resend_from:             !!process.env.RESEND_FROM_EMAIL,
    r2_endpoint:             !!process.env.R2_ENDPOINT,
    r2_bucket:               !!process.env.R2_BUCKET,
    site_url:                !!process.env.NEXT_PUBLIC_SITE_URL,
  };

  // Freshness of critical tables + 24h insert counts
  const [
    { data: lastProfile },   { count: profilesLast24 },
    { data: lastEvent },     { count: eventsLast24 },
    { data: lastTicket },    { count: ticketsLast24 },
    { data: lastDonation },  { count: donationsLast24 },
    { data: lastOrder },     { count: ordersLast24 },
    { data: lastPost },      { count: postsLast24 },
    { data: lastPaymentTx }, { count: paymentTx24 },
    { data: lastAudit },     { count: auditLast24 },
  ] = await Promise.all([
    db.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("events").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("events").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("event_tickets").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("event_tickets").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("donations").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("donations").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("orders").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("orders").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("community_posts").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("community_posts").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("payment_transactions").select("created_at, paid_at, status").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("payment_transactions").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),

    (db as any).from("audit_log").select("created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    (db as any).from("audit_log").select("*", { count: "exact", head: true }).gte("created_at", cutoff24h),
  ]);

  // Freshness rows — a row is "healthy" if there's been activity within
  // (warnAfter) hours. If the table itself is inherently low-volume
  // (events, orders), set generous thresholds.
  const freshness: { label: string; last: string | null; recent: number; warnH: number; errH: number }[] = [
    { label: "Profiles (Clerk sync)",  last: (lastProfile as any)?.created_at ?? null,   recent: profilesLast24 ?? 0, warnH: 24 * 3, errH: 24 * 14 },
    { label: "Events",                 last: (lastEvent as any)?.created_at ?? null,     recent: eventsLast24 ?? 0,   warnH: 24 * 30, errH: 24 * 90 },
    { label: "Event tickets",          last: (lastTicket as any)?.created_at ?? null,    recent: ticketsLast24 ?? 0,  warnH: 24 * 7,  errH: 24 * 30 },
    { label: "Donations",              last: (lastDonation as any)?.created_at ?? null,  recent: donationsLast24 ?? 0,warnH: 24 * 7,  errH: 24 * 30 },
    { label: "Shop orders",            last: (lastOrder as any)?.created_at ?? null,     recent: ordersLast24 ?? 0,   warnH: 24 * 14, errH: 24 * 60 },
    { label: "Community posts",        last: (lastPost as any)?.created_at ?? null,      recent: postsLast24 ?? 0,    warnH: 24 * 3,  errH: 24 * 14 },
    { label: "Payment transactions",   last: (lastPaymentTx as any)?.created_at ?? null, recent: paymentTx24 ?? 0,    warnH: 24 * 7,  errH: 24 * 30 },
    { label: "Audit log",              last: (lastAudit as any)?.created_at ?? null,     recent: auditLast24 ?? 0,    warnH: 24 * 14, errH: 24 * 30 },
  ];

  // PayMongo + Clerk gating
  const paymongoWebhookOk = env.paymongo_webhook_secret && env.paymongo_secret;
  const clerkWebhookOk    = env.clerk_webhook_secret;
  const resendOk          = env.resend_api;
  const storageOk         = env.r2_endpoint && env.r2_bucket;

  const lastPtxAge = fmtAge((lastPaymentTx as any)?.created_at ?? null);
  const lastPtxStatus: Status = !paymongoWebhookOk ? "err" : (lastPaymentTx as any)?.status === "paid" ? "ok" : "warn";

  const envMissing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k);
  const envStatus: Status = envMissing.length === 0 ? "ok" : envMissing.some(k => ["supabase_service_role","clerk_secret","paymongo_secret","resend_api"].includes(k)) ? "err" : "warn";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>SYSTEM HEALTH</h1>
          <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Passive snapshot — nothing on this page pings external services or modifies state.</p>
        </div>
      </div>

      {/* Top-line status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        <StatusCard label="Environment"      status={envStatus}    detail={envMissing.length === 0 ? "All env vars present" : `${envMissing.length} missing`} />
        <StatusCard label="PayMongo webhook" status={lastPtxStatus} detail={paymongoWebhookOk ? `Last tx ${lastPtxAge.text}` : "Missing secret"} />
        <StatusCard label="Clerk webhook"    status={clerkWebhookOk ? "ok" : "err"} detail={clerkWebhookOk ? `Last profile ${fmtAge((lastProfile as any)?.created_at ?? null).text}` : "Missing CLERK_WEBHOOK_SECRET"} />
        <StatusCard label="Email (Resend)"   status={resendOk ? "ok" : "err"}       detail={resendOk ? "API key configured" : "Missing RESEND_API_KEY"} />
        <StatusCard label="Media (R2)"       status={storageOk ? "ok" : "err"}      detail={storageOk ? "R2 configured" : "Missing R2 env vars"} />
      </div>

      {/* Table freshness */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>TABLE FRESHNESS · 24H INSERTS</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "8px 20px", background: "#FBFDFB", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", borderBottom: "1px solid #F0F5F0" }}>
          <span>TABLE</span>
          <span>LAST ROW</span>
          <span>NEW · 24H</span>
          <span style={{ textAlign: "right" }}>STATUS</span>
        </div>
        {freshness.map((row, i) => {
          const age = fmtAge(row.last);
          const s = ageStatus(age.hours, row.warnH, row.errH);
          const st = STATUS_STYLE[s];
          return (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", alignItems: "center", padding: "10px 20px", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", borderTop: "1px solid #F0F5F0" }}>
              <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontFamily: B, fontSize: "12px", color: age.hours > row.warnH ? "#8A1E27" : "#3A5A30" }} title={row.last ?? "never"}>{age.text}</span>
              <span style={{ fontFamily: R, fontSize: "13px", color: row.recent > 0 ? "#1A8040" : "#7A8E7A", letterSpacing: "0.5px" }}>{row.recent}</span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: st.fg, background: st.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>
                  {st.icon} {st.label}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Environment variable presence table */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>ENVIRONMENT VARIABLES</div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "3px" }}>Only presence is checked — values are never read or displayed.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 0 }}>
          {Object.entries(env).map(([key, present], i) => (
            <div key={key} style={{ padding: "10px 14px", borderTop: "1px solid #F0F5F0", borderRight: i % 2 === 0 ? "1px solid #F0F5F0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key.toUpperCase()}</code>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: present ? "#156530" : "#8A1E27", background: present ? "#E8F0E4" : "#FFE8EC", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>
                {present ? <IconCheck size={10} color="#156530" /> : <IconX size={10} color="#8A1E27" />}
                {present ? "SET" : "MISSING"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", textAlign: "center", padding: "0 12px" }}>
        Data snapshot: {new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })} PHT.
      </div>
    </div>
  );
}

function StatusCard({ label, status, detail }: { label: string; status: Status; detail: string }) {
  const st = STATUS_STYLE[status];
  return (
    <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>{label.toUpperCase()}</div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: st.fg, background: st.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>
          {st.icon} {st.label}
        </span>
      </div>
      <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{detail}</div>
    </div>
  );
}
