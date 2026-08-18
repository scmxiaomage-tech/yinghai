import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { RequestWithUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AddressService } from "./address.service";
import { AddressDto, UpdateAddressDto } from "./dto/address.dto";

@ApiTags("app-address")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("app/user/addresses")
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: "获取地址列表" })
  async list(@Req() request: RequestWithUser) {
    return ok(await this.addressService.list(request.user.id));
  }

  @Post()
  @ApiOperation({ summary: "新增地址" })
  async create(@Req() request: RequestWithUser, @Body() dto: AddressDto) {
    return ok(await this.addressService.create(request.user.id, dto));
  }

  @Put(":id")
  @ApiOperation({ summary: "更新地址" })
  async update(@Req() request: RequestWithUser, @Param("id") id: string, @Body() dto: UpdateAddressDto) {
    return ok(await this.addressService.update(request.user.id, id, dto));
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除地址" })
  async remove(@Req() request: RequestWithUser, @Param("id") id: string) {
    return ok(await this.addressService.remove(request.user.id, id));
  }

  @Put(":id/default")
  @ApiOperation({ summary: "设置默认地址" })
  async setDefault(@Req() request: RequestWithUser, @Param("id") id: string) {
    return ok(await this.addressService.setDefault(request.user.id, id));
  }
}
