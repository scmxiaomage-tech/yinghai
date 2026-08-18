const fs = require("fs");
const path = require("path");

let root = process.cwd();
while (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  const parent = path.dirname(root);
  if (parent === root) throw new Error("Cannot locate workspace root");
  root = parent;
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
function exists(file) {
  return fs.existsSync(path.join(root, file));
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function assertIncludes(file, snippets) {
  const content = read(file);
  for (const snippet of snippets) assert(content.includes(snippet), `${file} missing: ${snippet}`);
}

assert(exists("database/migrations/20260812020100_create_product_center.js"), "Sprint2 product migration missing");
const migration = require(path.join(root, "database/migrations/20260812020100_create_product_center.js"));
assert(typeof migration.up === "function", "product migration missing up()");
assert(typeof migration.down === "function", "product migration missing down()");

assertIncludes("database/migrations/20260812020100_create_product_center.js", [
  "\"category\"",
  "\"product\"",
  "\"product_image\"",
  "\"sku\"",
  "\"inventory\""
]);

assertIncludes("apps/api-server/src/app.module.ts", ["ProductModule"]);
assertIncludes("apps/api-server/src/modules/product/product.controller.ts", [
  '@Get("categories")',
  '@Get("products")',
  '@Get("products/recommended")',
  '@Get("products/:id")'
]);
assertIncludes("apps/api-server/src/modules/product/admin-product.controller.ts", [
  '@Get("categories")',
  '@Post("categories")',
  '@Get("products")',
  '@Put("products/:id/shelf-status")',
  '@Post("products/:productId/skus")',
  '@Get("inventory")',
  '@Post("products/:productId/images")'
]);
assertIncludes("apps/api-server/src/modules/product/product.service.ts", [
  "cost_price",
  "adminUpdateShelfStatus",
  "Product does not meet on_sale requirements",
  "stockStatus"
]);
assert(!read("apps/api-server/src/modules/product/product.service.ts").includes("costPrice") || read("apps/api-server/src/modules/product/product.service.ts").includes("adminCreateSku"), "costPrice should only be handled by admin paths");

assertIncludes("apps/miniapp/src/services/product.ts", [
  "/categories",
  "/products/recommended",
  "/products/${id}"
]);
assertIncludes("apps/miniapp/src/pages.json", ["pages/product-detail/index"]);
assertIncludes("apps/admin-h5/src/views/product-center/index.vue", ["商品中心", "库存管理", "toggleShelf"]);
assertIncludes("database/seeds/product-seed.cjs", ["NODE_ENV === \"production\"", "DEMO-LOBSTER"]);
assertIncludes("package.json", ["db:seed:products", "test:sprint2"]);

console.log("Sprint2 smoke test passed.");
