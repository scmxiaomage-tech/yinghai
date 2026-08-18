import { Module } from "@nestjs/common";
import { CartController } from "./cart.controller";
import { OrderController } from "./order.controller";
import { AdminOrderController } from "./admin-order.controller";
import { OrderRepository } from "./order.repository";
import { OrderService } from "./order.service";

@Module({ controllers: [CartController, OrderController, AdminOrderController], providers: [OrderRepository, OrderService] })
export class OrderModule {}
