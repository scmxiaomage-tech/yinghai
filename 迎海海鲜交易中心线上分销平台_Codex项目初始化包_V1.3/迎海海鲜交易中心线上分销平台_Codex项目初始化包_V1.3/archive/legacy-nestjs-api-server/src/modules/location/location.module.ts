import { Module } from "@nestjs/common";
import { RedisModule } from "../../infrastructure/redis/redis.module";
import { AuthModule } from "../auth/auth.module";
import { LocationController } from "./location.controller";
import { LocationService } from "./location.service";

@Module({
  imports: [RedisModule, AuthModule],
  controllers: [LocationController],
  providers: [LocationService]
})
export class LocationModule {}
