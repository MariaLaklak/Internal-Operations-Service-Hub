import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { positiveInteger } from './config/positive-integer';

async function bootstrap() {
  const port = positiveInteger(process.env.PORT, 3000, 'PORT');
  positiveInteger(process.env.AI_PROVIDER_TIMEOUT_MS, 5000, 'AI_PROVIDER_TIMEOUT_MS');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
