-- Removes impossible discounts: a variant selling at 90%+ below its "MRP" has a wrong MRP from the
-- product delivery (e.g. ₹3,700 vs "MRP" ₹3,70,000). Its MRP becomes the selling price, so no
-- discount is shown instead of a made-up one; the product's "N% off or more" filter labels are then
-- recalculated from its remaining real discounts. Same rule as scripts/import-products-json.mjs
-- (MAX_DISCOUNT_PCT). Safe to run again: the second run finds nothing.
--   PC:     docker compose -f docker/docker-compose.yml --env-file .env exec -T postgres psql -U <user> -d <db> < scripts/launch/fix-impossible-discounts.sql
--   Server: ... exec -T postgres psql -U youmart -d youmart -v ON_ERROR_STOP=1 < fix-impossible-discounts.sql
-- Search picks the new prices up at the next index rebuild (nightly 02:00).
\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE fixed_product ON COMMIT DROP AS
WITH f AS (
  UPDATE catalog.sku
  SET mrp = selling_price, updated_at = now()
  WHERE deleted_at IS NULL AND mrp > 0 AND selling_price <= mrp * 0.10
  RETURNING product_id
)
SELECT DISTINCT product_id FROM f;

UPDATE catalog.product p
SET attributes = jsonb_set(
      p.attributes,
      '{discount_band}',
      (SELECT coalesce(jsonb_agg(b || '% off or more' ORDER BY b), '[]'::jsonb)
         FROM unnest(ARRAY[10, 25, 40, 50, 70]) AS b
        WHERE coalesce(m.best, 0) >= b)
    ),
    updated_at = now()
FROM fixed_product fp
LEFT JOIN LATERAL (
  SELECT max(100 * (1 - s.selling_price / s.mrp)) AS best
  FROM catalog.sku s
  WHERE s.product_id = fp.product_id AND s.deleted_at IS NULL AND s.mrp > 0
) m ON true
WHERE p.id = fp.product_id AND p.attributes ? 'discount_band';

SELECT 'fixed: ' || (SELECT count(*) FROM fixed_product) || ' products';
COMMIT;
