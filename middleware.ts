import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { isOwner } from "@/lib/hidden-admins";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/api/paymongo/webhook",
    "/payment(.*)",
    "/api/payment/status",
    "/shop(.*)",
    "/events(.*)",
    "/projects(.*)",
    "/reports(.*)",
    "/donate(.*)",
    "/api/community/posts",
    "/verify(.*)",
    "/support(.*)",
    "/faq(.*)",
    "/api/track/(.*)",
  ],

  async afterAuth(auth, req) {
    const { userId, sessionClaims } = auth;
    const pathname = req.nextUrl.pathname;
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const isPrivileged = role === "admin" || role === "super_admin";

    // Soft launch: only the events page is public. Other public sections are
    // hidden until they're ready. Admins/super_admins can still preview.
    const gatedPrefixes = ["/donate", "/shop", "/reports", "/projects"];
    if (!isPrivileged && gatedPrefixes.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (userId && (pathname === "/" || pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/login" || pathname === "/register")) {
      const url = req.nextUrl.clone();
      url.pathname = "/members";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/members") && !userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin")) {
      if (!userId) {
        const url = req.nextUrl.clone();
        url.pathname = "/sign-in";
        url.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(url);
      }
      // Event-day volunteers: normal member accounts flagged with
      // publicMetadata.is_event_staff. They keep the full members
      // experience, and additionally get access to /admin/check-in
      // ONLY. Anything else under /admin bounces them back.
      const isEventStaff = !!(sessionClaims?.metadata as { is_event_staff?: boolean })?.is_event_staff;
      if (isEventStaff && !["admin", "super_admin"].includes(role ?? "")) {
        if (pathname.startsWith("/admin/check-in")) return NextResponse.next();
        const url = req.nextUrl.clone();
        url.pathname = "/admin/check-in";
        return NextResponse.redirect(url);
      }
      // Reuse the `role` we already read at the top instead of re-reading
      // sessionClaims.metadata (saves the object lookup on every /admin request).
      if (!["admin", "super_admin"].includes(role ?? "")) {
        const url = req.nextUrl.clone();
        url.pathname = "/members";
        return NextResponse.redirect(url);
      }
      // Super-admin-only pages that happen to live under the /admin tree.
      // Regular admins get redirected to /admin so they never land on a
      // page whose actions all 403 for them.
      // NOTE: /admin/refunds is now open to admin — do NOT add it back.
      const superOnlyAdminPrefixes = ["/admin/super"];
      if (role !== "super_admin" && superOnlyAdminPrefixes.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
    if (pathname.startsWith("/super")) {
      if (!userId) {
        const url = req.nextUrl.clone();
        url.pathname = "/sign-in";
        url.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(url);
      }
      // Reuse the `role` read at the top.
      if (role !== "super_admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/members";
        return NextResponse.redirect(url);
      }
      // /super/system-health is owner-only. Even super_admins who aren't
      // the hidden owner get bounced back to /super so they never see the
      // diagnostics page (uptime, env leaks, DB stats).
      if (pathname.startsWith("/super/system-health") && !isOwner(userId)) {
        const url = req.nextUrl.clone();
        url.pathname = "/super";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};