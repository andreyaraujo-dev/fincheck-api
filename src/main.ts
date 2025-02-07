import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './shared/services/logger/logger.service';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const PUBLIC_URL = process.env.PUBLIC_URL || '';

  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe());
  const loggerService = new LoggerService();
  loggerService.setContext('Server');
  app.useLogger(loggerService);

  await app.listen(PORT, () => {
    loggerService.log(`🚀 Listen on ${PUBLIC_URL}:${PORT}`);
  });
}
bootstrap();
