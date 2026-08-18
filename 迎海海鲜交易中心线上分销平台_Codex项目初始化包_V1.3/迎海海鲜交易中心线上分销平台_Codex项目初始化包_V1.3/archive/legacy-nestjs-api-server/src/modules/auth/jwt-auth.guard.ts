import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";
import { AppJwtService } from "./jwt.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: AppJwtService,
    @Inject(DATABASE_POOL) private readonly pool: Pool
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization ?? "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const payload = this.jwtService.verifyAccessToken(token);
    const result = await this.pool.query(
      "SELECT id, openid, status FROM users WHERE id = $1 AND deleted_at IS NULL",
      [payload.userId]
    );
    const user = result.rows[0];

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("User unavailable");
    }

    request.user = {
      id: user.id,
      openid: user.openid,
      status: user.status
    };

    return true;
  }
}
