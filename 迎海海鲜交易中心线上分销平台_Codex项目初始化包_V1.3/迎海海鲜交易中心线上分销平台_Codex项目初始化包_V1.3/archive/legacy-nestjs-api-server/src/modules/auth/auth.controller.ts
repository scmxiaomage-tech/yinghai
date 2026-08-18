import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ok } from "../../shared/api-response";
import { RequestWithUser } from "./auth.types";
import { AuthService } from "./auth.service";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { WechatLoginDto } from "./dto/wechat-login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("app-auth")
@Controller("app/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("wechat-login")
  @ApiOperation({ summary: "微信小程序登录" })
  async wechatLogin(@Body() dto: WechatLoginDto, @Req() request: Request) {
    const result = await this.authService.wechatLogin({
      code: dto.code,
      device: dto.device,
      ip: request.headers["x-forwarded-for"]?.toString() ?? request.socket.remoteAddress,
      userAgent: request.headers["user-agent"]
    });
    return ok(result);
  }

  @Post("refresh-token")
  @ApiOperation({ summary: "刷新 JWT Token" })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return ok(await this.authService.refreshToken(dto.refreshToken));
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前登录用户" })
  async me(@Req() request: RequestWithUser) {
    return ok(await this.authService.getMe(request.user.id));
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "退出登录占位" })
  logout() {
    return ok(this.authService.logout());
  }
}
