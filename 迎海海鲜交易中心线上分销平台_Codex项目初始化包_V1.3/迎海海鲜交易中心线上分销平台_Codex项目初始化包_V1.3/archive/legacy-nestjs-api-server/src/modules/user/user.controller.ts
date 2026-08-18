import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RequestWithUser } from "../auth/auth.types";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserService } from "./user.service";

@ApiTags("app-user")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("app/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("profile")
  @ApiOperation({ summary: "获取用户资料" })
  async getProfile(@Req() request: RequestWithUser) {
    return ok(await this.userService.getProfile(request.user.id));
  }

  @Put("profile")
  @ApiOperation({ summary: "更新用户资料" })
  async updateProfile(@Req() request: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return ok(await this.userService.updateProfile(request.user.id, dto));
  }
}
