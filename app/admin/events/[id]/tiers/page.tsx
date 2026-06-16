"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const TIER_COLORS = ["#3CCE2A", "#F07228", "#F5C82A", "#F04060", "#69C9D0", "#8EE440"];

const DEFAULT_FORM = { name: "", price: 0, capacity: "", perks: "", color: "#3CCE2A" };

export default function EventTiersPage() {
  const { id: event_id } = useParams();
  const router = useRouter();
  const [tiers, setTiers] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<any>({ bg_color: "#F7FAF5", accent_color: "#3CCE2A", bg_image_url: "", logo_url: "", custom_message: "" });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/tiers?event_id=${event_id}`).then(r => r.json()),
      fetch(`/api/admin/events/${event_id}`).then(r => r.json()).catch(() => ({ event: null })),
      fetch(`/api/events/ticket-template?event_id=${event_id}`).then(r => r.json()),
    ]).then(([tiersData, eventData, templateData]) => {
      setTiers(tiersData.tiers ?? []);
      setEvent(eventData.event ?? null);
      if (templateData.template) setTemplate(templateData.template);
      setLoading(false);
    });
  }, [event_id]);

  async function handleSave() {
    if (!form.name.trim()) { setError("Tier name is required"); return; }
    setSaving(true); setError("");
    const body = {
      ...(editingId ? { id: editingId } : { event_id }),
      name: form.name,
      price: Number(form.price),
      capacity: form.capacity ? Number(form.capacity) : null,
      perks: form.perks.split("\n").map(p => p.trim()).filter(Boolean),
      color: form.color,
    };
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch("/api/events/tiers", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setSaving(false); return; }
    if (editingId) {
      setTiers(prev => prev.map(t => t.id === editingId ? data.tier : t));
    } else {
      setTiers(prev => [...prev, data.tier]);
    }
    setForm(DEFAULT_FORM); setEditingId(null); setShowForm(false); setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tier?")) return;
    await fetch(`/api/events/tiers?id=${id}`, { method: "DELETE" });
    setTiers(prev => prev.filter(t => t.id !== id));
  }

  function startEdit(tier: any) {
    setForm({
      name: tier.name,
      price: tier.price,
      capacity: tier.capacity ?? "",
      perks: (tier.perks ?? []).join("\n"),
      color: tier.color ?? "#3CCE2A",
    });
    setEditingId(tier.id);
    setShowForm(true);
  }

  async function saveTemplate() {
    setSavingTemplate(true);
    const res = await fetch("/api/events/ticket-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id, ...template }),
    });
    const data = await res.json();
    if (data.template) { setTemplate(data.template); setTemplateSaved(true); setTimeout(() => setTemplateSaved(false), 2000); }
    setSavingTemplate(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <Link href="/admin/events" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none" }}>← Events</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "3px", margin: "4px 0" }}>TIERS</h1>
          {event && <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", margin: 0 }}>{event.title}</p>}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href={`/admin/events/${event_id}/tickets`}
            style={{ fontFamily: R, fontSize: "11px", color: "#F07228", textDecoration: "none", border: "1.5px solid #F07228", borderRadius: "6px", padding: "8px 14px", letterSpacing: "1px" }}>
            🎫 VIEW TICKETS
          </Link>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM); }}
            style={{ fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
            + ADD TIER
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#FFFFFF", border: "2px solid #3CCE2A", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "16px" }}>
            {editingId ? "EDIT TIER" : "NEW TIER"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>TIER NAME *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. General, VIP, VVIP"
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>PRICE (₱)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                placeholder="0 = Free"
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>CAPACITY (leave blank = unlimited)</label>
              <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                placeholder="e.g. 100"
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "8px" }}>COLOR</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TIER_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: form.color === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>PERKS (one per line)</label>
              <textarea value={form.perks} onChange={e => setForm(p => ({ ...p, perks: e.target.value }))}
                placeholder={"Priority entry\nMeet & greet\nExclusive merch"}
                rows={3}
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
          {error && <p style={{ fontFamily: B, fontSize: "12px", color: "#F04060", margin: "8px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(DEFAULT_FORM); setError(""); }}
              style={{ fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px", opacity: saving ? 0.7 : 1 }}>
              {saving ? "SAVING..." : editingId ? "UPDATE TIER" : "CREATE TIER"}
            </button>
          </div>
        </div>
      )}

      {/* Tiers list */}
      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : tiers.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎟️</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px" }}>NO TIERS YET</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "6px" }}>Add tiers to define ticket types for this event.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{ background: "#FFFFFF", border: `2px solid ${tier.color}40`, borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: tier.color, flexShrink: 0, marginTop: "4px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{tier.name}</span>
                  <span style={{ fontFamily: R, fontSize: "12px", color: tier.price > 0 ? "#F07228" : "#3CCE2A" }}>
                    {tier.price > 0 ? `₱${Number(tier.price).toLocaleString()}` : "FREE"}
                  </span>
                  {tier.capacity && (
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>
                      {tier.slots_remaining ?? tier.capacity}/{tier.capacity} slots
                    </span>
                  )}
                  {!tier.is_active && (
                    <span style={{ fontFamily: R, fontSize: "10px", color: "#F04060", background: "#3D0A14", borderRadius: "20px", padding: "1px 8px" }}>INACTIVE</span>
                  )}
                </div>
                {tier.perks?.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {tier.perks.map((perk: string) => (
                      <span key={perk} style={{ fontFamily: B, fontSize: "10px", color: tier.color, background: tier.color + "20", borderRadius: "20px", padding: "2px 10px" }}>{perk}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => startEdit(tier)}
                  style={{ fontFamily: B, fontSize: "11px", background: "none", border: "1px solid #DDE8DD", borderRadius: "6px", color: "#4A7C59", padding: "5px 10px", cursor: "pointer" }}>
                  ✏ EDIT
                </button>
                <button onClick={() => handleDelete(tier.id)}
                  style={{ fontFamily: B, fontSize: "11px", background: "none", border: "1px solid #F04060", borderRadius: "6px", color: "#F04060", padding: "5px 10px", cursor: "pointer" }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Ticket Template */}
      <div className="tiers-template-card" style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontFamily: R, fontSize: "13px", color: "#F07228", letterSpacing: "2px", marginBottom: "16px" }}>🎨 TICKET TEMPLATE</div>
        <div className="ticket-template-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>BACKGROUND COLOR</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={template.bg_color} onChange={e => setTemplate((p: any) => ({ ...p, bg_color: e.target.value }))}
                style={{ width: "40px", height: "36px", borderRadius: "6px", border: "1.5px solid #DDE8DD", cursor: "pointer", background: "none" }} />
              <input value={template.bg_color} onChange={e => setTemplate((p: any) => ({ ...p, bg_color: e.target.value }))}
                style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>ACCENT COLOR</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="color" value={template.accent_color} onChange={e => setTemplate((p: any) => ({ ...p, accent_color: e.target.value }))}
                style={{ width: "40px", height: "36px", borderRadius: "6px", border: "1.5px solid #DDE8DD", cursor: "pointer", background: "none" }} />
              <input value={template.accent_color} onChange={e => setTemplate((p: any) => ({ ...p, accent_color: e.target.value }))}
                style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>BACKGROUND IMAGE URL</label>
            <input value={template.bg_image_url ?? ""} onChange={e => setTemplate((p: any) => ({ ...p, bg_image_url: e.target.value }))}
              placeholder="https://... (optional)"
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>LOGO URL</label>
            <input value={template.logo_url ?? ""} onChange={e => setTemplate((p: any) => ({ ...p, logo_url: e.target.value }))}
              placeholder="https://... (optional)"
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>CUSTOM MESSAGE (shown on ticket)</label>
            <input value={template.custom_message ?? ""} onChange={e => setTemplate((p: any) => ({ ...p, custom_message: e.target.value }))}
              placeholder="e.g. See you there! 💚"
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "8px" }}>PREVIEW</div>
          <div style={{ background: template.bg_color, border: `2px solid ${template.accent_color}`, borderRadius: "12px", padding: "16px", maxWidth: "320px", position: "relative", overflow: "hidden" }}>
            {template.bg_image_url && (
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${template.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.2 }} />
            )}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ height: "4px", background: template.accent_color, borderRadius: "2px", marginBottom: "10px" }} />
              {template.logo_url && <img src={template.logo_url} alt="logo" style={{ height: "24px", marginBottom: "8px", objectFit: "contain" }} />}
              <div style={{ fontFamily: R, fontSize: "10px", color: template.accent_color, letterSpacing: "2px", marginBottom: "4px" }}>+ CFS BINI COLET FAN CLUB</div>
              <div style={{ fontFamily: B, fontSize: "14px", color: "#1B3A2D", marginBottom: "8px" }}>{event?.title ?? "Event Name"}</div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div>
                  <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60" }}>TIER</div>
                  <div style={{ fontFamily: R, fontSize: "11px", color: template.accent_color }}>VVIP</div>
                </div>
                <div>
                  <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60" }}>TICKET NO.</div>
                  <div style={{ fontFamily: R, fontSize: "11px", color: "#1B3A2D" }}>CFS-1000</div>
                </div>
              </div>
              {template.custom_message && (
                <div style={{ fontFamily: B, fontSize: "10px", color: "#4A7C59", marginTop: "8px", fontStyle: "italic" }}>{template.custom_message}</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={saveTemplate} disabled={savingTemplate}
            style={{ fontFamily: R, fontSize: "11px", background: "#F07228", color: "#080F06", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px", opacity: savingTemplate ? 0.7 : 1 }}>
            {savingTemplate ? "SAVING..." : "SAVE TEMPLATE"}
          </button>
          {templateSaved && <span style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A" }}>✓ Saved!</span>}
        </div>
      </div>

    </div>
  );
}
