"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  event_reminder:    { icon: "🎫", color: "#3CCE2A", bg: "#E8F0E4" },
  order_update:      { icon: "🛍",  color: "#F07228", bg: "#3D1A0A" },
  community_reply:   { icon: "💬", color: "#F5C82A", bg: "#3D3000" },
  community_mention: { icon: "📢", color: "#F5C82A", bg: "#3D3000" },
  badge_earned:      { icon: "⭐", color: "#8EE440", bg: "#1E3010" },
  new_follower:      { icon: "👤", color: "#3CCE2A", bg: "#E8F0E4" },
  donation_ack:      { icon: "♥",  color: "#F04060", bg: "#3D0A18" },
  new_report:        { icon: "📋", color: "#3CCE2A", bg: "#E8F0E4" },
  announcement:      { icon: "📣", color: "#F07228", bg: "#3D1A0A" },
};

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  visible: boolean;
}

function playSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export default function ToastNotifications() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Get user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    const saved = localStorage.getItem("cfs_notif_sound");
    setSoundOn(saved === "true");
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const addToast = useCallback((notif: any) => {
    const toast: ToastItem = {
      id: notif.id, title: notif.title, message: notif.message,
      type: notif.type, link: notif.link, visible: true,
    };
    setToasts(prev => [...prev.slice(-2), toast]);
    if (localStorage.getItem("cfs_notif_sound") === "true") playSound();
    setTimeout(() => dismiss(toast.id), 8000);
  }, [dismiss]);

  // Realtime subscription once we have userId
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`toast_${userId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "notifications", filter: `user_id=eq.${userId}`,
      }, (payload) => addToast(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, addToast]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(120%); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: "fixed", bottom: "24px", right: "24px",
        zIndex: 9999, display: "flex", flexDirection: "column",
        gap: "8px", pointerEvents: "none",
      }}>
        {toasts.map((toast) => {
          const cfg = TYPE_CONFIG[toast.type] ?? { icon: "🔔", color: "#4A7C59", bg: "#FFFFFF" };
          return (
            <div key={toast.id} style={{
              width: "320px",
              background: "#F7FAF5",
              border: `2px solid ${cfg.color}`,
              borderRadius: "12px",
              overflow: "hidden",
              pointerEvents: "all",
              animation: toast.visible
                ? "toast-slide-in 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards"
                : "toast-slide-out 0.3s ease forwards",
            }}>
              {/* Colored top bar */}
              <div style={{ height: "3px", background: cfg.color }}/>

              <div style={{ padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                {/* Icon */}
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: cfg.bg, border: `1.5px solid ${cfg.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", flexShrink: 0,
                }}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: R, fontSize: "12px", color: cfg.color,
                    letterSpacing: "1px", marginBottom: "3px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {toast.title}
                  </div>
                  <div style={{
                    fontFamily: B, fontSize: "12px", color: "#4A7C59",
                    lineHeight: 1.5, marginBottom: toast.link ? "6px" : 0,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                  }}>
                    {toast.message}
                  </div>
                  {toast.link && (
                    <a
                      href={toast.link}
                      onClick={() => dismiss(toast.id)}
                      style={{
                        fontFamily: R, fontSize: "10px", color: cfg.color,
                        textDecoration: "none", letterSpacing: "1.5px",
                        display: "inline-block",
                      }}
                    >
                      VIEW →
                    </a>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={() => dismiss(toast.id)}
                  style={{
                    background: "transparent", border: "none",
                    color: "#5A7A60", cursor: "pointer",
                    fontSize: "14px", padding: "0", flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Auto-dismiss progress bar */}
              <div style={{ height: "2px", background: "#DDE8DD", position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", inset: 0, background: cfg.color,
                  transformOrigin: "left",
                  animation: "progress-shrink 8s linear forwards",
                }}/>
                <style>{`@keyframes progress-shrink { from{transform:scaleX(1)} to{transform:scaleX(0)} }`}</style>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
