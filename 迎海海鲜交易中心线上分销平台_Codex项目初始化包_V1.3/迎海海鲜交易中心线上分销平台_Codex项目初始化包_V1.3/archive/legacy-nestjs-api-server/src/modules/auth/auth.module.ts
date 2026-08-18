import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AppJwtService } from "./jwt.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AppJwtService, JwtAuthGuard],
  exports: [AppJwtService, JwtAuthGuard]
})
export class AuthModule {}
