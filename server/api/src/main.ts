import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const uploadDir = configService.get<string>('UPLOAD_DIR') || 'uploads';
  const staticPath = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.join(process.cwd(), uploadDir);

  app.use('/uploads', express.static(staticPath));

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API 服务已启动，端口 ${port}`);
}

bootstrap();
