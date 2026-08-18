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

must(exists("docs/v2/R5-订单中心冻结设计.md"), "R5 freeze design missing");
const migration = includes("apps/go-api-server/migrations/000006_r5_order_center.up.sql", [
  "CREATE TABLE orders",
  "CREATE TABLE order_items",
  "UNIQUE KEY uk_orders_order_no",
  "UNIQUE KEY uk_orders_user_request",
  "DROP INDEX uk_inventory_transactions_reference",
  "UNIQUE KEY uk_inventory_transactions_sku_reference (sku_id, reference_type, reference_id, type)",
  "item_amount BIGINT UNSIGNED",
  "payable_amount BIGINT UNSIGNED",
  "expire_at DATETIME(3)"
]);

for (const forbidden of ["CREATE TABLE payments", "CREATE TABLE refunds", "CREATE TABLE commissions", "CREATE TABLE withdrawals", "CREATE TABLE settlements"]) {
  must(!migration.includes(forbidden), `R5 must not create ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/inventory/service.go", [
  "LockInventoryWithTx",
  "UnlockInventoryWithTx",
  "stockOperationWithTx"
]);
includes("apps/go-api-server/internal/modules/order/models.go", [
  "StatusPendingPayment",
  "StatusCancelled",
  "StatusClosed",
  "type Order struct",
  "type OrderItem struct"
]);
includes("apps/go-api-server/internal/modules/order/repository.go", [
  "FindByUserRequest",
  "ProductSnapshots",
  "UpdateStatusIfPending",
  "ExpiredPendingOrders",
  "RemoveCartItemsBySKU"
]);
const service = includes("apps/go-api-server/internal/modules/order/service.go", [
  "Preview",
  "Create",
  "Cancel",
  "CloseExpiredOrders",
  "PriceSnapshot",
  "priceSnapshot",
  "LockInventoryWithTx",
  "UnlockInventoryWithTx",
  "sort.Slice(orderItems",
  "ErrOrderPriceChanged",
  "ErrOrderInsufficientStock",
  "InventoryReferenceTypeOrder"
]);
must(!service.includes("DeductInventory"), "R5 order service must not call DeductInventory");
for (const forbidden of ["CreatePayment", "WechatPay", "PaymentCallback", "PaySuccess"]) {
  must(!service.includes(forbidden), `R5 order service must not implement ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/order/handler.go", [
  "orders.POST(\"/preview\"",
  "orders.POST(\"\"",
  "orders.GET(\"\"",
  "orders.GET(\"/:id\"",
  "orders.POST(\"/:id/cancel\"",
  "RegisterAdminRoutes"
]);
includes("apps/go-api-server/internal/http/router.go", ["ordermodule", "orderHandler.RegisterAppRoutes(app)", "orderHandler.RegisterAdminRoutes(admin)"]);
includes("apps/go-api-server/internal/config/config.go", ["OrderExpireMinutes", "ORDER_EXPIRE_MINUTES"]);
includes("apps/go-api-server/internal/swagger/swagger.go", ["/app/orders/preview", "/app/orders/{id}/cancel", "/admin/orders"]);

includes("apps/miniapp/src/services/order.ts", ["previewOrder", "createOrder", "getOrders", "getOrderDetail", "cancelOrder", "priceSnapshot"]);
includes("apps/miniapp/src/pages/order-confirm/index.vue", ["previewOrder", "createOrder", "priceSnapshot", "提交订单"]);
includes("apps/miniapp/src/pages/order-list/index.vue", ["getOrders", "PENDING_PAYMENT", "CANCELLED", "CLOSED"]);
includes("apps/miniapp/src/pages/order-detail/index.vue", ["cancelOrder", "createPayment", "getPaymentStatus", "statusText"]);
includes("apps/admin-h5/src/services/order.ts", ["getAdminOrders", "getAdminOrderDetail", "payableAmountText", "PENDING_PAYMENT"]);
includes("apps/admin-h5/src/views/order-center/index.vue", ["R5 只读查看订单", "goodsSummary", "statusText"]);

includes("docs/v2/API路由总表.md", ["/api/v2/app/orders/preview", "/api/v2/app/orders/:id/cancel", "/api/v2/admin/orders"]);
includes("docs/v2/数据库表清单.md", ["orders", "order_items"]);
includes("docs/v2/数据库关系清单.md", ["UNIQUE(inventory_transactions.sku_id, reference_type, reference_id, type)", "订单创建事务"]);
includes("docs/v2/错误码总表.md", ["ORDER_PRICE_CHANGED", "ORDER_INSUFFICIENT_STOCK", "ORDER_INVALID_STATUS"]);

console.log("R5 order static test passed.");
