import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { AuthModule } from "../auth/auth.module";
import { MessageController } from "./message.controller";
import { MessageService } from "./message.service";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [MessageController],
  providers: [MessageService]
})
export class MessageModule {}
