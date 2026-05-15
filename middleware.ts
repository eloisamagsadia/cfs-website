import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/shop(.*)",
    "/events(.*)",
    "/projects(.*)",
    "/reports(.*)",
    "/donate(.*)",
    "/api/community/posts",
  ],

  async afterAuth(auth, req) {
    const { userId, sessionClaims } = auth;
    const pathname = req.nextUrl.pathname;

    if (userId && (pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/login" || pathname === "/register")) {
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
      const role = (sessionClaims?.metadata as { role?: string })?.role;
      if (!["admin", "super_admin"].includes(role ?? "")) {
        const url = req.nextUrl.clone();
        url.pathname = "/members";
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
      const role = (sessionClaims?.metadata as { role?: string })?.role;
      if (role !== "super_admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/members";
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