"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

type Item = { description: string; amount: number; notes?: string };
type Project = { project: string; items: Item[] };
type Receipt = { id: string; project_name: string; item_description: string; file_url: string; file_name: string };

export default function ReportReceiptsPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<{ title: string; fund_breakdown: any } | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUpload = useRef<{ projectName: string; itemDescription: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/reports/${id}`)
      .then(r => r.json())
      .then(d => setReport(d.report));
    fetch(`/api/admin/reports/${id}/receipts`)
      .then(r => r.json())
      .then(d => setReceipts(d.receipts ?? []));
  }, [id]);

  function getReceipts(projectName: string, itemDescription: string) {
    return receipts.filter(r => r.project_name === projectName && r.item_description === itemDescription);
  }

  function triggerUpload(projectName: string, itemDescription: string) {
    pendingUpload.current = { projectName, itemDescription };
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pendingUpload.current) return;
    const { projectName, itemDescription } = pendingUpload.current;
    const key = `${projectName}|${itemDescription}`;
    setUploading(key);
    e.target.value = "";

    const form = new FormData();
    form.append("file", file);
    form.append("project_name", projectName);
    form.append("item_description", itemDescription);

    const res = await fetch(`/api/admin/reports/${id}/receipts`, { method: "POST", body: form });
    const data = await res.json();
    if (data.receipt) setReceipts(prev => [...prev, data.receipt]);
    setUploading(null);
    pendingUpload.current = null;
  }

  async function handleDelete(receiptId: string) {
    setDeleting(receiptId);
    await fetch(`/api/admin/reports/${id}/receipts/${receiptId}`, { method: "DELETE" });
    setReceipts(prev => prev.filter(r => r.id !== receiptId));
    setDeleting(null);
  }

  const projects: Project[] = report?.fund_breakdown?.outflow_detailed ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <a href="/admin/reports" style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", textDecoration: "none", letterSpacing: "1px" }}>← REPORTS</a>
        <span style={{ color: "#9AAA98" }}>/</span>
        <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "3px", margin: 0 }}>RECEIPTS</h1>
      </div>

      {report && (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", padding: "12px 18px" }}>
          <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{report.title}</div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "2px" }}>
            {receipts.length} receipt{receipts.length !== 1 ? "s" : ""} uploaded
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFileChange} />

      {projects.length === 0 && (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60" }}>
          NO EXPENSE DATA IN THIS REPORT
        </div>
      )}

      {projects.map((proj, pi) => (
        <div key={pi} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#F2F7F2", padding: "12px 18px", fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "2px" }}>
            {proj.project}
          </div>
          <div>
            {proj.items.map((item, ii) => {
              const itemReceipts = getReceipts(proj.project, item.description);
              const key = `${proj.project}|${item.description}`;
              const isUploading = uploading === key;

              return (
                <div key={ii} style={{ padding: "14px 18px", borderTop: "1px solid #DDE8DD", display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{item.description}</div>
                    {item.notes && <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "2px" }}>{item.notes}</div>}
                    <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", marginTop: "4px" }}>
                      ₱{Number(item.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </div>

                    {/* Uploaded receipts */}
                    {itemReceipts.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                        {itemReceipts.map(r => (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "5px 10px" }}>
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", textDecoration: "none" }}>
                              📎 {r.file_name}
                            </a>
                            <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#CC3344", fontSize: "12px", padding: "0 2px", opacity: deleting === r.id ? 0.5 : 1 }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => triggerUpload(proj.project, item.description)}
                    disabled={isUploading}
                    style={{
                      fontFamily: R, fontSize: "10px", letterSpacing: "1px",
                      padding: "6px 14px", borderRadius: "6px", flexShrink: 0,
                      border: "1.5px solid #DDE8DD", background: isUploading ? "#F2F7F2" : "transparent",
                      color: isUploading ? "#5A7A60" : "#4A7C59", cursor: isUploading ? "default" : "pointer",
                    }}>
                    {isUploading ? "UPLOADING..." : "+ RECEIPT"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
