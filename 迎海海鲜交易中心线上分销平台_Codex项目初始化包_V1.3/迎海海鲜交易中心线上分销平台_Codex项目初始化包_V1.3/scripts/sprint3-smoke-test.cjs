const fs = require("fs");
const path = require("path");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const has = (file, content) => assert(read(file).includes(content), `${file} missing ${content}`);

assert(fs.existsSync(path.join(root, "database/migrations/20260812030100_create_cart_and_orders.js")), "Sprint3 migration missing");
has("database/migrations/20260812030100_create_cart_and_orders.js", "cart_user_sku_active_uniq");
has("database/migrations/20260812030100_create_cart_and_orders.js", "order_items");
has("apps/api-server/src/modules/order/order.service.ts", "await client.query(\"BEGIN\")");
has("apps/api-server/src/modules/order/order.service.ts", "await client.query(\"ROLLBACK\")");
has("apps/api-server/src/modules/order/order.service.ts", "softDeleteSettledCart");
has("apps/api-server/src/modules/order/cart.controller.ts", '@Controller("app/cart")');
has("apps/api-server/src/modules/order/order.controller.ts", '@Controller("app/orders")');
has("apps/api-server/src/modules/order/admin-order.controller.ts", '@Controller("admin/orders")');
console.log("Sprint3 smoke test passed.");
