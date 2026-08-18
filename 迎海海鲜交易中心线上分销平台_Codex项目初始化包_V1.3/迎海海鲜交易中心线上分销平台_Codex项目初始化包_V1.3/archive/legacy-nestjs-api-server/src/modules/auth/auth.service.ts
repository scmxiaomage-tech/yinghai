import { HttpException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { DATABASE_POOL } from "../../infrastructure/database/database.provider";
import { AppJwtService } from "./jwt.service";

interface WechatSession {
  openid: string;
  unionid?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
    private readonly jwtService: AppJwtService
  ) {}

  async wechatLogin(params: {
    code: string;
    device?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const session = await this.resolveWechatSession(params.code);
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `
          INSERT INTO users (openid, unionid, last_login_at)
          VALUES ($1, $2, now())
          ON CONFLICT (openid)
          DO UPDATE SET unionid = COALESCE(EXCLUDED.unionid, users.unionid),
                        last_login_at = now(),
                        updated_at = now()
          RETURNING id, openid, unionid, phone, status, last_login_at, created_at, updated_at
        `,
        [session.openid, session.unionid ?? null]
      );
      const user = userResult.rows[0];

      await client.query(
        `
          INSERT INTO user_profile (user_id)
          VALUES ($1)
          ON CONFLICT (user_id) DO NOTHING
        `,
        [user.id]
      );

      await client.query(
        `
          INSERT INTO user_login_record
            (user_id, login_type, openid, ip, user_agent, device, login_result)
          VALUES ($1, 'wechat', $2, $3, $4, $5, 'success')
        `,
        [user.id, user.openid, params.ip ?? null, params.userAgent ?? null, params.device ?? null]
      );

      await client.query("COMMIT");

      return {
        accessToken: this.jwtService.signAccessToken({ userId: user.id, openid: user.openid }),
        refreshToken: this.jwtService.signRefreshToken({ userId: user.id, openid: user.openid }),
        user
      };
    } catch (error) {
      await client.query("ROLLBACK");
      await this.recordFailedLogin(params, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async refreshToken(refreshToken: string) {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);
    const result = await this.pool.query(
      "SELECT id, openid, status FROM users WHERE id = $1 AND deleted_at IS NULL",
      [payload.userId]
    );
    const user = result.rows[0];

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("User unavailable");
    }

    return {
      accessToken: this.jwtService.signAccessToken({ userId: user.id, openid: user.openid }),
      refreshToken: this.jwtService.signRefreshToken({ userId: user.id, openid: user.openid })
    };
  }

  async getMe(userId: string) {
    const result = await this.pool.query(
      `
        SELECT u.id, u.openid, u.unionid, u.phone, u.status, u.last_login_at,
               p.nickname, p.avatar_url, p.gender, p.birthday, p.bio
        FROM users u
        LEFT JOIN user_profile p ON p.user_id = u.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `,
      [userId]
    );
    return result.rows[0];
  }

  logout() {
    return { success: true };
  }

  private async resolveWechatSession(code: string): Promise<WechatSession> {
    if (code.startsWith("mock_")) {
      return {
        openid: `mock_openid_${code.replace(/^mock_/, "")}`,
        unionid: "mock_unionid"
      };
    }

    const appId = this.configService.get<string>("WECHAT_MINIAPP_APP_ID");
    const secret = this.configService.get<string>("WECHAT_MINIAPP_SECRET");
    if (!appId || !secret) {
      throw new UnauthorizedException("Wechat app config missing");
    }

    const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
    url.searchParams.set("appid", appId);
    url.searchParams.set("secret", secret);
    url.searchParams.set("js_code", code);
    url.searchParams.set("grant_type", "authorization_code");

    const response = await fetch(url);
    const data = (await response.json()) as {
      openid?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!data.openid) {
      throw new HttpException(data.errmsg ?? "Wechat login failed", 401);
    }

    return {
      openid: data.openid,
      unionid: data.unionid
    };
  }

  private async recordFailedLogin(
    params: { code: string; device?: string; ip?: string; userAgent?: string },
    error: unknown
  ) {
    const failReason = error instanceof Error ? error.message : "unknown";
    await this.pool.query(
      `
        INSERT INTO user_login_record
          (login_type, ip, user_agent, device, login_result, fail_reason)
        VALUES ('wechat', $1, $2, $3, 'failed', $4)
      `,
      [params.ip ?? null, params.userAgent ?? null, params.device ?? null, failReason.slice(0, 255)]
    );
  }
}
