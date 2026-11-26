-- Removes catalog products that have no image at all - in YouMart's data these are all
-- development / test seed items ("dev-..." phones, "Payment Test Item", "Concurrency Test Item"...).
-- Real imported products always carry images. Safe to run again (it only touches imageless ones).
--   local copy : docker exec -i docker-postgres-1 psql -U youmart_dev -d youmart_launch -v ON_ERROR_STOP=1 < scripts/launch/remove-imageless-products.sql
--   server     : docker compose ... exec -T postgres psql -U youmart -d youmart -v ON_ERROR_STOP=1 < remove-imageless-products.sql
BEGIN;

CREATE TEMP TABLE drop_product ON COMMIT DROP AS
SELECT p.id FROM catalog.product p
WHERE NOT EXISTS (SELECT 1 FROM catalog.product_image i WHERE i.product_id = p.id);

CREATE TEMP TABLE drop_sku ON COMMIT DROP AS
SELECT id FROM catalog.sku WHERE product_id IN (SELECT id FROM drop_product);

SELECT (SELECT count(*) FROM drop_product) AS products_removed, (SELECT count(*) FROM drop_sku) AS skus_removed;

DELETE FROM inventory.reservation          WHERE sku_id     IN (SELECT id FROM drop_sku);
DELETE FROM inventory.stock_level          WHERE sku_id     IN (SELECT id FROM drop_sku);
DELETE FROM cart.cart_item                 WHERE sku_id     IN (SELECT id FROM drop_sku);
DELETE FROM cart.wishlist_item             WHERE product_id IN (SELECT id FROM drop_product);
DELETE FROM catalog.recently_viewed        WHERE product_id IN (SELECT id FROM drop_product);
DELETE FROM catalog.product_extra_category WHERE product_id IN (SELECT id FROM drop_product);
DELETE FROM reviews.review                 WHERE product_id IN (SELECT id FROM drop_product);
DELETE FROM catalog.sku                    WHERE id         IN (SELECT id FROM drop_sku);
DELETE FROM catalog.product                WHERE id         IN (SELECT id FROM drop_product);

SELECT 'products left' AS what, count(*) FROM catalog.product
UNION ALL SELECT 'without image', count(*) FROM catalog.product p
  WHERE NOT EXISTS (SELECT 1 FROM catalog.product_image i WHERE i.product_id = p.id);

COMMIT;
