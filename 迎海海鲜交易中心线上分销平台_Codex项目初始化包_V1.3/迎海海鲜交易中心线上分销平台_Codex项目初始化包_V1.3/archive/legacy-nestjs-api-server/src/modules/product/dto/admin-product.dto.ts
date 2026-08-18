import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min
} from "class-validator";
import { Type } from "class-transformer";

export class AdminCategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @MaxLength(64)
  name!: string;

  @IsString()
  @MaxLength(64)
  code!: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsIn(["enabled", "disabled"])
  status?: "enabled" | "disabled";
}

export class AdminProductDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @IsString()
  @MaxLength(64)
  productCode!: string;

  @IsOptional()
  @IsString()
  mainImageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(32)
  unit!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  storageMethod?: string;

  @IsOptional()
  @IsIn(["draft", "on_sale", "off_sale"])
  shelfStatus?: "draft" | "on_sale" | "off_sale";

  @IsOptional()
  @IsBoolean()
  recommendStatus?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class ShelfStatusDto {
  @IsIn(["draft", "on_sale", "off_sale"])
  shelfStatus!: "draft" | "on_sale" | "off_sale";
}

export class AdminSkuDto {
  @IsString()
  @MaxLength(64)
  skuCode!: string;

  @IsString()
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsObject()
  spec?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marketPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  memberPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  weightUnit?: string;

  @IsOptional()
  @IsIn(["enabled", "disabled"])
  status?: "enabled" | "disabled";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class InventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableStock!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lockedStock?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  warningStock!: number;
}

export class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @IsIn(["main", "detail"])
  imageType!: "main" | "detail";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
