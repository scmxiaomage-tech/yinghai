const fs = require("fs");
const path = require("path");

let root = process.cwd();
while (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  const parent = path.dirname(root);
  if (parent === root) {
    throw new Error("Cannot locate workspace root");
  }
  root = parent;
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(file, snippets) {
  const content = read(file);
  for (const snippet of snippets) {
    assert(content.includes(snippet), `${file} missing: ${snippet}`);
  }
}

const migrations = [
  "database/migrations/20260812010100_create_users.js",
  "database/migrations/20260812010200_create_user_profile.js",
  "database/migrations/20260812010300_create_user_address.js",
  "database/migrations/20260812010400_create_user_login_record.js",
  "database/migrations/20260812010500_create_message.js"
];

for (const file of migrations) {
  assert(exists(file), `Migration missing: ${file}`);
  const migration = require(path.join(root, file));
  assert(typeof migration.up === "function", `${file} missing up()`);
  assert(typeof migration.down === "function", `${file} missing down()`);
}

assertIncludes("apps/api-server/src/app.module.ts", [
  "AuthModule",
  "UserModule",
  "AddressModule",
  "LocationModule",
  "MessageModule"
]);

assertIncludes("apps/api-server/src/modules/auth/auth.controller.ts", [
  '@Controller("app/auth")',
  '@Post("wechat-login")',
  '@Post("refresh-token")',
  '@Get("me")',
  '@Post("logout")'
]);

assertIncludes("apps/api-server/src/modules/user/user.controller.ts", [
  '@Controller("app/user")',
  '@Get("profile")',
  '@Put("profile")'
]);

assertIncludes("apps/api-server/src/modules/address/address.controller.ts", [
  '@Controller("app/user/addresses")',
  "@Get()",
  "@Post()",
  '@Put(":id")',
  '@Delete(":id")',
  '@Put(":id/default")'
]);

assertIncludes("apps/api-server/src/modules/location/location.controller.ts", [
  '@Controller("app/user/location")',
  "@Post()",
  "@Get()"
]);

assertIncludes("apps/api-server/src/modules/message/message.controller.ts", [
  '@Controller("app/messages")',
  '@Get("unread-count")',
  '@Put(":id/read")',
  '@Put("read-all")'
]);

assertIncludes("apps/api-server/src/main.ts", [".addBearerAuth()"]);
assertIncludes("apps/api-server/.env.example", [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "WECHAT_MINIAPP_APP_ID",
  "WECHAT_MINIAPP_SECRET"
]);

if (!process.argv.includes("--api-only")) {
  assertIncludes("apps/miniapp/src/services/user-system.ts", [
    "/auth/wechat-login",
    "/user/profile",
    "/user/addresses",
    "/user/location",
    "/messages/unread-count"
  ]);
  assertIncludes("apps/miniapp/src/stores/user-system.ts", [
    "loginWithWechatCode",
    "loadProfile",
    "loadAddresses",
    "saveLocation",
    "loadMessages"
  ]);
}

const apiFiles = fs
  .readdirSync(path.join(root, "apps/api-server/src/modules"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Sprint1 骨架约束仅禁止尚未冻结的支付与分销模块；Sprint2/3 已正式引入商品与订单模块。
const forbiddenModules = ["products", "orders", "payment", "distribution"];
for (const forbidden of forbiddenModules) {
  assert(!apiFiles.includes(forbidden), `Forbidden Sprint1 module exists: ${forbidden}`);
}

console.log("Sprint1 smoke test passed.");
