import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for Flutter web and app
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static files (uploaded images - from fedibenman)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('MEDAIChain API')
    .setDescription('API pour la gestion de cliniques médicales et application patient')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 MEDAIChain API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
  console.log(`📁 Uploads folder: ${join(__dirname, '..', 'uploads')}`);
}
bootstrap();
