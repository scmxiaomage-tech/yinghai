import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";
import {
  AdminCategoryDto,
  AdminProductDto,
  AdminSkuDto,
  InventoryDto,
  ProductImageDto
} from "./dto/admin-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";

@Injectable()
export class ProductService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  private stockStatus(availableStock: number, warningStock: number) {
    if (availableStock === 0) return "sold_out";
    if (availableStock <= warningStock) return "warning";
    return "normal";
  }

  async listCategories() {
    const result = await this.pool.query(
      `SELECT id, parent_id AS "parentId", name, code, icon_url AS "iconUrl", image_url AS "imageUrl", sort_order AS "sortOrder"
       FROM category
       WHERE status = 'enabled' AND deleted_at IS NULL
       ORDER BY sort_order ASC, created_at ASC`
    );
    return result.rows;
  }

  async listProducts(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    const where = ["p.shelf_status = 'on_sale'", "p.deleted_at IS NULL"];
    if (query.categoryId) {
      params.push(query.categoryId);
      where.push(`p.category_id = $${params.length}`);
    }
    if (query.keyword) {
      params.push(`%${query.keyword}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.subtitle ILIKE $${params.length})`);
    }
    const orderBy = query.sort === "price_asc" ? "min_sale_price ASC NULLS LAST" : query.sort === "price_desc" ? "min_sale_price DESC NULLS LAST" : "p.sort_order ASC, p.created_at DESC";
    params.push(pageSize, offset);
    const result = await this.pool.query(
      `SELECT p.id, p.name, p.subtitle, p.product_code AS "productCode", p.main_image_url AS "mainImageUrl", p.unit, p.origin,
              p.storage_method AS "storageMethod", p.recommend_status AS "recommendStatus", c.id AS "categoryId", c.name AS "categoryName",
              MIN(s.sale_price) AS "minSalePrice", MIN(s.market_price) AS "minMarketPrice", COALESCE(SUM(i.available_stock), 0)::int AS "availableStock"
       FROM product p
       JOIN category c ON c.id = p.category_id AND c.deleted_at IS NULL AND c.status = 'enabled'
       LEFT JOIN sku s ON s.product_id = p.id AND s.deleted_at IS NULL AND s.status = 'enabled'
       LEFT JOIN inventory i ON i.sku_id = s.id
       WHERE ${where.join(" AND ")}
       GROUP BY p.id, c.id
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { page, pageSize, items: result.rows };
  }

  async recommended() {
    const result = await this.pool.query(
      `SELECT p.id, p.name, p.subtitle, p.main_image_url AS "mainImageUrl", MIN(s.sale_price) AS "minSalePrice", MIN(s.market_price) AS "minMarketPrice"
       FROM product p
       LEFT JOIN sku s ON s.product_id = p.id AND s.deleted_at IS NULL AND s.status = 'enabled'
       WHERE p.shelf_status = 'on_sale' AND p.recommend_status = true AND p.deleted_at IS NULL
       GROUP BY p.id
       ORDER BY p.sort_order ASC, p.created_at DESC
       LIMIT 20`
    );
    return result.rows;
  }

  async detail(productId: string) {
    const product = await this.findVisibleProduct(productId);
    const [images, skus] = await Promise.all([this.productImages(productId), this.visibleSkus(productId)]);
    return { ...product, category: { id: product.categoryId, name: product.categoryName }, images, skus };
  }

  private async findVisibleProduct(productId: string) {
    const result = await this.pool.query(
      `SELECT p.id, p.name, p.subtitle, p.product_code AS "productCode", p.main_image_url AS "mainImageUrl", p.description, p.unit, p.origin,
              p.storage_method AS "storageMethod", p.shelf_status AS "shelfStatus", c.id AS "categoryId", c.name AS "categoryName"
       FROM product p
       JOIN category c ON c.id = p.category_id AND c.deleted_at IS NULL AND c.status = 'enabled'
       WHERE p.id = $1 AND p.shelf_status = 'on_sale' AND p.deleted_at IS NULL`,
      [productId]
    );
    if (!result.rows[0]) throw new NotFoundException("Product not found");
    return result.rows[0];
  }

  private async productImages(productId: string) {
    const result = await this.pool.query(
      `SELECT id, image_url AS url, image_type AS type, sort_order AS "sortOrder" FROM product_image WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [productId]
    );
    return result.rows;
  }

  private async visibleSkus(productId: string) {
    const result = await this.pool.query(
      `SELECT s.id, s.sku_code AS "skuCode", s.name, s.spec_json AS spec, s.sale_price AS "salePrice", s.market_price AS "marketPrice",
              s.member_price AS "memberPrice", s.weight, s.weight_unit AS "weightUnit", i.available_stock AS "availableStock", i.stock_status AS "stockStatus"
       FROM sku s LEFT JOIN inventory i ON i.sku_id = s.id
       WHERE s.product_id = $1 AND s.status = 'enabled' AND s.deleted_at IS NULL
       ORDER BY s.sort_order ASC, s.created_at ASC`,
      [productId]
    );
    return result.rows.map((sku) => ({
      id: sku.id,
      skuCode: sku.skuCode,
      name: sku.name,
      spec: sku.spec,
      salePrice: sku.salePrice,
      marketPrice: sku.marketPrice,
      memberPrice: sku.memberPrice,
      weight: sku.weight,
      weightUnit: sku.weightUnit,
      stock: { availableStock: sku.availableStock ?? 0, stockStatus: sku.stockStatus ?? "sold_out" }
    }));
  }

  async adminListCategories() {
    const result = await this.pool.query(
      `SELECT id, parent_id AS "parentId", name, code, icon_url AS "iconUrl", image_url AS "imageUrl", sort_order AS "sortOrder", status, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM category WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC`
    );
    return result.rows;
  }

  async adminCreateCategory(dto: AdminCategoryDto) {
    const result = await this.pool.query(
      `INSERT INTO category (parent_id, name, code, icon_url, image_url, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [dto.parentId ?? null, dto.name, dto.code, dto.iconUrl ?? null, dto.imageUrl ?? null, dto.sortOrder ?? 0, dto.status ?? "enabled"]
    );
    return result.rows[0];
  }

  async adminUpdateCategory(id: string, dto: AdminCategoryDto) {
    const result = await this.pool.query(
      `UPDATE category SET parent_id=$2, name=$3, code=$4, icon_url=$5, image_url=$6, sort_order=$7, status=$8, updated_at=now()
       WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
      [id, dto.parentId ?? null, dto.name, dto.code, dto.iconUrl ?? null, dto.imageUrl ?? null, dto.sortOrder ?? 0, dto.status ?? "enabled"]
    );
    if (!result.rows[0]) throw new NotFoundException("Category not found");
    return result.rows[0];
  }

  async adminDeleteCategory(id: string) {
    const productCount = await this.pool.query("SELECT COUNT(*)::int AS count FROM product WHERE category_id=$1 AND deleted_at IS NULL", [id]);
    if (productCount.rows[0].count > 0) throw new BadRequestException("Category has products");
    const result = await this.pool.query("UPDATE category SET deleted_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING id", [id]);
    if (!result.rows[0]) throw new NotFoundException("Category not found");
    return { id, deleted: true };
  }

  async adminListProducts(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const params: unknown[] = [];
    const where = ["p.deleted_at IS NULL"];
    if (query.categoryId) { params.push(query.categoryId); where.push(`p.category_id = $${params.length}`); }
    if (query.keyword) { params.push(`%${query.keyword}%`); where.push(`(p.name ILIKE $${params.length} OR p.product_code ILIKE $${params.length})`); }
    params.push(pageSize, offset);
    const result = await this.pool.query(
      `SELECT p.*, c.name AS category_name, MIN(s.sale_price) AS min_sale_price, COALESCE(SUM(i.available_stock),0)::int AS available_stock
       FROM product p JOIN category c ON c.id=p.category_id
       LEFT JOIN sku s ON s.product_id=p.id AND s.deleted_at IS NULL
       LEFT JOIN inventory i ON i.sku_id=s.id
       WHERE ${where.join(" AND ")}
       GROUP BY p.id, c.name
       ORDER BY p.sort_order ASC, p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { page, pageSize, items: result.rows };
  }

  async adminProductDetail(id: string) {
    const result = await this.pool.query("SELECT * FROM product WHERE id=$1 AND deleted_at IS NULL", [id]);
    if (!result.rows[0]) throw new NotFoundException("Product not found");
    const [images, skus] = await Promise.all([this.productImages(id), this.adminSkus(id)]);
    return { product: result.rows[0], images, skus };
  }

  async adminCreateProduct(dto: AdminProductDto) {
    const result = await this.pool.query(
      `INSERT INTO product (category_id, name, subtitle, product_code, main_image_url, description, unit, origin, storage_method, shelf_status, recommend_status, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [dto.categoryId, dto.name, dto.subtitle ?? null, dto.productCode, dto.mainImageUrl ?? null, dto.description ?? null, dto.unit, dto.origin ?? null, dto.storageMethod ?? null, dto.shelfStatus ?? "draft", dto.recommendStatus ?? false, dto.sortOrder ?? 0]
    );
    return result.rows[0];
  }

  async adminUpdateProduct(id: string, dto: AdminProductDto) {
    const result = await this.pool.query(
      `UPDATE product SET category_id=$2, name=$3, subtitle=$4, product_code=$5, main_image_url=$6, description=$7, unit=$8, origin=$9, storage_method=$10, shelf_status=$11, recommend_status=$12, sort_order=$13, updated_at=now()
       WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
      [id, dto.categoryId, dto.name, dto.subtitle ?? null, dto.productCode, dto.mainImageUrl ?? null, dto.description ?? null, dto.unit, dto.origin ?? null, dto.storageMethod ?? null, dto.shelfStatus ?? "draft", dto.recommendStatus ?? false, dto.sortOrder ?? 0]
    );
    if (!result.rows[0]) throw new NotFoundException("Product not found");
    return result.rows[0];
  }

  async adminUpdateShelfStatus(id: string, shelfStatus: "draft" | "on_sale" | "off_sale") {
    if (shelfStatus === "on_sale") await this.ensureCanOnSale(id);
    const result = await this.pool.query("UPDATE product SET shelf_status=$2, updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING *", [id, shelfStatus]);
    if (!result.rows[0]) throw new NotFoundException("Product not found");
    return result.rows[0];
  }

  private async ensureCanOnSale(id: string) {
    const result = await this.pool.query(
      `SELECT p.id, p.name, p.category_id, p.main_image_url,
              COUNT(s.id)::int AS sku_count, MIN(s.sale_price) AS min_sale_price, COUNT(pi.id)::int AS image_count
       FROM product p
       LEFT JOIN sku s ON s.product_id=p.id AND s.status='enabled' AND s.deleted_at IS NULL
       LEFT JOIN product_image pi ON pi.product_id=p.id
       WHERE p.id=$1 AND p.deleted_at IS NULL
       GROUP BY p.id`,
      [id]
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundException("Product not found");
    if (!row.name || !row.category_id || row.sku_count < 1 || Number(row.min_sale_price) < 0 || (!row.main_image_url && row.image_count < 1)) {
      throw new BadRequestException("Product does not meet on_sale requirements");
    }
  }

  private async adminSkus(productId: string) {
    const result = await this.pool.query(
      `SELECT s.*, i.available_stock, i.locked_stock, i.warning_stock, i.stock_status FROM sku s LEFT JOIN inventory i ON i.sku_id=s.id WHERE s.product_id=$1 AND s.deleted_at IS NULL ORDER BY s.sort_order ASC`,
      [productId]
    );
    return result.rows;
  }

  async adminCreateSku(productId: string, dto: AdminSkuDto) {
    const result = await this.pool.query(
      `INSERT INTO sku (product_id, sku_code, name, spec_json, cost_price, sale_price, market_price, member_price, weight, weight_unit, status, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [productId, dto.skuCode, dto.name, dto.spec ?? {}, dto.costPrice ?? null, dto.salePrice, dto.marketPrice ?? null, dto.memberPrice ?? null, dto.weight ?? null, dto.weightUnit ?? null, dto.status ?? "enabled", dto.sortOrder ?? 0]
    );
    return result.rows[0];
  }

  async adminUpdateSku(id: string, dto: AdminSkuDto) {
    const result = await this.pool.query(
      `UPDATE sku SET sku_code=$2, name=$3, spec_json=$4, cost_price=$5, sale_price=$6, market_price=$7, member_price=$8, weight=$9, weight_unit=$10, status=$11, sort_order=$12, updated_at=now()
       WHERE id=$1 AND deleted_at IS NULL RETURNING *`,
      [id, dto.skuCode, dto.name, dto.spec ?? {}, dto.costPrice ?? null, dto.salePrice, dto.marketPrice ?? null, dto.memberPrice ?? null, dto.weight ?? null, dto.weightUnit ?? null, dto.status ?? "enabled", dto.sortOrder ?? 0]
    );
    if (!result.rows[0]) throw new NotFoundException("Sku not found");
    return result.rows[0];
  }

  async adminDeleteSku(id: string) {
    const result = await this.pool.query("UPDATE sku SET deleted_at=now(), updated_at=now() WHERE id=$1 AND deleted_at IS NULL RETURNING id", [id]);
    if (!result.rows[0]) throw new NotFoundException("Sku not found");
    return { id, deleted: true };
  }

  async adminListInventory() {
    const result = await this.pool.query(
      `SELECT i.*, s.name AS sku_name, s.sku_code, p.name AS product_name FROM inventory i JOIN sku s ON s.id=i.sku_id JOIN product p ON p.id=s.product_id ORDER BY i.updated_at DESC`
    );
    return result.rows;
  }

  async adminInventoryDetail(skuId: string) {
    const result = await this.pool.query("SELECT * FROM inventory WHERE sku_id=$1", [skuId]);
    if (!result.rows[0]) throw new NotFoundException("Inventory not found");
    return result.rows[0];
  }

  async adminUpdateInventory(skuId: string, dto: InventoryDto) {
    const stockStatus = this.stockStatus(dto.availableStock, dto.warningStock);
    const result = await this.pool.query(
      `INSERT INTO inventory (sku_id, available_stock, locked_stock, warning_stock, stock_status, updated_at)
       VALUES ($1,$2,$3,$4,$5,now())
       ON CONFLICT (sku_id) DO UPDATE SET available_stock=$2, locked_stock=$3, warning_stock=$4, stock_status=$5, updated_at=now()
       RETURNING *`,
      [skuId, dto.availableStock, dto.lockedStock ?? 0, dto.warningStock, stockStatus]
    );
    return result.rows[0];
  }

  async adminAddProductImage(productId: string, dto: ProductImageDto) {
    if (dto.imageType === "main") {
      await this.pool.query("DELETE FROM product_image WHERE product_id=$1 AND image_type='main'", [productId]);
    }
    const result = await this.pool.query(
      `INSERT INTO product_image (product_id, image_url, image_type, sort_order) VALUES ($1,$2,$3,$4) RETURNING *`,
      [productId, dto.imageUrl, dto.imageType, dto.sortOrder ?? 0]
    );
    if (dto.imageType === "main") {
      await this.pool.query("UPDATE product SET main_image_url=$2, updated_at=now() WHERE id=$1", [productId, dto.imageUrl]);
    }
    return result.rows[0];
  }

  async adminDeleteProductImage(id: string) {
    const result = await this.pool.query("DELETE FROM product_image WHERE id=$1 RETURNING id", [id]);
    if (!result.rows[0]) throw new NotFoundException("Product image not found");
    return { id, deleted: true };
  }
}