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

must(exists("docs/v2/R4-购物车中心冻结设计.md"), "R4 freeze design missing");

const upMigration = includes("apps/go-api-server/migrations/000005_r4_cart_center.up.sql", [
  "CREATE TABLE cart_items",
  "user_id CHAR(36)",
  "product_id BIGINT UNSIGNED",
  "sku_id BIGINT UNSIGNED",
  "quantity INT UNSIGNED",
  "selected TINYINT(1)",
  "UNIQUE KEY uk_cart_items_user_sku",
  "CHECK (quantity >= 1 AND quantity <= 999)",
  "ENGINE=InnoDB"
]);

for (const forbidden of [
  "CREATE TABLE orders",
  "CREATE TABLE order_items",
  "CREATE TABLE payments",
  "CREATE TABLE refunds",
  "CREATE TABLE commissions",
  "CREATE TABLE withdrawals",
  "CREATE TABLE settlements"
]) {
  must(!upMigration.includes(forbidden), `R4 must not create ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/cart/models.go", ["type CartItem struct", "TableName", "cart_items"]);
includes("apps/go-api-server/internal/modules/cart/dto.go", [
  "available",
  "unavailableReason",
  "selectedQuantity",
  "subtotal"
]);
includes("apps/go-api-server/internal/modules/cart/repository.go", [
  "OnConflict",
  "{Name: \"user_id\"}",
  "{Name: \"sku_id\"}",
  "LEAST(quantity + VALUES(quantity)",
  "Where(\"id = ? AND user_id = ?\"",
  "available_stock"
]);
includes("apps/go-api-server/internal/modules/cart/service.go", [
  "GetCart",
  "AddItem",
  "UpdateQuantity",
  "UpdateSelected",
  "UpdateSelection",
  "RemoveItem",
  "RemoveUnavailableItems",
  "INSUFFICIENT_STOCK",
  "PRODUCT_OFF_SHELF",
  "SKU_DISABLED"
]);

const cartService = read("apps/go-api-server/internal/modules/cart/service.go");
for (const forbidden of ["LockInventory", "UnlockInventory", "DeductInventory", "CreateOrder", "Payment"]) {
  must(!cartService.includes(forbidden), `R4 cart service must not include ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/cart/handler.go", [
  "cart.Use(middleware.JWTAuth",
  "cart.GET(\"\"",
  "cart.POST(\"/items\"",
  "cart.PATCH(\"/items/:id\"",
  "cart.PATCH(\"/items/:id/selected\"",
  "cart.PATCH(\"/selection\"",
  "cart.DELETE(\"/items/:id\"",
  "cart.DELETE(\"/unavailable-items\""
]);
includes("apps/go-api-server/internal/http/router.go", ["cartmodule", "cartHandler.RegisterAppRoutes(app)"]);
includes("apps/go-api-server/internal/swagger/swagger.go", ["/app/cart", "/app/cart/items/{id}", "/app/cart/selection"]);

includes("apps/miniapp/src/services/cart.ts", [
  "getCart",
  "addCartItem",
  "updateCartItem",
  "deleteCartItem",
  "selectCartItem",
  "selectCartItems",
  "clearUnavailableCartItems"
]);
includes("apps/miniapp/src/pages/cart/index.vue", [
  "changeQty",
  "toggleAll",
  "removeCartItem",
  "order-confirm",
  "unavailableReason",
  "availableStock"
]);
includes("apps/miniapp/src/pages/product-detail/index.vue", [
  "addCartItem",
  "加入购物车",
  "addCurrentSkuToCart",
  "order-confirm"
]);

includes("docs/v2/API路由总表.md", ["/api/v2/app/cart", "/api/v2/app/cart/items/:id", "/api/v2/app/cart/selection"]);
includes("docs/v2/数据库表清单.md", ["cart_items"]);
includes("docs/v2/数据库关系清单.md", ["UNIQUE(cart_items.user_id, cart_items.sku_id)", "禁止调用库存"]);
includes("docs/v2/错误码总表.md", ["CART_ITEM_NOT_FOUND", "CART_QUANTITY_INVALID", "CART_ITEM_UNAVAILABLE"]);

console.log("R4 cart static test passed.");
