// Stock decrement for paid shop orders.
//
// Prefers the decrement_product_stock SQL function (see
// supabase/migrations/product_stock_decrement.sql) so concurrent orders for
// the last item can't both read the same stock value and both succeed. Falls
// back to read-then-write while that migration has not been applied yet —
// correct in the ordinary case, but it can lose a concurrent update, so the
// migration should be run.

export type StockLineItem = { product_id: string; quantity: number };

/** Normalises an order's items array into {product_id, quantity} rows. */
export function toStockItems(items: any[]): StockLineItem[] {
  return (items ?? [])
    .filter((i: any) => i?.product_id)
    .map((i: any) => ({ product_id: i.product_id, quantity: Number(i.quantity) || 0 }))
    .filter(i => i.quantity > 0);
}

/**
 * Decrements stock for each line item. Never throws — the payment has already
 * been taken by the time this runs, so a stock failure must not fail the
 * caller's request. Returns whether the atomic path was used.
 */
export async function decrementProductStock(supabase: any, items: any[]): Promise<{ ok: boolean; atomic: boolean }> {
  const stockItems = toStockItems(items);
  if (!stockItems.length) return { ok: true, atomic: true };

  try {
    const { error } = await supabase.rpc("decrement_product_stock", { p_items: stockItems });
    if (!error) return { ok: true, atomic: true };
    console.error("decrement_product_stock RPC failed, falling back:", error.message);
  } catch (e: any) {
    console.error("decrement_product_stock RPC threw, falling back:", e?.message);
  }

  try {
    for (const it of stockItems) {
      const { data: prod } = await supabase
        .from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (!prod) continue;
      const next = Math.max((Number(prod.stock) || 0) - it.quantity, 0);
      await supabase.from("products").update({ stock: next }).eq("id", it.product_id);
    }
    return { ok: true, atomic: false };
  } catch (e: any) {
    console.error("stock decrement fallback failed:", e?.message);
    return { ok: false, atomic: false };
  }
}
