"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [notifSettings, setNotifSettings] = useState({
    email_community_replies: true,
    email_event_reminders: true,
    email_order_updates: true,
    email_badge_earned: true,
    email_new_follower: false,
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    loadSettings();
  }, [isLoaded, user]);

  async function loadSettings() {
    const res = await fetch(`/api/profile/notifications?userId=${user!.id}`);
    const n = await res.json();
    if (n && !n.error) setNotifSettings({
      email_community_replies: n.email_community_replies ?? true,
      email_event_reminders: n.email_event_reminders ?? true,
      email_order_updates: n.email_order_updates ?? true,
      email_badge_earned: n.email_badge_earned ?? true,
      email_new_follower: n.email_new_follower ?? false,
    });
    setLoading(false);
  }

  async function saveNotifications() {
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch(`/api/profile/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user!.id, ...notifSettings }),
    });
    const data = await res.json();
    const err = data.error ? { message: data.error } : null;
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess("Notification preferences saved!");
    setTimeout(() => setSuccess(""), 3000);
  }

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "—";

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#243520", border: "1.5px solid #2C4820",
    borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6",
    fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box",
  };

  const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: () => void; label: string; desc: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #2C4820" }}>
      <div>
        <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{label}</div>
        <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{desc}</div>
      </div>
      <div onClick={onChange} style={{ width: "40px", height: "22px", borderRadius: "11px", background: value ? "#3CCE2A" : "#2C4820", border: "2px solid #080F06", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.2s" }}>
        <div style={{ position: "absolute", top: "2px", left: value ? "18px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#F0EAD6", transition: "left 0.2s" }}/>
      </div>
    </div>
  );

  if (!isLoaded || loading) return (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>SETTINGS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Account preferences and security</p>
      </div>

      {/* Account info */}
      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "2px", marginBottom: "14px" }}>ACCOUNT</div>
        <div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Email Address</div>
          <div style={{ fontFamily: B, fontSize: "14px", color: "#F0EAD6", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px" }}>{email}</div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginTop: "4px" }}>To change your email or password, visit your <a href="https://accounts.clerk.dev/user" target="_blank" rel="noreferrer" style={{ color: "#3CCE2A" }}>Clerk account settings</a>.</div>
        </div>
      </div>

      {/* Notification settings */}
      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "2px", marginBottom: "4px" }}>EMAIL NOTIFICATIONS</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", marginBottom: "14px" }}>Choose what emails you receive from CFS</div>

        <Toggle value={notifSettings.email_community_replies} onChange={() => setNotifSettings(p => ({ ...p, email_community_replies: !p.email_community_replies }))} label="Community Replies" desc="When someone comments on or reacts to your post"/>
        <Toggle value={notifSettings.email_event_reminders} onChange={() => setNotifSettings(p => ({ ...p, email_event_reminders: !p.email_event_reminders }))} label="Event Reminders" desc="Reminders for events you've registered for"/>
        <Toggle value={notifSettings.email_order_updates} onChange={() => setNotifSettings(p => ({ ...p, email_order_updates: !p.email_order_updates }))} label="Order Updates" desc="Shipping and delivery updates for your orders"/>
        <Toggle value={notifSettings.email_badge_earned} onChange={() => setNotifSettings(p => ({ ...p, email_badge_earned: !p.email_badge_earned }))} label="Badge Earned" desc="When you earn a new CFS badge"/>
        <Toggle value={notifSettings.email_new_follower} onChange={() => setNotifSettings(p => ({ ...p, email_new_follower: !p.email_new_follower }))} label="New Follower" desc="When someone follows you in the community"/>

        <button onClick={saveNotifications} disabled={saving}
          style={{ marginTop: "16px", fontFamily: R, fontSize: "12px", background: saving ? "#1A3D14" : "#3CCE2A", color: saving ? "#5A7A50" : "#080F06", border: "2px solid #080F06", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", letterSpacing: "1.5px" }}>
          {saving ? "SAVING..." : "SAVE PREFERENCES"}
        </button>
      </div>

      {/* Danger zone */}
      <div style={{ background: "#1A0A0A", border: "2px solid #3D0A18", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#F04060", letterSpacing: "2px", marginBottom: "10px" }}>DANGER ZONE</div>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", marginBottom: "14px", lineHeight: 1.6 }}>
          Deleting your account is permanent and cannot be undone. All your posts, orders, and data will be removed.
        </p>
        <button style={{ fontFamily: R, fontSize: "12px", background: "transparent", border: "1.5px solid #F04060", borderRadius: "6px", color: "#F04060", padding: "8px 18px", cursor: "pointer", letterSpacing: "1px" }}>
          DELETE ACCOUNT
        </button>
      </div>

      {error && <div style={{ background: "#3D0A18", border: "1.5px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}
      {success && <div style={{ background: "#1A3D14", border: "1.5px solid #3CCE2A", borderRadius: "8px", padding: "12px 16px", fontFamily: R, fontSize: "13px", color: "#3CCE2A", letterSpacing: "1px" }}>✦ {success}</div>}
    </div>
  );
}