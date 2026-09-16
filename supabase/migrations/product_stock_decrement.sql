-- Atomic stock decrement for paid shop orders.
--
-- Orders previously never touched products.stock: the shop could oversell
-- indefinitely and stock stayed put after payment. The API now validates
-- availability before creating an order, and the PayMongo webhook calls this
-- function once the payment is confirmed.
--
-- Done in SQL rather than read-then-write in the API so two concurrent orders
-- for the last item can't both read the same stock value and both succeed.
-- Quantities are summed per product first, so an items array that lists the
-- same product twice decrements by the total rather than by one of the rows.
-- Clamped at zero: the payment has already been taken by the time this runs,
-- so a shortfall must not fail the webhook — it is reconciled by staff.

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products p
  SET    stock = GREATEST(p.stock - i.qty, 0)
  FROM (
    SELECT (elem->>'product_id')::uuid AS pid,
           SUM(COALESCE((elem->>'quantity')::int, 0)) AS qty
    FROM   jsonb_array_elements(p_items) AS elem
    WHERE  elem->>'product_id' IS NOT NULL
    GROUP  BY 1
  ) i
  WHERE p.id = i.pid;
END $$;

-- Service-role only; every caller is a server-side API route.
REVOKE ALL ON FUNCTION public.decrement_product_stock(jsonb) FROM public;
REVOKE ALL ON FUNCTION public.decrement_product_stock(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_product_stock(jsonb) FROM authenticated;
