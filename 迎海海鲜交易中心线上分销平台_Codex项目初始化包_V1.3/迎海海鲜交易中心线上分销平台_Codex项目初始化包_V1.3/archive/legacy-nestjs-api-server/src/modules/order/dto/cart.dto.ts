import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsUUID, Min } from "class-validator";

export class AddCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  skuId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class SelectCartItemDto {
  @IsBoolean()
  selected!: boolean;
}

export class SelectAllCartDto {
  @IsBoolean()
  selected!: boolean;
}
