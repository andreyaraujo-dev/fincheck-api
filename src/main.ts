import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './shared/services/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe());
  const loggerService = new LoggerService();
  loggerService.setContext('Server');
  app.useLogger(loggerService);

  await app.listen(process.env.PORT ?? 3000, () => {
    loggerService.log(`🚀 Listen on ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
