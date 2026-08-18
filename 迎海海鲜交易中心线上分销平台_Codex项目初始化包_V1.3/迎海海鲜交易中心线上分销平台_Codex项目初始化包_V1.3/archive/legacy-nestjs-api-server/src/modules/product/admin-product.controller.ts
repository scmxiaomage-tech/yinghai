import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import {
  AdminCategoryDto,
  AdminProductDto,
  AdminSkuDto,
  InventoryDto,
  ProductImageDto,
  ShelfStatusDto
} from "./dto/admin-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";
import { ProductService } from "./product.service";

@ApiTags("admin-product")
@Controller("admin")
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Get("categories")
  @ApiOperation({ summary: "后台分类列表" })
  async categories() {
    return ok(await this.productService.adminListCategories());
  }

  @Post("categories")
  @ApiOperation({ summary: "后台新增分类" })
  async createCategory(@Body() dto: AdminCategoryDto) {
    return ok(await this.productService.adminCreateCategory(dto));
  }

  @Put("categories/:id")
  @ApiOperation({ summary: "后台更新分类" })
  async updateCategory(@Param("id") id: string, @Body() dto: AdminCategoryDto) {
    return ok(await this.productService.adminUpdateCategory(id, dto));
  }

  @Delete("categories/:id")
  @ApiOperation({ summary: "后台删除分类" })
  async deleteCategory(@Param("id") id: string) {
    return ok(await this.productService.adminDeleteCategory(id));
  }

  @Get("products")
  @ApiOperation({ summary: "后台商品列表" })
  async products(@Query() query: ProductQueryDto) {
    return ok(await this.productService.adminListProducts(query));
  }

  @Get("products/:id")
  @ApiOperation({ summary: "后台商品详情" })
  async productDetail(@Param("id") id: string) {
    return ok(await this.productService.adminProductDetail(id));
  }

  @Post("products")
  @ApiOperation({ summary: "后台新增商品" })
  async createProduct(@Body() dto: AdminProductDto) {
    return ok(await this.productService.adminCreateProduct(dto));
  }

  @Put("products/:id")
  @ApiOperation({ summary: "后台更新商品" })
  async updateProduct(@Param("id") id: string, @Body() dto: AdminProductDto) {
    return ok(await this.productService.adminUpdateProduct(id, dto));
  }

  @Put("products/:id/shelf-status")
  @ApiOperation({ summary: "后台商品上下架" })
  async shelfStatus(@Param("id") id: string, @Body() dto: ShelfStatusDto) {
    return ok(await this.productService.adminUpdateShelfStatus(id, dto.shelfStatus));
  }

  @Post("products/:productId/skus")
  @ApiOperation({ summary: "后台新增SKU" })
  async createSku(@Param("productId") productId: string, @Body() dto: AdminSkuDto) {
    return ok(await this.productService.adminCreateSku(productId, dto));
  }

  @Put("skus/:id")
  @ApiOperation({ summary: "后台更新SKU" })
  async updateSku(@Param("id") id: string, @Body() dto: AdminSkuDto) {
    return ok(await this.productService.adminUpdateSku(id, dto));
  }

  @Delete("skus/:id")
  @ApiOperation({ summary: "后台删除SKU" })
  async deleteSku(@Param("id") id: string) {
    return ok(await this.productService.adminDeleteSku(id));
  }

  @Get("inventory")
  @ApiOperation({ summary: "后台库存列表" })
  async inventory() {
    return ok(await this.productService.adminListInventory());
  }

  @Get("inventory/:skuId")
  @ApiOperation({ summary: "后台库存详情" })
  async inventoryDetail(@Param("skuId") skuId: string) {
    return ok(await this.productService.adminInventoryDetail(skuId));
  }

  @Put("inventory/:skuId")
  @ApiOperation({ summary: "后台调整库存" })
  async updateInventory(@Param("skuId") skuId: string, @Body() dto: InventoryDto) {
    return ok(await this.productService.adminUpdateInventory(skuId, dto));
  }

  @Post("products/:productId/images")
  @ApiOperation({ summary: "后台新增商品图片URL" })
  async addImage(@Param("productId") productId: string, @Body() dto: ProductImageDto) {
    return ok(await this.productService.adminAddProductImage(productId, dto));
  }

  @Delete("product-images/:id")
  @ApiOperation({ summary: "后台删除商品图片" })
  async deleteImage(@Param("id") id: string) {
    return ok(await this.productService.adminDeleteProductImage(id));
  }
}
