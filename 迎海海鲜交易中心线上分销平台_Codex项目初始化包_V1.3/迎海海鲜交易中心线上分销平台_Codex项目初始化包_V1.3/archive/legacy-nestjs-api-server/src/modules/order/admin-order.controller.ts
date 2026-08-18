import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { OrderService } from "./order.service";

@ApiTags("admin-order")
@Controller("admin/orders")
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: "后台订单只读列表" })
  async list(
    @Query("order_no") orderNo?: string,
    @Query("user") user?: string,
    @Query("order_status") orderStatus?: string,
    @Query("payment_status") paymentStatus?: string,
    @Query("created_at") createdAt?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return ok(await this.orderService.adminList({ orderNo, user, orderStatus, paymentStatus, createdAt, page, pageSize }));
  }

  @Get(":id")
  @ApiOperation({ summary: "后台订单只读详情" })
  async detail(@Param("id") id: string) {
    return ok(await this.orderService.adminDetail(id));
  }
}
