"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { IconLink, IconWarning } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";


export default function EventFanWall({ eventId }: { eventId: string }) {
  const { user, isLoaded } = useUser();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events/fan-submissions?event_id=" + eventId + "&status=approved")
      .then(r => r.json())
      .then(d => { setSubmissions(d.submissions ?? []); setLoading(false); });
  }, [eventId]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!url.trim()) return;
    setSubmitting(true);
    let thumbnail_url = null;
    if (screenshot) {
      const formData = new FormData();
      formData.append("file", screenshot);
      formData.append("folder", "community");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.url) thumbnail_url = uploadData.url;
    }
    await fetch("/api/events/fan-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, url, caption, thumbnail_url }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setUrl("");
    setCaption("");
    setScreenshot(null);
    setPreview(null);
  }

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px" }}>FAN WALL</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", marginTop: "2px" }}>{submissions.length} fan posts</div>
        </div>
      </div>

      {loading ? (
        <div style={{ fontFamily: R, fontSize: "12px", color: "#5A7A60", letterSpacing: "1px", textAlign: "center", padding: "24px" }}>LOADING...</div>
      ) : submissions.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "1px" }}>NO FAN POSTS YET</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#3A5C2C", marginTop: "4px" }}>Be the first to share your fan cam!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {submissions.map((s: any) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ height: "130px", background: "#F2F7F2", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {s.thumbnail_url
                  ? <img src={s.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <IconLink size={40} color="#DDE8DD" />
                }
                <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", color: "#4A7C59" }}>
                  {s.platform}
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                {s.caption && <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.caption}</div>}
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{new Date(s.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {isLoaded && user ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px", marginBottom: "12px" }}>SHARE YOUR FAN CAM</div>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "16px" }}>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "1px" }}>SUBMITTED FOR REVIEW!</div>
              <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", marginTop: "4px" }}>We will review and add it to the fan wall.</div>
              <button onClick={() => setSubmitted(false)} style={{ marginTop: "12px", fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "6px 16px", color: "#4A7C59", cursor: "pointer", letterSpacing: "1px" }}>SUBMIT ANOTHER</button>
            </div>
          ) : (
            <div>
              <input type="url" placeholder="Paste your TikTok / Twitter / IG / YouTube link..." value={url} onChange={e => setUrl(e.target.value)} style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", marginBottom: "8px", boxSizing: "border-box" as const }} />
              {/* Screenshot upload */}
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontFamily: B, fontSize: "11px", color: url.includes("tiktok") || url.includes("instagram") || url.includes("twitter") || url.includes("x.com") ? "#1A8040" : "#5A7A60", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
                  SCREENSHOT {url.includes("tiktok") || url.includes("instagram") || url.includes("twitter") || url.includes("x.com") ? <><IconWarning size={11} color="#1A8040" /> REQUIRED for TikTok/IG/Twitter</> : "(optional for YouTube)"}
                </label>
                {preview && <img src={preview} alt="preview" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px", border: "1.5px solid #DDE8DD" }} />}
                <input type="file" accept="image/*" onChange={handleFile} style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", width: "100%" }} />
              </div>
              <textarea placeholder="Add a caption... (optional)" value={caption} onChange={e => setCaption(e.target.value)} rows={2} style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", marginBottom: "12px", resize: "none", boxSizing: "border-box" as const }} />
              <button onClick={handleSubmit} disabled={submitting || !url.trim()} style={{ fontFamily: R, fontSize: "12px", background: url.trim() ? "#1A8040" : "#F2F7F2", color: url.trim() ? "#FFFFFF" : "#5A7A60", border: "2px solid #1B3A2D", borderRadius: "6px", padding: "10px 24px", cursor: url.trim() ? "pointer" : "not-allowed", letterSpacing: "1.5px" }}>
                {submitting ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
            <a href="/sign-in" style={{ color: "#1A8040" }}>Sign in</a> to share your fan cam
          </div>
        </div>
      )}
    </div>
  );
}
