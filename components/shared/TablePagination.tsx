"use client";
import { useEffect, useMemo, useState } from "react";

const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Shared pagination for admin/super tables.
//
// Extracted from the hand-rolled implementation in
// app/admin/events/tier-changes/page.tsx, which was the only good one and was
// being copy-pasted. Three pages had pagination and ~80 did not, so the fix is
// one primitive rather than eighty bespoke ones that drift apart — the same
// reasoning behind the single LIST_COLS template in ShopProductGrid.
//
// Client-side by design: it pages an array already in memory. That is correct
// for the hundreds-of-rows tables here. It is NOT correct for a table with
// tens of thousands of rows, where the fix is a server-side range query — see
// the audit log.

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/**
 * Pages an in-memory array.
 *
 * `resetKey` should be every filter/search value that narrows the list. When it
 * changes the view jumps back to page 1 — without that, filtering while on
 * page 7 of 8 leaves you staring at an empty table and looking like a bug.
 */
export function usePagination<T>(items: T[], initialSize: PageSize = 25, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(initialSize);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp rather than reset: if the list shrinks under you, land on the last
  // real page instead of bouncing to the top.
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  useEffect(() => { setPage(1); }, [resetKey, pageSize]);

  const startIdx = (page - 1) * pageSize;
  const paged = useMemo(() => items.slice(startIdx, startIdx + pageSize), [items, startIdx, pageSize]);

  return { page, setPage, pageSize, setPageSize, pageCount, startIdx, paged };
}

const btn = (disabled: boolean): React.CSSProperties => ({
  fontFamily: SG, fontSize: "10px", fontWeight: 700,
  color: disabled ? "#B7C7B7" : "#1B3A2D",
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px",
  padding: "6px 10px", cursor: disabled ? "not-allowed" : "pointer", letterSpacing: "1.2px",
});

/** Header strip: result count + rows-per-page. Render above the table body. */
export function TableCountBar({
  total, filteredTotal, pageSize, setPageSize, noun = "ROWS", children,
}: {
  total: number;
  filteredTotal: number;
  pageSize: PageSize;
  setPageSize: (n: PageSize) => void;
  noun?: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "12px 18px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>
        {filteredTotal.toLocaleString()} · {total === filteredTotal ? "SHOWING ALL" : `FILTERED FROM ${total.toLocaleString()}`}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {children}
        <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.2px" }}>
          {noun}
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value) as PageSize)}
            style={{ marginLeft: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "4px 8px", cursor: "pointer" }}>
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

/** Footer strip: range readout + first/prev/next/last. Hidden on a single page. */
export function TablePagination({
  page, setPage, pageCount, startIdx, pageSize, filteredTotal,
}: {
  page: number;
  setPage: (updater: number | ((p: number) => number)) => void;
  pageCount: number;
  startIdx: number;
  pageSize: number;
  filteredTotal: number;
}) {
  if (filteredTotal === 0 || pageCount <= 1) return null;
  const first = page === 1;
  const last  = page === pageCount;
  return (
    <div style={{ padding: "12px 18px", background: "#F7FAF5", borderTop: "1px solid #E4EDE4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.2px" }}>
        ROWS {startIdx + 1}–{Math.min(startIdx + pageSize, filteredTotal)} OF {filteredTotal.toLocaleString()}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button type="button" onClick={() => setPage(1)} disabled={first} style={btn(first)}>« FIRST</button>
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={first} style={btn(first)}>‹ PREV</button>
        <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", letterSpacing: "1.2px", padding: "0 6px" }}>
          {page} / {pageCount}
        </span>
        <button type="button" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={last} style={btn(last)}>NEXT ›</button>
        <button type="button" onClick={() => setPage(pageCount)} disabled={last} style={btn(last)}>LAST »</button>
      </div>
    </div>
  );
}

/** Empty-state row for a filtered-to-nothing table. */
export function TableEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: B, color: "#7A8E7A", fontSize: "13px" }}>
      {children}
    </div>
  );
}
