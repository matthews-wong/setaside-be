import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // -------------------------
  // 🔥 FIX SWAGGER FOR VERCEL
  // -------------------------

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Set Aside API')
    .setDescription('API documentation for the Set Aside order pickup application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve the swagger JSON manually (Vercel needs this)
  app.use('/swagger-json', (req: Request, res: Response) => {
    res.json(document);
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      url: '/swagger-json', // where UI loads JSON
    },
    customCssUrl:
      'https://unpkg.com/swagger-ui-dist/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js',
    ],
  });

  // -------------------------
  // END SWAGGER FIX
  // -------------------------

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();