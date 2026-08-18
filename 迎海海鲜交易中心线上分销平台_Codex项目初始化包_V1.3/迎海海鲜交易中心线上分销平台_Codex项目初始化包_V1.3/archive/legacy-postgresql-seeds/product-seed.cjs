require("dotenv").config();
const { Pool } = require("pg");

if (process.env.NODE_ENV === "production") {
  throw new Error("Product seed is forbidden in production");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const image = (name) => `https://dummyimage.com/800x600/11110f/d7aa4d&text=${encodeURIComponent(name)}`;

const categories = [
  { code: "lobster", name: "龙虾", sort: 1 },
  { code: "crab", name: "螃蟹", sort: 2 },
  { code: "fish", name: "鱼类", sort: 3 },
  { code: "shell", name: "贝类", sort: 4 },
  { code: "shrimp", name: "虾类", sort: 5 }
];

const products = [
  ["lobster", "波士顿龙虾", "鲜活直达 · 尊享臻选", "DEMO-LOBSTER", "只", "加拿大", "鲜活冷链", "258.00", "298.00", 20],
  ["crab", "鲜活帝王蟹", "深海大只 · 蟹肉饱满", "DEMO-KING-CRAB", "只", "俄罗斯", "冷链鲜活", "998.00", "1688.00", 8],
  ["crab", "阳澄湖大闸蟹", "膏黄丰盈 · 当季好蟹", "DEMO-HAIRY-CRAB", "盒", "江苏", "冷藏", "198.00", "298.00", 32],
  ["shell", "深海活鲍", "宴席优选 · 高端送礼", "DEMO-ABALONE", "盒", "福建", "冷藏", "128.00", "168.00", 26],
  ["fish", "冰鲜三文鱼刺身", "鲜切冰鲜 · 顺丰发货", "DEMO-SALMON", "盒", "挪威", "冷藏", "198.00", "228.00", 18],
  ["shrimp", "巨型黑虎虾", "30-35cm · 坏单包赔", "DEMO-TIGER-SHRIMP", "盒", "越南", "冷冻", "73.80", "99.00", 60],
  ["fish", "东海黄鱼", "野生大黄鱼 · 海鲜臻选", "DEMO-YELLOW-FISH", "条", "东海", "冷链", "89.00", "128.00", 14],
  ["shell", "鲜肥海螺", "当天鲜活发货", "DEMO-CONCH", "斤", "大连", "冷藏", "68.00", "98.00", 22]
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const categoryIds = {};
    for (const item of categories) {
      const result = await client.query(
        `INSERT INTO category (name, code, sort_order, status, image_url)
         VALUES ($1,$2,$3,'enabled',$4)
         ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, sort_order=EXCLUDED.sort_order, status='enabled', updated_at=now()
         RETURNING id`,
        [item.name, item.code, item.sort, image(item.name)]
      );
      categoryIds[item.code] = result.rows[0].id;
    }

    let index = 1;
    for (const [categoryCode, name, subtitle, productCode, unit, origin, storageMethod, salePrice, marketPrice, stock] of products) {
      const productResult = await client.query(
        `INSERT INTO product (category_id, name, subtitle, product_code, main_image_url, description, unit, origin, storage_method, shelf_status, recommend_status, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'on_sale',true,$10)
         ON CONFLICT (product_code) DO UPDATE SET name=EXCLUDED.name, subtitle=EXCLUDED.subtitle, main_image_url=EXCLUDED.main_image_url, shelf_status='on_sale', recommend_status=true, updated_at=now()
         RETURNING id`,
        [categoryIds[categoryCode], name, subtitle, productCode, image(name), `${name} 演示商品详情。`, unit, origin, storageMethod, index]
      );
      const productId = productResult.rows[0].id;
      await client.query(
        `INSERT INTO product_image (product_id, image_url, image_type, sort_order)
         VALUES ($1,$2,'main',1)
         ON CONFLICT DO NOTHING`,
        [productId, image(name)]
      );
      const skuResult = await client.query(
        `INSERT INTO sku (product_id, sku_code, name, spec_json, sale_price, market_price, status, sort_order)
         VALUES ($1,$2,$3,'{}'::jsonb,$4,$5,'enabled',1)
         ON CONFLICT (sku_code) DO UPDATE SET sale_price=EXCLUDED.sale_price, market_price=EXCLUDED.market_price, status='enabled', updated_at=now()
         RETURNING id`,
        [productId, `${productCode}-SKU`, unit === "只" ? "标准装/只" : `标准装/${unit}`, salePrice, marketPrice]
      );
      const skuId = skuResult.rows[0].id;
      const stockStatus = stock === 0 ? "sold_out" : stock <= 5 ? "warning" : "normal";
      await client.query(
        `INSERT INTO inventory (sku_id, available_stock, locked_stock, warning_stock, stock_status)
         VALUES ($1,$2,0,5,$3)
         ON CONFLICT (sku_id) DO UPDATE SET available_stock=$2, warning_stock=5, stock_status=$3, updated_at=now()`,
        [skuId, stock, stockStatus]
      );
      index += 1;
    }
    await client.query("COMMIT");
    console.log("Sprint2 product seed completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
