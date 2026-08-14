import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.getOrThrow<number>('PORT');

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(port);

  console.log(
    `Enterprise Data Reconciliation API running on http://localhost:${port}/api`,
  );
}

void bootstrap();