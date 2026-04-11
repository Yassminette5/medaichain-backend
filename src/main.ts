import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

/** Base64 image dans le JSON dépasse vite la limite Express par défaut (100kb) */
const BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '25mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: BODY_LIMIT, extended: true });

  // Enable CORS for Flutter web and app
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static files (uploaded images - from fedibenman)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Serve static files from public directory (CSS, JS, etc.)
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
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
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 MEDAIChain API running on http://localhost:${port} (émulateur: http://10.0.2.2:${port})`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
  console.log(`📁 Uploads folder: ${join(process.cwd(), 'uploads')}`);
}
bootstrap();
