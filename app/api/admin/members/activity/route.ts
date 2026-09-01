import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

interface Event { kind: string; at: string; title: string; detail?: string; href?: string; }

/**
 * Aggregates a per-member activity feed by fanning out reads across
 * every user-facing table that stores a user_id, then merging into
 * one time-ordered stream.
 */
export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = new URL(req.url).searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const LIMIT = 60;

  const [
    profileRes,
    ticketsRes,
    ordersRes,
    donationsRes,
    postsRes,
    commentsRes,
    reportsRes,
    badgesRes,
    notifsRes,
    auditRes,
  ] = await Promise.all([
    (admin as any).from("profiles").select("id, display_name, email, avatar_url, role, is_banned, created_at").eq("id", memberId).maybeSingle(),
    (admin as any).from("event_tickets").select("id, ticket_number, status, payment_status, created_at, events:event_id(title)").eq("user_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("orders").select("id, total, payment_status, order_status, created_at").eq("user_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("donations").select("id, amount, donation_amount, status, message, created_at").eq("user_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("community_posts").select("id, content, is_hidden, created_at").eq("user_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("community_comments").select("id, content, post_id, created_at").eq("user_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("community_reports").select("id, reason, status, post_id, comment_id, created_at").eq("reporter_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("user_badges").select("id, earned_at, badges:badge_id(name)").eq("user_id", memberId).order("earned_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("notifications").select("id, type, title, created_at").eq("user_id", memberId).order("created_at", { ascending: false }).limit(LIMIT),
    (admin as any).from("audit_log").select("id, action, target_type, target_id, details, created_at").or(`user_id.eq.${memberId},target_id.eq.${memberId}`).order("created_at", { ascending: false }).limit(LIMIT),
  ]);

  const events: Event[] = [];
  const peso = (n: any) => `₱${Number(n ?? 0).toLocaleString()}`;

  for (const t of (ticketsRes.data ?? []) as any[]) {
    events.push({
      kind: "ticket",
      at:   t.created_at,
      title: `Ticket ${t.status === "active" ? "confirmed" : t.status === "used" ? "used" : t.status === "cancelled" ? "cancelled" : "started"}`,
      detail: `${t.events?.title ?? "Event"} · ${t.ticket_number ?? t.id} · ${t.payment_status}`,
      href: `/admin/events`,
    });
  }
  for (const o of (ordersRes.data ?? []) as any[]) {
    events.push({
      kind: "order",
      at:   o.created_at,
      title: `Order ${o.order_status ?? "pending"} · ${o.payment_status ?? "pending"}`,
      detail: `${peso(o.total)} — ${String(o.id).slice(0, 8).toUpperCase()}`,
      href: `/admin/orders`,
    });
  }
  for (const d of (donationsRes.data ?? []) as any[]) {
    events.push({
      kind: "donation",
      at:   d.created_at,
      title: `Donation ${d.status ?? "pending"}`,
      detail: `${peso(d.donation_amount ?? d.amount)}${d.message ? ` · "${String(d.message).slice(0, 80)}"` : ""}`,
      href: `/admin/donations`,
    });
  }
  for (const p of (postsRes.data ?? []) as any[]) {
    events.push({
      kind: "post",
      at:   p.created_at,
      title: p.is_hidden ? "Post (hidden)" : "Community post",
      detail: (p.content ?? "").slice(0, 140) || "(no content)",
      href: `/members/community/${p.id}`,
    });
  }
  for (const c of (commentsRes.data ?? []) as any[]) {
    events.push({
      kind: "comment",
      at:   c.created_at,
      title: "Comment",
      detail: (c.content ?? "").slice(0, 140),
      href: c.post_id ? `/members/community/${c.post_id}` : undefined,
    });
  }
  for (const r of (reportsRes.data ?? []) as any[]) {
    events.push({
      kind: "report",
      at:   r.created_at,
      title: `Filed a report · ${r.status}`,
      detail: `Reason: ${r.reason}`,
      href: `/admin/community-reports`,
    });
  }
  for (const b of (badgesRes.data ?? []) as any[]) {
    events.push({
      kind: "badge",
      at:   b.earned_at,
      title: "Badge earned",
      detail: b.badges?.name ?? "Unknown badge",
    });
  }
  for (const n of (notifsRes.data ?? []) as any[]) {
    events.push({
      kind: "notification",
      at:   n.created_at,
      title: `Notification · ${n.type ?? "system"}`,
      detail: n.title ?? "",
    });
  }
  for (const a of (auditRes.data ?? []) as any[]) {
    events.push({
      kind: "audit",
      at:   a.created_at,
      title: `Audit · ${String(a.action).replace(/_/g, " ")}`,
      detail: [a.target_type, a.target_id ? String(a.target_id).slice(0, 20) : null].filter(Boolean).join(" · "),
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return NextResponse.json({
    profile: profileRes.data,
    counts: {
      tickets:   (ticketsRes.data ?? []).length,
      orders:    (ordersRes.data ?? []).length,
      donations: (donationsRes.data ?? []).length,
      posts:     (postsRes.data ?? []).length,
      comments:  (commentsRes.data ?? []).length,
      reports:   (reportsRes.data ?? []).length,
      badges:    (badgesRes.data ?? []).length,
      audit:     (auditRes.data ?? []).length,
    },
    events: events.slice(0, 200),
  });
}
