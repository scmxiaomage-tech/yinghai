import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min
} from "class-validator";

export class AddressDto {
  @ApiProperty({ description: "收货人姓名" })
  @IsString()
  @MaxLength(64)
  receiverName!: string;

  @ApiProperty({ description: "收货人电话" })
  @IsString()
  @MaxLength(32)
  receiverPhone!: string;

  @ApiProperty({ description: "省" })
  @IsString()
  @MaxLength(64)
  province!: string;

  @ApiProperty({ description: "市" })
  @IsString()
  @MaxLength(64)
  city!: string;

  @ApiProperty({ description: "区/县" })
  @IsString()
  @MaxLength(64)
  district!: string;

  @ApiProperty({ description: "详细地址" })
  @IsString()
  @MaxLength(255)
  detailAddress!: string;

  @ApiPropertyOptional({ description: "经度" })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: "纬度" })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: "是否默认地址" })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends AddressDto {}
