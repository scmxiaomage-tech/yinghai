import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

export const DATABASE_POOL = Symbol("DATABASE_POOL");

export const databaseProvider: Provider = {
  provide: DATABASE_POOL,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Pool({
      connectionString: configService.get<string>("DATABASE_URL")
    });
  }
};
