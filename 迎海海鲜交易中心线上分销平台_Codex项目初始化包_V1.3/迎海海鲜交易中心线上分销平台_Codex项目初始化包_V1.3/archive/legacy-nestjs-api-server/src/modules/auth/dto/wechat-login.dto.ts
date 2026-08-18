import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class WechatLoginDto {
  @ApiProperty({ description: "微信小程序 uni.login 返回的 code" })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ description: "设备标识/来源说明" })
  @IsOptional()
  @IsString()
  device?: string;
}
