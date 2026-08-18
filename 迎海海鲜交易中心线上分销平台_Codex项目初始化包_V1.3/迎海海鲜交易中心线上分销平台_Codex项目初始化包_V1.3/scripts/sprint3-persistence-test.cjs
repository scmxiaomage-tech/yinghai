const { Pool } = require("pg");
require("dotenv").config();
if (process.env.NODE_ENV === "production") throw new Error("Persistence test is forbidden in production");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function main() {
  const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1)", [["cart", "orders", "order_items"]]);
  assert(tables.rows.length === 3, "Sprint3 tables not migrated");
  const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname='cart_user_sku_active_uniq'");
  assert(indexes.rows.length === 1, "cart active unique index missing");
  const fixture = await pool.query(
    `SELECT u.id AS user_id, a.id AS address_id, p.id AS product_id, s.id AS sku_id
     FROM users u JOIN user_address a ON a.user_id=u.id AND a.deleted_at IS NULL
     JOIN sku s ON s.status='enabled' AND s.deleted_at IS NULL
     JOIN product p ON p.id=s.product_id AND p.shelf_status='on_sale' AND p.deleted_at IS NULL
     JOIN inventory i ON i.sku_id=s.id AND i.available_stock > 0
     LIMIT 1`
  );
  assert(fixture.rows[0], "Persistence fixture missing; run db:seed:products and db:seed:sprint3");
  const tx = await pool.connect();
  try {
    await tx.query("BEGIN");
    const orderNo = `ROLLBACK-${Date.now()}`;
    const f = fixture.rows[0];
    const inserted = await tx.query(
      `INSERT INTO orders (order_no,user_id,address_id,receiver_name,receiver_phone,province,city,district,detail_address,goods_amount,delivery_fee,payable_amount)
       VALUES ($1,$2,$3,'rollback','13800000000','上海市','上海市','浦东新区','回滚测试地址',1,0,1) RETURNING id`,
      [orderNo, f.user_id, f.address_id]
    );
    try {
      await tx.query(
        `INSERT INTO order_items (order_id,product_id,sku_id,product_name,sku_name,sku_code,unit_price,quantity,subtotal_amount)
         VALUES ($1,$2,gen_random_uuid(),'rollback','rollback','ROLLBACK',1,1,1)`,
        [inserted.rows[0].id, f.product_id]
      );
    } catch (_) {}
    await tx.query("ROLLBACK");
    const after = await pool.query("SELECT id FROM orders WHERE order_no=$1", [orderNo]);
    assert(!after.rows[0], "transaction rollback left a partial order");
  } finally { tx.release(); }
  console.log("Sprint3 persistence database checks passed.");
  await pool.end();
}
void main();
