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

must(exists("docs/v2/R6-支付中心冻结设计.md"), "R6 freeze design missing");
const migration = includes("apps/go-api-server/migrations/000007_r6_payment_center.up.sql", [
  "CREATE TABLE payments",
  "CREATE TABLE payment_events",
  "UNIQUE KEY uk_payments_payment_no",
  "UNIQUE KEY uk_payment_events_provider_event",
  "provider_trade_no",
  "client_request_id",
  "amount BIGINT UNSIGNED NOT NULL"
]);
for (const forbidden of ["CREATE TABLE refunds", "CREATE TABLE commissions", "CREATE TABLE withdrawals", "CREATE TABLE settlements"]) {
  must(!migration.includes(forbidden), `R6 must not create ${forbidden}`);
}

const orderHandler = read("apps/go-api-server/internal/modules/order/handler.go");
must(!orderHandler.includes("orders.POST(\"/expired/close\""), "App user must not call expired close job");

includes("apps/go-api-server/internal/modules/inventory/service.go", ["DeductInventoryWithTx", "TxDeduct"]);
includes("apps/go-api-server/internal/modules/payment/provider.go", [
  "type PaymentProvider interface",
  "CreatePayment",
  "QueryPayment",
  "ClosePayment",
  "VerifyAndParseNotification",
  "PAYMENT_AMOUNT_MISMATCH",
  "PAYMENT_CONFIG_MISSING"
]);
includes("apps/go-api-server/internal/modules/payment/wechat_provider.go", ["WechatPayProvider", "validateConfig", "ErrPaymentConfigMissing"]);
includes("apps/go-api-server/internal/modules/payment/mock_provider.go", ["MockPaymentProvider", "X-Mock-Payment-Signature", "appEnv == \"production\""]);
includes("apps/go-api-server/internal/modules/payment/service.go", [
  "CreatePayment",
  "HandleProviderNotification",
  "QueryAndSync",
  "recordAndHandleNotification",
  "DeductInventoryWithTx",
  "UpdateOrderPaid",
  "payment.Amount != notification.Amount",
  "order.PayableAmount",
  "StatusSuccess",
  "RecoverPendingPayments"
]);
includes("apps/go-api-server/internal/modules/payment/handler.go", [
  "orders.POST(\"/:id/payments\"",
  "orders.GET(\"/:id/payment-status\"",
  "POST",
  "RegisterPublicRoutes",
  "PAYMENT_SIGNATURE_INVALID",
  "PAYMENT_AMOUNT_MISMATCH"
]);
includes("apps/go-api-server/internal/http/router.go", ["paymentmodule", "paymentHandler.RegisterAppRoutes(app)", "paymentHandler.RegisterPublicRoutes(api)", "paymentHandler.RegisterAdminRoutes(admin)"]);
includes("apps/go-api-server/internal/swagger/swagger.go", ["/app/orders/{id}/payments", "/app/orders/{id}/payment-status", "/payments/wechat/notify", "/admin/payments"]);
includes("apps/miniapp/src/services/order.ts", ["createPayment", "getPaymentStatus", "WECHAT_PAY", "PAID"]);
includes("apps/miniapp/src/pages/order-detail/index.vue", ["createPayment", "getPaymentStatus", "正在确认支付结果", "前端支付回调不直接改 PAID"]);
includes("apps/miniapp/src/pages/order-list/index.vue", ["PAID", "已支付"]);
includes("apps/admin-h5/src/services/order.ts", ["getAdminPayments", "getAdminPaymentDetail", "AdminPayment"]);
includes("docs/v2/API路由总表.md", ["/api/v2/app/orders/:id/payments", "/api/v2/payments/wechat/notify", "/api/v2/admin/payments"]);
includes("docs/v2/错误码总表.md", ["PAYMENT_AMOUNT_MISMATCH", "PAYMENT_SIGNATURE_INVALID", "PAYMENT_CONFIG_MISSING"]);

console.log("R6 payment static test passed.");
