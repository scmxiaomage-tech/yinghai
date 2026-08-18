import { Controller, Get, Param, Post } from "@nestjs/common";
import { PaymentService } from "./payment.service";
@Controller("admin")
export class AdminPaymentController {
  constructor(private readonly service:PaymentService){}
  @Post("orders/:orderId/refund") refund(@Param("orderId")id:string){return this.service.refund(id);}
  @Get("payments") payments(){return this.service.listPayments();}
  @Get("refunds") refunds(){return this.service.listRefunds();}
}
