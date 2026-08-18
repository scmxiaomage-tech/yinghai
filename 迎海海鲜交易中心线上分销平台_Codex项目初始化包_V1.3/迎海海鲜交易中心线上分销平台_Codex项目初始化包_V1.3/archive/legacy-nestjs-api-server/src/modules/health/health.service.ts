import { Injectable } from "@nestjs/common";
import { RESERVED_API_PREFIXES } from "../../shared/api-prefix.constants";

@Injectable()
export class HealthService {
  check() {
    return {
      code: 0,
      message: "ok",
      data: {
        status: "ok",
        service: "api-server",
        reservedApiPrefixes: RESERVED_API_PREFIXES
      }
    };
  }
}
