import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf
} from "class-validator";

export class OrderPreviewDto {
  @IsIn(["cart", "buy_now"])
  source!: "cart" | "buy_now";

  @ValidateIf((dto: OrderPreviewDto) => dto.source === "cart")
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  cartItemIds?: string[];

  @ValidateIf((dto: OrderPreviewDto) => dto.source === "buy_now")
  @IsUUID()
  skuId?: string;

  @ValidateIf((dto: OrderPreviewDto) => dto.source === "buy_now")
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsUUID()
  addressId!: string;

  @IsOptional()
  @IsBoolean()
  deliveryRiskConfirmed?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deliveryRemark?: string;
}

export class CreateOrderDto extends OrderPreviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cancelReason?: string;
}
