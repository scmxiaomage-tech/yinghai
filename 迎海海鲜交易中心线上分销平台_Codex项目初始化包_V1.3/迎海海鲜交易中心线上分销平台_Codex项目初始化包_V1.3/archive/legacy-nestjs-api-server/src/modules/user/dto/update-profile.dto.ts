import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: "昵称" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @ApiPropertyOptional({ description: "头像 URL" })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: "性别", enum: ["unknown", "male", "female"] })
  @IsOptional()
  @IsIn(["unknown", "male", "female"])
  gender?: string;

  @ApiPropertyOptional({ description: "生日，格式 YYYY-MM-DD" })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ description: "个人简介" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;
}
