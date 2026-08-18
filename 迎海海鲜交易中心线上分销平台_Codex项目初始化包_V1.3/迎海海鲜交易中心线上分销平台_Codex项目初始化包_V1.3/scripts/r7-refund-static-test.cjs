const fs = require("fs");
const path = require("path");

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const must = (condition, message) => {
  if (!condition) throw new Error(message);
};
const includes = (file, fragments) => {
  const content = read(file);
  for (const fragment of fragments) {
    must(content.includes(fragment), `${file} missing ${fragment}`);
  }
  return content;
};

must(exists("docs/v2/R7-退款中心冻结设计.md"), "R7 freeze design missing");

const migration = includes("apps/go-api-server/migrations/000008_r7_refund_center.up.sql", [
  "CREATE TABLE refunds",
  "CREATE TABLE refund_events",
  "UNIQUE KEY uk_refunds_order_id",
  "UNIQUE KEY uk_refund_events_provider_event",
  "provider_refund_id",
  "amount BIGINT UNSIGNED",
]);

for (const forbidden of ["after_sales", "return_shipments", "commissions", "withdrawals", "settlements", "wallets"]) {
  must(!migration.includes(forbidden), `R7 must not create ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/order/models.go", ["StatusRefunding", "StatusRefunded", "InventoryReferenceTypeRefund"]);
includes("apps/go-api-server/internal/modules/inventory/models.go", ["TxRefundReturn"]);
includes("apps/go-api-server/internal/modules/inventory/service.go", ["RefundReturnInventoryWithTx", "TxRefundReturn"]);
includes("apps/go-api-server/internal/modules/refund/provider.go", ["type RefundProvider interface", "CreateRefund", "QueryRefund", "VerifyRefundNotification"]);
includes("apps/go-api-server/internal/modules/refund/mock_provider.go", ["MockRefundProvider", "appEnv == \"production\"", "X-Mock-Refund-Signature"]);
includes("apps/go-api-server/internal/modules/refund/wechat_provider.go", ["WechatRefundProvider", "WechatPayMchID", "ErrRefundConfigMissing"]);
includes("apps/go-api-server/internal/modules/refund/service.go", [
  "CreateAdminRefund",
  "HandleProviderNotification",
  "handleRefundSuccessInTx",
  "RefundReturnInventoryWithTx",
  "ErrRefundAmountMismatch",
  "ProviderTradeNo",
  "ordermodule.StatusRefunding",
  "ordermodule.StatusRefunded",
  "paymentmodule.StatusSuccess",
  "EventRefundStockReturned",
]);
includes("apps/go-api-server/internal/modules/refund/handler.go", [
  "RegisterAdminRoutes",
  "RegisterPublicRoutes",
  "orders.POST(\"/:id/refund\"",
  "group.POST(\"/refunds/wechat/notify\"",
  "refunds.GET(\"/:id\"",
]);
includes("apps/go-api-server/internal/http/router.go", ["refundmodule", "refundHandler.RegisterAppRoutes(app)", "refundHandler.RegisterPublicRoutes(api)", "refundHandler.RegisterAdminRoutes(admin)"]);
includes("apps/go-api-server/internal/swagger/swagger.go", ["/app/refunds/{id}", "/app/orders/{id}/refund", "/refunds/wechat/notify", "/admin/refunds", "/admin/orders/{id}/refund"]);
includes("apps/miniapp/src/services/order.ts", ["getRefund", "getOrderRefund", "REFUNDING", "REFUNDED"]);
includes("apps/admin-h5/src/services/order.ts", ["getAdminRefunds", "getAdminRefundDetail", "createAdminRefund", "REFUNDING", "REFUNDED"]);
includes("docs/v2/API路由总表.md", ["/api/v2/app/refunds/:id", "/api/v2/admin/orders/:id/refund", "/api/v2/refunds/wechat/notify"]);
includes("docs/v2/错误码总表.md", ["REFUND_NOT_FOUND", "REFUND_AMOUNT_MISMATCH", "REFUND_CONFIG_MISSING"]);
includes("docs/v2/数据库表清单.md", ["refunds", "refund_events"]);
includes("docs/v2/数据库关系清单.md", ["REFUND_RETURN", "REFUNDING", "REFUNDED"]);

console.log("R7 refund static test passed.");
