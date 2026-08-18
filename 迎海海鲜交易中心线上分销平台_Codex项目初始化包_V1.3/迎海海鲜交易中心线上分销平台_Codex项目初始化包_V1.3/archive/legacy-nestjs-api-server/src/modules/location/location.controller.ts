import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { RequestWithUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LocationDto } from "./dto/location.dto";
import { LocationService } from "./location.service";

@ApiTags("app-location")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("app/user/location")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @ApiOperation({ summary: "保存用户最近定位" })
  async save(@Req() request: RequestWithUser, @Body() dto: LocationDto) {
    return ok(await this.locationService.save(request.user.id, dto));
  }

  @Get()
  @ApiOperation({ summary: "获取用户最近定位" })
  async get(@Req() request: RequestWithUser) {
    return ok(await this.locationService.get(request.user.id));
  }
}
