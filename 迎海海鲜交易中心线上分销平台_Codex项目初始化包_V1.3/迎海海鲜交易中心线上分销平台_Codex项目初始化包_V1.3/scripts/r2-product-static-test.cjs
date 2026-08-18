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
  return content;
};

includes("apps/go-api-server/migrations/000003_r2_product_center.up.sql", [
  "CREATE TABLE categories",
  "CREATE TABLE products",
  "CREATE TABLE product_images",
  "CREATE TABLE skus",
  "ENGINE=InnoDB",
  "CHECK (sale_price >= 0)"
]);

const migration = read("apps/go-api-server/migrations/000003_r2_product_center.up.sql");
for (const forbidden of ["CREATE TABLE inventories", "CREATE TABLE carts", "CREATE TABLE orders", "CREATE TABLE payments", "CREATE TABLE distribution"]) {
  must(!migration.includes(forbidden), `R2 must not create ${forbidden}`);
}

includes("apps/go-api-server/internal/modules/product/models.go", ["type Category struct", "type Product struct", "type ProductImage struct", "type SKU struct"]);
includes("apps/go-api-server/internal/modules/product/repository.go", ["ListCategories", "ListProducts", "FindProduct", "DeleteCategory", "CreateSKU"]);
includes("apps/go-api-server/internal/modules/product/service.go", ["ErrProductCannotOnSale", "canOnSale", "productDetailDTO", "CostPrice: sku.CostPrice"]);
includes("apps/go-api-server/internal/modules/product/handler.go", ["/categories", "/products/recommended", "/products/:id/on-sale", "/product-images/:id"]);
includes("apps/go-api-server/internal/http/router.go", ["productmodule", "RegisterAppRoutes", "RegisterAdminRoutes"]);
includes("apps/go-api-server/internal/swagger/swagger.go", ["/app/products", "/admin/products/{id}/on-sale", "/admin/skus/{id}"]);

const dto = read("apps/go-api-server/internal/modules/product/dto.go");
must(dto.includes("costPrice,omitempty"), "admin SKU DTO must expose costPrice");
must(!dto.includes("CostPrice") || dto.includes("AdminSKUDTO"), "costPrice must stay admin-only");

includes("apps/go-api-server/seeds/r2_product_dev_seed.sql", ["波士顿龙虾", "澳洲龙虾", "帝王蟹", "黑虎虾", "INSERT INTO skus"]);
includes("apps/miniapp/src/services/product.ts", ["getCategories", "getProducts", "getRecommendedProducts", "getProductDetail"]);
includes("apps/miniapp/src/pages/home/index.vue", ["getCategories", "getProducts", "getRecommendedProducts"]);
includes("apps/miniapp/src/pages/product-detail/index.vue", ["getProductDetail", "getRecommendedProducts"]);
includes("apps/admin-h5/src/services/product.ts", ["getAdminCategories", "getAdminProducts", "onSaleProduct", "offSaleProduct"]);
includes("apps/admin-h5/src/views/product-center/index.vue", ["分类管理", "商品管理", "SKU / 图片管理"]);

for (const doc of ["docs/v2/数据库表清单.md", "docs/v2/数据库关系清单.md", "docs/v2/API路由总表.md", "docs/v2/错误码总表.md"]) {
  includes(doc, ["R2"]);
}

console.log("R2 product static test passed.");
