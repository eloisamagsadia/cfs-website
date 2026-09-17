"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SkListLoading } from "@/components/shared/Skeleton";
import { usePagination, TableCountBar, TablePagination } from "@/components/shared/TablePagination";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Row = {
  id: string; type: string; amount: number; created_at: string; paid_at: string | null;
  reference_id: string; buyer: string | null; buyer_role: string | null; user_id: string | null; reason: string; href: string | null; attempts?: number;
};

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;
const STAFF = new Set(["admin", "super_admin", "moderator"]);

const TYPE_LABEL: Record<string, string> = {
  ticket: "TICKET", order: "SHOP", donation: "DONATION", tier_upgrade: "UPGRADE",
};

export default function ReconciliationPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [hideStaff, setHideStaff] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/reconciliation")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else { setRows(d.unresolved ?? []); setSummary(d.summary); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Staff test payments are real money through real PayMongo links, but they
  // are not owed to anyone. Hidden by default so a genuine customer problem is
  // never buried under our own testing — and counted, so they are not secretly
  // dropped either.
  const staffCount = rows.filter(r => STAFF.has(r.buyer_role ?? "")).length;

  const filtered = useMemo(() => rows.filter(r => {
    if (hideStaff && STAFF.has(r.buyer_role ?? "")) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  }), [rows, hideStaff, typeFilter]);

  const { page, setPage, pageSize, setPageSize, pageCount, startIdx, paged } =
    usePagination(filtered, 25, `${hideStaff}|${typeFilter}`);

  const types = Array.from(new Set(rows.map(r => r.type)));
  const customerValue = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>RECONCILIATION</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          Payments that arrived but produced nothing. Read-only — it reports, you decide.
        </p>
      </div>

      {error && (
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "12px 16px", fontFamily: B, fontSize: 13, color: "#CC3344" }}>{error}</div>
      )}

      {loading ? <SkListLoading rows={5} /> : (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <Tile label="NEEDS ATTENTION" value={String(filtered.length)} sub={peso(customerValue)} tone={filtered.length ? "#CC3344" : "#1A8040"} />
            <Tile label="MATCHED" value={String(summary?.matched ?? 0)} sub="paid and delivered" tone="#1A8040" />
            <Tile label="STAFF TESTS" value={String(staffCount)} sub={hideStaff ? "hidden below" : "shown below"} tone="#7A5AB8" />
            {/* Abandoned checkouts are normal: people open a payment link and
                never finish. Shown for context, never as an alarm. */}
            <Tile label="ABANDONED CHECKOUTS" value={String(summary?.abandoned ?? 0)} sub={`${peso(summary?.abandonedValue ?? 0)} never paid · normal`} tone="#7A8E7A" />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {["all", ...types].map(t => {
              const active = typeFilter === t;
              return (
                <button key={t} type="button" onClick={() => setTypeFilter(t)}
                  style={{ fontFamily: R, fontSize: 11, letterSpacing: 1, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? "#1A8040" : "#DDE8DD"}`, background: active ? "#1A8040" : "transparent", color: active ? "#fff" : "#5A7A60", cursor: "pointer" }}>
                  {t === "all" ? "ALL" : TYPE_LABEL[t] ?? t.toUpperCase()}
                  <span style={{ marginLeft: 7, fontFamily: B, fontSize: 10, fontWeight: 700 }}>
                    {t === "all" ? rows.filter(r => !hideStaff || !STAFF.has(r.buyer_role ?? "")).length
                                 : rows.filter(r => r.type === t && (!hideStaff || !STAFF.has(r.buyer_role ?? ""))).length}
                  </span>
                </button>
              );
            })}
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", marginLeft: "auto" }}>
              <input type="checkbox" checked={hideStaff} onChange={e => setHideStaff(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#7A5AB8", cursor: "pointer" }} />
              <span style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5B3F94", letterSpacing: 1.2 }}>
                HIDE STAFF TEST PAYMENTS ({staffCount})
              </span>
            </label>
          </div>

          {/* Table */}
          <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, overflow: "hidden" }}>
            <TableCountBar total={rows.length} filteredTotal={filtered.length} pageSize={pageSize} setPageSize={setPageSize} noun="ROWS" />

            {filtered.length === 0 ? (
              <div style={{ padding: "56px 24px", textAlign: "center" }}>
                <div style={{ fontFamily: R, fontSize: 13, color: "#1A8040", letterSpacing: 2, marginBottom: 6 }}>ALL CLEAR</div>
                <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A" }}>
                  Every completed payment produced a ticket, order or donation.
                </div>
              </div>
            ) : paged.map(r => {
              const isStaff = STAFF.has(r.buyer_role ?? "");
              return (
                <div key={r.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderTop: "1px solid #EDF3ED", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 86 }}>
                    <div style={{ fontFamily: R, fontSize: 15, color: "#1B3A2D" }}>{peso(r.amount)}</div>
                    <div style={{ fontFamily: B, fontSize: 10, color: "#7A8E7A" }}>{r.created_at.slice(0, 10)}</div>
                  </div>

                  <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1px solid #C7DFC7", borderRadius: 999, padding: "3px 9px", letterSpacing: 1.2 }}>
                    {TYPE_LABEL[r.type] ?? r.type.toUpperCase()}
                  </span>

                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", fontWeight: 600 }}>
                      {r.buyer ?? "Unknown member"}
                      {isStaff && (
                        <span style={{ marginLeft: 8, fontFamily: SG, fontSize: 8, fontWeight: 700, color: "#5B3F94", background: "#F3EEFB", border: "1px solid #D9CCF0", borderRadius: 999, padding: "1px 7px", letterSpacing: 1 }}>
                          STAFF TEST
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A" }}>
                      {r.reason}
                      {/* Repeated retries are a symptom in themselves — someone
                          pressing pay nine times was not getting feedback. */}
                      {(r.attempts ?? 1) > 1 && (
                        <span style={{ marginLeft: 8, fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#B45309", background: "#FFF3E0", border: "1px solid #F0C48A", borderRadius: 999, padding: "1px 7px", letterSpacing: 1 }}>
                          {r.attempts} PAYMENT LINKS GENERATED
                        </span>
                      )}
                    </div>
                  </div>

                  <code style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "#9AAE9A" }}>{r.reference_id.slice(0, 8)}</code>

                  {r.href ? (
                    <Link href={r.href} title="See this member's tickets, orders and donations"
                      style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: 1.2, whiteSpace: "nowrap" }}>
                      VIEW MEMBER →
                    </Link>
                  ) : (
                    // No user on the transaction (old orphaned rows) — say so
                    // rather than showing a button that goes nowhere.
                    <span style={{ fontFamily: B, fontSize: 10, color: "#B7C7B7", whiteSpace: "nowrap" }}>no member</span>
                  )}
                </div>
              );
            })}

            <TablePagination page={page} setPage={setPage} pageCount={pageCount} startIdx={startIdx} pageSize={pageSize} filteredTotal={filtered.length} />
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #DDE8DD", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: tone, letterSpacing: 1.3, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: 1 }}>{value}</div>
      <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", marginTop: 2 }}>{sub}</div>
    </div>
  );
}
