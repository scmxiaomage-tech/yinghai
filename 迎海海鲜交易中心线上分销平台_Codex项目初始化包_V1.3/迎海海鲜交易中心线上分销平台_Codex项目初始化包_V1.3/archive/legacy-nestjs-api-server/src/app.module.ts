import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { AddressModule } from "./modules/address/address.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { LocationModule } from "./modules/location/location.module";
import { MessageModule } from "./modules/message/message.module";
import { ProductModule } from "./modules/product/product.module";
import { OrderModule } from "./modules/order/order.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { SupplyChainModule } from "./modules/supply-chain/supply-chain.module";
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UserModule,
    AddressModule,
    LocationModule,
    MessageModule,
    ProductModule,
    OrderModule,
    PaymentModule
    ,SupplyChainModule
  ]
})
export class AppModule {}
