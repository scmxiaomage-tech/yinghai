import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { API_NAMESPACE } from "./shared/api-prefix.constants";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const globalPrefix = configService.get<string>("API_GLOBAL_PREFIX", "api/v1");
  const swaggerPath = configService.get<string>("SWAGGER_PATH", "api-docs");
  const port = configService.get<number>("API_PORT", 3001);
  const host = configService.get<string>("API_HOST", "0.0.0.0");

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("迎海海鲜交易中心 API")
    .setDescription("Sprint 0 API Server 基础文档，仅包含工程骨架与健康检查")
    .setVersion("0.0.0")
    .addTag("health")
    .addTag(API_NAMESPACE.APP)
    .addTag(API_NAMESPACE.ADMIN)
    .addTag(API_NAMESPACE.MOBILE_ADMIN)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  await app.listen(port, host);
}

void bootstrap();
