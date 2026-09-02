"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires a POST to /api/track/view on every route change so the activity
// log knows which pages members visit. Fire-and-forget: swallows all
// errors so tracking failures never affect the page.
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Skip obviously noisy paths client-side too
    if (/^\/(api|_next|favicon|robots|sitemap)/.test(pathname)) return;

    const payload = JSON.stringify({
      path: pathname,
      title: typeof document !== "undefined" ? document.title : null,
      referer: typeof document !== "undefined" ? document.referrer || null : null,
    });

    // sendBeacon is best-effort and doesn't block unload; fallback to fetch
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track/view", blob);
        return;
      }
    } catch {}
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
