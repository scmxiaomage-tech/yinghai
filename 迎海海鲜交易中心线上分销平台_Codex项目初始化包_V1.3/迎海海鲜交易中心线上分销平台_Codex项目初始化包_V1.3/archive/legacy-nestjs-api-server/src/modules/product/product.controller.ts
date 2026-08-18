import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { ProductQueryDto } from "./dto/product-query.dto";
import { ProductService } from "./product.service";

@ApiTags("app-product")
@Controller("app")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get("categories")
  @ApiOperation({ summary: "用户端分类列表" })
  async categories() {
    return ok(await this.productService.listCategories());
  }

  @Get("products")
  @ApiOperation({ summary: "用户端商品列表" })
  async products(@Query() query: ProductQueryDto) {
    return ok(await this.productService.listProducts(query));
  }

  @Get("products/recommended")
  @ApiOperation({ summary: "用户端推荐商品" })
  async recommended() {
    return ok(await this.productService.recommended());
  }

  @Get("products/:id")
  @ApiOperation({ summary: "用户端商品详情" })
  async detail(@Param("id") id: string) {
    return ok(await this.productService.detail(id));
  }
}
