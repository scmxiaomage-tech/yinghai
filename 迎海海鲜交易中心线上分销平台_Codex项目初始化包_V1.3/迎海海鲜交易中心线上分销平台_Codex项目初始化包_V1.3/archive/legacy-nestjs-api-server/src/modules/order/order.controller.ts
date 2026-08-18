import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { RequestWithUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CancelOrderDto, CreateOrderDto, OrderPreviewDto } from "./dto/order.dto";
import { OrderService } from "./order.service";

@ApiTags("app-order")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("app/orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("preview")
  @ApiOperation({ summary: "订单预览，不创建订单" })
  async preview(@Req() request: RequestWithUser, @Body() dto: OrderPreviewDto) {
    return ok(await this.orderService.preview(request.user.id, dto));
  }

  @Post()
  @ApiOperation({ summary: "创建待付款订单" })
  async create(
    @Req() request: RequestWithUser,
    @Body() dto: CreateOrderDto,
    @Headers("idempotency-key") idempotencyKey?: string
  ) {
    return ok(await this.orderService.create(request.user.id, dto, idempotencyKey));
  }

  @Get()
  @ApiOperation({ summary: "当前用户订单列表" })
  async list(
    @Req() request: RequestWithUser,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return ok(await this.orderService.list(request.user.id, { status, page, pageSize }));
  }

  @Get(":id")
  @ApiOperation({ summary: "当前用户订单详情" })
  async detail(@Req() request: RequestWithUser, @Param("id") id: string) {
    return ok(await this.orderService.detail(request.user.id, id));
  }

  @Put(":id/cancel")
  @ApiOperation({ summary: "取消未支付订单" })
  async cancel(@Req() request: RequestWithUser, @Param("id") id: string, @Body() dto: CancelOrderDto) {
    return ok(await this.orderService.cancel(request.user.id, id, dto));
  }
}
