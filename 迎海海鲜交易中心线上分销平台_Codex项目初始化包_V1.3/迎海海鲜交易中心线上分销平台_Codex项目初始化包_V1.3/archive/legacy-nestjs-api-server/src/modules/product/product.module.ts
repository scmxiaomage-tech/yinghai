import { AdminProductController } from "./admin-product.controller";
import { Module } from "@nestjs/common";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";

@Module({
  controllers: [ProductController, AdminProductController],
  providers: [ProductService],
  exports: [ProductService]
})
export class ProductModule {}
