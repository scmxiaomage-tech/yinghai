import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { RequestWithUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AddCartItemDto, SelectAllCartDto, SelectCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { OrderService } from "./order.service";

@ApiTags("app-cart")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("app/cart")
export class CartController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: "获取当前用户购物车" })
  async list(@Req() request: RequestWithUser) {
    return ok(await this.orderService.cart(request.user.id));
  }

  @Post("items")
  @ApiOperation({ summary: "加入购物车" })
  async add(@Req() request: RequestWithUser, @Body() dto: AddCartItemDto) {
    return ok(await this.orderService.addCart(request.user.id, dto));
  }

  @Put("items/:id")
  @ApiOperation({ summary: "修改购物车数量" })
  async update(@Req() request: RequestWithUser, @Param("id") id: string, @Body() dto: UpdateCartItemDto) {
    return ok(await this.orderService.updateCart(request.user.id, id, dto));
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "软删除购物车商品" })
  async remove(@Req() request: RequestWithUser, @Param("id") id: string) {
    return ok(await this.orderService.deleteCart(request.user.id, id));
  }

  @Put("items/:id/selected")
  @ApiOperation({ summary: "修改购物车商品选中状态" })
  async select(@Req() request: RequestWithUser, @Param("id") id: string, @Body() dto: SelectCartItemDto) {
    return ok(await this.orderService.selectCart(request.user.id, id, dto));
  }

  @Put("selected-all")
  @ApiOperation({ summary: "全选或取消全选购物车" })
  async selectAll(@Req() request: RequestWithUser, @Body() dto: SelectAllCartDto) {
    return ok(await this.orderService.selectAllCart(request.user.id, dto));
  }

  @Delete("invalid-items")
  @ApiOperation({ summary: "清理失效购物车商品" })
  async clearInvalid(@Req() request: RequestWithUser) {
    return ok(await this.orderService.clearInvalidCart(request.user.id));
  }
}
