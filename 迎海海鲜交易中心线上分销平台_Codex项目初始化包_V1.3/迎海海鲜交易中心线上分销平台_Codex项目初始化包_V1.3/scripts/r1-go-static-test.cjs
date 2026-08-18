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
};

must(exists("docs/v2/V2.1-数据库与API总体冻结设计.md"), "V2.1 design doc missing");
must(exists("docs/v2/数据库表清单.md"), "table list missing");
must(exists("docs/v2/数据库关系清单.md"), "relation list missing");
must(exists("docs/v2/API路由总表.md"), "api route list missing");
must(exists("docs/v2/错误码总表.md"), "error code list missing");

includes("apps/go-api-server/migrations/000002_r1_user_auth.up.sql", [
  "CREATE TABLE IF NOT EXISTS users",
  "CREATE TABLE IF NOT EXISTS user_profiles",
  "CREATE TABLE IF NOT EXISTS user_addresses",
  "CREATE TABLE IF NOT EXISTS user_login_records",
  "ENGINE=InnoDB"
]);

const migration = read("apps/go-api-server/migrations/000002_r1_user_auth.up.sql");
for (const forbidden of ["products", "orders", "payments", "distribution"]) {
  must(!migration.includes(`CREATE TABLE IF NOT EXISTS ${forbidden}`), `R1 must not create ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/user/models.go", ["type User struct", "type UserProfile struct", "type UserAddress struct", "type UserLoginRecord struct"]);
includes("apps/go-api-server/internal/modules/user/repository.go", ["FindByOpenID", "CreateUserWithProfile", "ListAddresses", "SetDefaultAddress"]);
includes("apps/go-api-server/internal/modules/auth/service.go", ["WechatLogin", "SignToken", "mock_openid_", "UserLoginRecord"]);
includes("apps/go-api-server/internal/modules/auth/handler.go", ["/wechat-login", "/me", "/logout"]);
includes("apps/go-api-server/internal/modules/user/handler.go", ["/profile", "/addresses", "/addresses/:id/default"]);
includes("apps/go-api-server/internal/middleware/jwt.go", ["JWTAuth", "Bearer ", "UNAUTHORIZED"]);
includes("apps/go-api-server/internal/http/router.go", ["/app", "NewRepository", "NewService", "RegisterRoutes"]);
includes("apps/go-api-server/internal/swagger/swagger.go", ["/app/auth/wechat-login", "/app/user/profile", "/app/user/addresses"]);

console.log("R1 Go static test passed.");
