import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Sprint3: one active cart record per user + SKU. */
export const cart = sqliteTable("cart", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  skuId: text("sku_id").notNull(),
  quantity: integer("quantity").notNull(),
  selected: integer("selected", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
}, (table) => [
  index("cart_user_id_idx").on(table.userId),
  index("cart_sku_id_idx").on(table.skuId),
  // 活跃行唯一约束由 migration 中的 partial unique index（deleted_at IS NULL）实现。
  index("cart_user_sku_active_idx").on(table.userId, table.skuId),
]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNo: text("order_no").notNull().unique(),
  userId: text("user_id").notNull(),
  addressId: text("address_id"),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone").notNull(),
  province: text("province").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  detailAddress: text("detail_address").notNull(),
  longitude: real("longitude"),
  latitude: real("latitude"),
  goodsAmount: real("goods_amount").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  deliveryFee: real("delivery_fee").notNull().default(0),
  payableAmount: real("payable_amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  orderStatus: text("order_status").notNull().default("pending_payment"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  remark: text("remark"),
  deliveryRiskConfirmed: integer("delivery_risk_confirmed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  cancelledAt: text("cancelled_at"),
  completedAt: text("completed_at"),
}, (table) => [
  index("orders_user_created_idx").on(table.userId, table.createdAt),
  index("orders_status_idx").on(table.orderStatus),
  index("orders_payment_status_idx").on(table.paymentStatus),
]);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  skuId: text("sku_id").notNull(),
  productName: text("product_name").notNull(),
  skuName: text("sku_name").notNull(),
  skuCode: text("sku_code").notNull(),
  mainImageUrl: text("main_image_url"),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  subtotalAmount: real("subtotal_amount").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_id_idx").on(table.productId),
  index("order_items_sku_id_idx").on(table.skuId),
]);
