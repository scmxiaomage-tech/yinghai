import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { AuthModule } from "../auth/auth.module";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AddressController],
  providers: [AddressService]
})
export class AddressModule {}
