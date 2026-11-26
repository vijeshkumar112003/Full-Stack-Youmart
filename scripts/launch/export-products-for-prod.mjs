// Copies products imported on the development PC to the live site.
//
// Reads the same product JSON files that were imported locally, collects those products from the
// local database (with their categories + parents, SKUs, images, extra categories and stock) and
// writes ONE SQL file for the production database. Applying it is a single transaction that:
//   - loads everything into temporary tables, swaps the R2 dev image host for the custom domain;
//   - REFUSES (rolls back, changes nothing) if a category / product / SKU code already exists on
//     the live site under a different id - the two databases would have drifted apart;
//   - upserts by id: existing products are updated in place (never duplicated); their rating and
//     review count on the live site are kept;
//   - adds stock only for SKUs that have none on the live site (live stock is never reset).
//
// Usage (PC):     node scripts/launch/export-products-for-prod.mjs <out.sql> <file.json>...
// Then gzip it, upload to S3 restore/, and on the server (deploy/README.md):
//   aws s3 cp s3://<bucket>/restore/<file>.sql.gz - | gunzip | docker compose -f docker-compose.prod.yml \
//     --env-file .env exec -T postgres psql -U youmart -d youmart -v ON_ERROR_STOP=1
import { execFileSync } from 'node:child_process';
import { createWriteStream, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
process.loadEnvFile(path.join(root, '.env'));
const env = process.env;
const [out, ...files] = process.argv.slice(2);
if (!out || !files.length) {
  console.error('usage: node scripts/launch/export-products-for-prod.mjs <out.sql> <file.json>...');
  process.exit(1);
}
const FROM_HOST = 'https://pub-00e095c05bf34deeb618199a5dc192b6.r2.dev';
const TO_HOST = 'https://img.youmart.in';

const ids = new Set();
for (const f of files) {
  for (const p of JSON.parse(readFileSync(f, 'utf8'))) {
    if (p.Youmart_Product_ID) ids.add(String(p.Youmart_Product_ID).toLowerCase());
  }
}
console.log(`${ids.size} product ids in ${files.length} file(s)`);

const psql = (input) =>
  execFileSync(
    'docker',
    ['compose', '-f', 'docker/docker-compose.yml', '--env-file', '.env', 'exec', '-T', 'postgres',
      'psql', '-v', 'ON_ERROR_STOP=1', '-U', env.POSTGRES_USER, '-d', env.POSTGRES_DB, '-q', '-At'],
    { cwd: root, input, maxBuffer: 2 * 1024 * 1024 * 1024 },
  ).toString();

// The id list goes in as a temp table; every export query below reads from it.
const idList = [...ids].map((id) => `('${id.replace(/'/g, "''")}')`).join(',\n');
const SETUP = `
CREATE TEMP TABLE x_id(id text PRIMARY KEY);
INSERT INTO x_id VALUES ${idList} ON CONFLICT DO NOTHING;
CREATE TEMP TABLE x_product AS SELECT p.* FROM catalog.product p
  JOIN x_id ON x_id.id = substring(p.slug from '[^-]+$') WHERE p.deleted_at IS NULL;
CREATE TEMP TABLE x_category AS WITH RECURSIVE up AS (
    SELECT c.* FROM catalog.category c WHERE c.id IN (
      SELECT category_id FROM x_product
      UNION SELECT category_id FROM catalog.product_extra_category WHERE product_id IN (SELECT id FROM x_product))
  UNION
    SELECT c.* FROM catalog.category c JOIN up ON c.id = up.parent_id)
  SELECT DISTINCT * FROM up;
`;

const TABLES = [
  // [staging name, live table, columns, export query]
  ['s_category', 'catalog.category', 'id,name,slug,parent_id,created_at,updated_at,deleted_at,filter_definition',
    'SELECT * FROM x_category'],
  ['s_product', 'catalog.product',
    'id,title,slug,description,seller_id,category_id,attributes,status,created_at,updated_at,deleted_at,gst_rate_percent,hsn_code,rating,rating_count',
    'SELECT * FROM x_product'],
  ['s_sku', 'catalog.sku', 'id,product_id,sku_code,mrp,selling_price,attributes,created_at,updated_at,deleted_at',
    'SELECT * FROM catalog.sku WHERE product_id IN (SELECT id FROM x_product)'],
  ['s_image', 'catalog.product_image', 'id,product_id,url,position,created_at,updated_at,deleted_at',
    'SELECT * FROM catalog.product_image WHERE product_id IN (SELECT id FROM x_product)'],
  ['s_extra', 'catalog.product_extra_category', 'product_id,category_id,created_at',
    'SELECT * FROM catalog.product_extra_category WHERE product_id IN (SELECT id FROM x_product)'],
  ['s_stock', 'inventory.stock_level', 'id,sku_id,available,reserved,created_at,updated_at,deleted_at',
    `SELECT * FROM inventory.stock_level WHERE deleted_at IS NULL
       AND sku_id IN (SELECT id FROM catalog.sku WHERE product_id IN (SELECT id FROM x_product))`],
];

const lit = (s) => `'${s.replace(/'/g, "''")}'`;
const stream = createWriteStream(out);
const write = (s) => stream.write(s);

write(`-- YouMart product copy for the live site, generated ${new Date().toISOString()}
-- ${ids.size} product ids from: ${files.map((f) => path.basename(f)).join(', ')}
\\set ON_ERROR_STOP on
BEGIN;
`);
for (const [name, table, cols] of TABLES) {
  write(`CREATE TEMP TABLE ${name} ON COMMIT DROP AS SELECT ${cols} FROM ${table} WITH NO DATA;\n`);
}
const counts = {};
for (const [name, , cols, query] of TABLES) {
  const data = psql(`${SETUP}\nCOPY (SELECT ${cols} FROM (${query}) q) TO STDOUT;`);
  counts[name] = data ? data.split('\n').filter(Boolean).length : 0;
  write(`COPY ${name} (${cols}) FROM stdin;\n${data}${data && !data.endsWith('\n') ? '\n' : ''}\\.\n`);
}
console.log('exported rows:', JSON.stringify(counts));

write(`
-- Image links: the live site serves product images from its own domain.
UPDATE s_image SET url = replace(url, ${lit(FROM_HOST)}, ${lit(TO_HOST)});
UPDATE s_sku SET attributes = replace(attributes::text, ${lit(FROM_HOST)}, ${lit(TO_HOST)})::jsonb;
UPDATE s_product SET attributes = replace(attributes::text, ${lit(FROM_HOST)}, ${lit(TO_HOST)})::jsonb;

-- Safety: stop (nothing is changed) if the live site has the same thing under a different id.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM s_category s JOIN catalog.category c
    ON c.slug = s.slug AND c.parent_id IS NOT DISTINCT FROM s.parent_id AND c.id <> s.id AND c.deleted_at IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'STOPPED: % categories exist on the live site under another id', n; END IF;
  SELECT count(*) INTO n FROM s_product s JOIN catalog.product p
    ON p.slug = s.slug AND p.id <> s.id AND p.deleted_at IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'STOPPED: % products exist on the live site under another id', n; END IF;
  SELECT count(*) INTO n FROM s_sku s JOIN catalog.sku k
    ON k.sku_code = s.sku_code AND k.id <> s.id AND k.deleted_at IS NULL AND s.deleted_at IS NULL;
  IF n > 0 THEN RAISE EXCEPTION 'STOPPED: % SKU codes exist on the live site under another id', n; END IF;
  SELECT count(*) INTO n FROM (SELECT DISTINCT seller_id FROM s_product) s
    WHERE NOT EXISTS (SELECT 1 FROM catalog.product p WHERE p.seller_id = s.seller_id);
  IF n > 0 THEN RAISE EXCEPTION 'STOPPED: the products belong to a seller the live site does not have'; END IF;
END $$;

SELECT 'before: ' || count(*) || ' active products' FROM catalog.product WHERE deleted_at IS NULL;

INSERT INTO catalog.category (id,name,slug,parent_id,created_at,updated_at,deleted_at,filter_definition)
  SELECT * FROM s_category
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, parent_id = EXCLUDED.parent_id,
    filter_definition = EXCLUDED.filter_definition, updated_at = EXCLUDED.updated_at, deleted_at = EXCLUDED.deleted_at;

INSERT INTO catalog.product (id,title,slug,description,seller_id,category_id,attributes,status,created_at,updated_at,deleted_at,gst_rate_percent,hsn_code,rating,rating_count)
  SELECT * FROM s_product
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slug = EXCLUDED.slug, description = EXCLUDED.description,
    category_id = EXCLUDED.category_id, attributes = EXCLUDED.attributes, status = EXCLUDED.status,
    gst_rate_percent = EXCLUDED.gst_rate_percent, hsn_code = EXCLUDED.hsn_code,
    updated_at = EXCLUDED.updated_at, deleted_at = EXCLUDED.deleted_at;

INSERT INTO catalog.sku (id,product_id,sku_code,mrp,selling_price,attributes,created_at,updated_at,deleted_at)
  SELECT * FROM s_sku
  ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, sku_code = EXCLUDED.sku_code, mrp = EXCLUDED.mrp,
    selling_price = EXCLUDED.selling_price, attributes = EXCLUDED.attributes,
    updated_at = EXCLUDED.updated_at, deleted_at = EXCLUDED.deleted_at;

INSERT INTO catalog.product_image (id,product_id,url,position,created_at,updated_at,deleted_at)
  SELECT * FROM s_image
  ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, position = EXCLUDED.position,
    updated_at = EXCLUDED.updated_at, deleted_at = EXCLUDED.deleted_at;

DELETE FROM catalog.product_extra_category WHERE product_id IN (SELECT id FROM s_product);
INSERT INTO catalog.product_extra_category (product_id,category_id,created_at)
  SELECT * FROM s_extra ON CONFLICT DO NOTHING;

INSERT INTO inventory.stock_level (id,sku_id,available,reserved,created_at,updated_at,deleted_at)
  SELECT s.* FROM s_stock s
  WHERE NOT EXISTS (SELECT 1 FROM inventory.stock_level l WHERE l.sku_id = s.sku_id AND l.deleted_at IS NULL)
  ON CONFLICT (id) DO NOTHING;

SELECT 'after: ' || count(*) || ' active products' FROM catalog.product WHERE deleted_at IS NULL;
SELECT 'copied: ' || (SELECT count(*) FROM s_product) || ' products, ' || (SELECT count(*) FROM s_sku) || ' skus, '
  || (SELECT count(*) FROM s_image) || ' images, ' || (SELECT count(*) FROM s_category) || ' categories';
COMMIT;
`);
stream.end();
await new Promise((r) => stream.on('finish', r));
console.log(`wrote ${out}`);
