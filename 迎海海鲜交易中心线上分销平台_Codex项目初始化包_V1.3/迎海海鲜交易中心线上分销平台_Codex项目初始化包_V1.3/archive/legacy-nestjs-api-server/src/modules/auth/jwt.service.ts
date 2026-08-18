import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt, { SignOptions } from "jsonwebtoken";
import { JwtPayload } from "./auth.types";

@Injectable()
export class AppJwtService {
  constructor(private readonly configService: ConfigService) {}

  signAccessToken(payload: Omit<JwtPayload, "tokenType">): string {
    const options: SignOptions = {
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "2h") as SignOptions["expiresIn"]
    };
    return jwt.sign(
      { ...payload, tokenType: "access" },
      this.configService.get<string>("JWT_ACCESS_SECRET", "dev-access-secret"),
      options
    );
  }

  signRefreshToken(payload: Omit<JwtPayload, "tokenType">): string {
    const options: SignOptions = {
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "30d") as SignOptions["expiresIn"]
    };
    return jwt.sign(
      { ...payload, tokenType: "refresh" },
      this.configService.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret"),
      options
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.verify(token, "access");
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.verify(token, "refresh");
  }

  private verify(token: string, tokenType: JwtPayload["tokenType"]): JwtPayload {
    const secret =
      tokenType === "access"
        ? this.configService.get<string>("JWT_ACCESS_SECRET", "dev-access-secret")
        : this.configService.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret");

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      if (payload.tokenType !== tokenType) {
        throw new UnauthorizedException("Token type mismatch");
      }
      return payload;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
