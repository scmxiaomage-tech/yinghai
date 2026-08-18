exports.up = (pgm) => {
  pgm.createTable("cart", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    sku_id: { type: "uuid", notNull: true, references: "sku(id)", onDelete: "RESTRICT" },
    quantity: { type: "integer", notNull: true },
    selected: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    deleted_at: { type: "timestamptz" }
  });
  pgm.addConstraint("cart", "cart_quantity_positive_chk", { check: "quantity > 0" });
  pgm.createIndex("cart", ["user_id", "updated_at"], { name: "cart_user_updated_idx" });
  pgm.createIndex("cart", ["sku_id"], { name: "cart_sku_idx" });
  pgm.createIndex("cart", ["user_id", "sku_id"], {
    name: "cart_user_sku_active_uniq",
    unique: true,
    where: "deleted_at IS NULL"
  });

  pgm.createTable("orders", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    order_no: { type: "varchar(64)", notNull: true },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "RESTRICT" },
    address_id: { type: "uuid", references: "user_address(id)", onDelete: "SET NULL" },
    receiver_name: { type: "varchar(64)", notNull: true },
    receiver_phone: { type: "varchar(32)", notNull: true },
    province: { type: "varchar(64)", notNull: true },
    city: { type: "varchar(64)", notNull: true },
    district: { type: "varchar(64)", notNull: true },
    detail_address: { type: "varchar(255)", notNull: true },
    door_no: { type: "varchar(128)" },
    longitude: { type: "numeric(10,6)" },
    latitude: { type: "numeric(10,6)" },
    delivery_remark: { type: "varchar(255)" },
    goods_amount: { type: "numeric(12,2)", notNull: true },
    discount_amount: { type: "numeric(12,2)", notNull: true, default: 0 },
    delivery_fee: { type: "numeric(12,2)", notNull: true, default: 0 },
    payable_amount: { type: "numeric(12,2)", notNull: true },
    paid_amount: { type: "numeric(12,2)", notNull: true, default: 0 },
    order_status: { type: "varchar(32)", notNull: true, default: "pending_payment" },
    payment_status: { type: "varchar(32)", notNull: true, default: "unpaid" },
    delivery_status: { type: "varchar(32)", notNull: true, default: "pending" },
    cancel_reason: { type: "varchar(255)" },
    remark: { type: "varchar(255)" },
    delivery_risk_confirmed: { type: "boolean", notNull: true, default: false },
    idempotency_key: { type: "varchar(128)" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    paid_at: { type: "timestamptz" },
    shipped_at: { type: "timestamptz" },
    completed_at: { type: "timestamptz" },
    cancelled_at: { type: "timestamptz" }
  });
  pgm.addConstraint("orders", "orders_order_status_chk", {
    check: "order_status IN ('pending_payment','paid','preparing','delivering','completed','cancelled','after_sale','closed')"
  });
  pgm.addConstraint("orders", "orders_payment_status_chk", {
    check: "payment_status IN ('unpaid','paid','refunding','refunded','failed')"
  });
  pgm.addConstraint("orders", "orders_delivery_status_chk", {
    check: "delivery_status IN ('pending','preparing','shipped','delivered')"
  });
  pgm.addConstraint("orders", "orders_amount_nonnegative_chk", {
    check: "goods_amount >= 0 AND discount_amount >= 0 AND delivery_fee >= 0 AND payable_amount >= 0 AND paid_amount >= 0"
  });
  pgm.createIndex("orders", "order_no", { name: "orders_order_no_uniq", unique: true });
  pgm.createIndex("orders", ["user_id", "created_at"], { name: "orders_user_created_idx" });
  pgm.createIndex("orders", ["order_status", "created_at"], { name: "orders_status_created_idx" });
  pgm.createIndex("orders", ["payment_status", "created_at"], { name: "orders_payment_created_idx" });
  pgm.createIndex("orders", ["user_id", "idempotency_key"], {
    name: "orders_user_idempotency_uniq",
    unique: true,
    where: "idempotency_key IS NOT NULL"
  });

  pgm.createTable("order_items", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    order_id: { type: "uuid", notNull: true, references: "orders(id)", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true, references: "product(id)", onDelete: "RESTRICT" },
    sku_id: { type: "uuid", notNull: true, references: "sku(id)", onDelete: "RESTRICT" },
    product_name: { type: "varchar(128)", notNull: true },
    main_image_url: { type: "text" },
    sku_name: { type: "varchar(128)", notNull: true },
    sku_code: { type: "varchar(64)", notNull: true },
    spec_snapshot: { type: "jsonb" },
    unit_price: { type: "numeric(12,2)", notNull: true },
    quantity: { type: "integer", notNull: true },
    subtotal_amount: { type: "numeric(12,2)", notNull: true },
    after_sale_status: { type: "varchar(32)", notNull: true, default: "none" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("order_items", "order_items_quantity_positive_chk", { check: "quantity > 0" });
  pgm.addConstraint("order_items", "order_items_amount_nonnegative_chk", {
    check: "unit_price >= 0 AND subtotal_amount >= 0"
  });
  pgm.createIndex("order_items", "order_id", { name: "order_items_order_idx" });
  pgm.createIndex("order_items", "sku_id", { name: "order_items_sku_idx" });
};

exports.down = (pgm) => {
  pgm.dropTable("order_items");
  pgm.dropTable("orders");
  pgm.dropTable("cart");
};
