require("dotenv").config();
const { Pool } = require("pg");

if (process.env.NODE_ENV === "production") throw new Error("Sprint3 seed is forbidden in production");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(
      `INSERT INTO users (openid, phone, status) VALUES ('sprint3-persist-user', '13800000031', 'active')
       ON CONFLICT (openid) DO UPDATE SET phone=EXCLUDED.phone, status='active', updated_at=now() RETURNING id`
    );
    const userId = user.rows[0].id;
    const address = await client.query(
      `INSERT INTO user_address (user_id, receiver_name, receiver_phone, province, city, district, detail_address, is_default)
       SELECT $1,'Sprint3测试用户','13800000031','上海市','上海市','浦东新区','持久化测试路31号',true
       WHERE NOT EXISTS (SELECT 1 FROM user_address WHERE user_id=$1 AND deleted_at IS NULL)
       RETURNING id`,
      [userId]
    );
    await client.query("COMMIT");
    console.log(JSON.stringify({ userId, addressId: address.rows[0]?.id ?? null }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
