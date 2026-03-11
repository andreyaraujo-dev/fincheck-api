import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { LoggerService } from './shared/services/logger/logger.service';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { version } from '../package.json';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const PUBLIC_URL = process.env.PUBLIC_URL || '';

  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  const loggerService = new LoggerService();
  loggerService.setContext('Server');
  app.useLogger(loggerService);
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MyCash API')
      .setDescription('API de gerenciamento financeiro pessoal')
      .setVersion(version)
      .addBearerAuth()
      .setContact(
        'Andrey Araújo',
        'https://andreyaraujo.dev',
        'andreyaraujo.dev@gmail.com',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const theme = new SwaggerTheme();
    SwaggerModule.setup('api/docs', app, document, {
      explorer: true,
      customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
    });
    loggerService.log(
      `📄 Swagger disponível em ${PUBLIC_URL}:${PORT}/api/docs`,
    );
  }

  await app.listen(PORT, () => {
    loggerService.log(`🚀 Listen on ${PUBLIC_URL}:${PORT}`);
  });
}
bootstrap();
