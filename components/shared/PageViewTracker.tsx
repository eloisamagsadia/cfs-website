"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires a POST to /api/track/view on route changes so the activity log
// knows which pages members visit. Fire-and-forget: swallows all errors
// so tracking failures never affect the page.
//
// Client-side dedup: same path within DEDUP_WINDOW_MS is skipped entirely.
// This saves a round-trip + a DB dedup query per navigation for the very
// common case of refreshes and quick back/forward. The server still has
// its own 30s window as a second line of defense.
const DEDUP_WINDOW_MS = 30_000;
const SS_KEY = "cfs.pageview.recent";

function recentlySeen(path: string): boolean {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, number>;
    const at = map[path];
    return typeof at === "number" && Date.now() - at < DEDUP_WINDOW_MS;
  } catch { return false; }
}

function markSeen(path: string) {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, number>;
    // Trim old entries so this stays tiny even for long sessions
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const k of Object.keys(map)) if (map[k] < cutoff) delete map[k];
    map[path] = Date.now();
    sessionStorage.setItem(SS_KEY, JSON.stringify(map));
  } catch {}
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Skip obviously noisy paths client-side too
    if (/^\/(api|_next|favicon|robots|sitemap)/.test(pathname)) return;
    // Skip if we already reported this path in the last 30s.
    if (recentlySeen(pathname)) return;
    markSeen(pathname);

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
