const fs = require("fs");
const path = require("path");

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const must = (condition, message) => { if (!condition) throw new Error(message); };
const includes = (file, fragments) => {
  const content = read(file);
  for (const fragment of fragments) must(content.includes(fragment), `${file} missing ${fragment}`);
  return content;
};

must(exists("docs/v2/R3-库存中心冻结设计.md"), "R3 freeze design missing");
includes("apps/go-api-server/migrations/000004_r3_inventory_center.up.sql", [
  "CREATE TABLE inventories",
  "CREATE TABLE inventory_transactions",
  "UNIQUE KEY uk_inventories_sku_id",
  "UNIQUE KEY uk_inventory_transactions_reference",
  "CHECK (total_stock >= locked_stock)",
  "ENGINE=InnoDB"
]);

const migration = read("apps/go-api-server/migrations/000004_r3_inventory_center.up.sql");
for (const forbidden of ["CREATE TABLE carts", "CREATE TABLE orders", "CREATE TABLE payments", "CREATE TABLE distributors"]) {
  must(!migration.includes(forbidden), `R3 must not create ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/inventory/models.go", ["type Inventory struct", "type InventoryTransaction struct", "INCREASE", "DEDUCT"]);
includes("apps/go-api-server/internal/modules/inventory/repository.go", [
  "AtomicLock",
  "total_stock - locked_stock >= ?",
  "AtomicUnlock",
  "locked_stock >= ?",
  "AtomicDeduct",
  "FindTransactionByReference"
]);
includes("apps/go-api-server/internal/modules/inventory/service.go", [
  "GetInventory",
  "AdjustInventory",
  "LockInventory",
  "UnlockInventory",
  "DeductInventory",
  "ErrDuplicateOperation"
]);
includes("apps/go-api-server/internal/modules/inventory/handler.go", ["/inventories", "/inventories/:skuId/adjust", "/inventory-transactions"]);
includes("apps/go-api-server/internal/http/router.go", ["inventorymodule", "RegisterAdminRoutes"]);
includes("apps/go-api-server/internal/modules/product/dto.go", ["availableStock", "stockStatus"]);
includes("apps/go-api-server/internal/modules/product/service.go", ["applyInventoryToDetail", "OUT_OF_STOCK", "LOW_STOCK"]);
includes("apps/miniapp/src/pages/product-detail/index.vue", ["skuStatusText", "OUT_OF_STOCK", "售罄"]);
includes("apps/admin-h5/src/services/product.ts", ["getAdminInventories", "adjustInventory", "getInventoryTransactions"]);
includes("apps/admin-h5/src/views/product-center/index.vue", ["库存管理", "库存流水", "补货 +10"]);
includes("docs/v2/API路由总表.md", ["/api/v2/admin/inventories", "/api/v2/admin/inventory-transactions"]);
includes("docs/v2/错误码总表.md", ["INVENTORY_NOT_FOUND", "INSUFFICIENT_STOCK", "DUPLICATE_INVENTORY_OPERATION"]);

console.log("R3 inventory static test passed.");
