-- Sprint3 cart and order foundation. SQLite / Cloudflare D1.
CREATE TABLE IF NOT EXISTS cart (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, sku_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0), selected INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS cart_user_id_idx ON cart(user_id);
CREATE INDEX IF NOT EXISTS cart_sku_id_idx ON cart(sku_id);
CREATE UNIQUE INDEX IF NOT EXISTS cart_user_sku_active_idx ON cart(user_id, sku_id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, order_no TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL,
  address_id TEXT, receiver_name TEXT NOT NULL, receiver_phone TEXT NOT NULL,
  province TEXT NOT NULL, city TEXT NOT NULL, district TEXT NOT NULL, detail_address TEXT NOT NULL,
  longitude REAL, latitude REAL,
  goods_amount REAL NOT NULL, discount_amount REAL NOT NULL DEFAULT 0,
  delivery_fee REAL NOT NULL DEFAULT 0, payable_amount REAL NOT NULL, paid_amount REAL NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'pending_payment', payment_status TEXT NOT NULL DEFAULT 'unpaid',
  remark TEXT, delivery_risk_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, cancelled_at TEXT, completed_at TEXT
);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(order_status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, sku_id TEXT NOT NULL,
  product_name TEXT NOT NULL, sku_name TEXT NOT NULL, sku_code TEXT NOT NULL, main_image_url TEXT,
  unit_price REAL NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), subtotal_amount REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);
CREATE INDEX IF NOT EXISTS order_items_sku_id_idx ON order_items(sku_id);
