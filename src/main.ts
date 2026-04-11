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

  const port = Number(process.env.PORT) || 3000;
  try {
    await app.listen(port, '0.0.0.0');
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === 'EADDRINUSE') {
      console.error(
        `\n❌ Port ${port} déjà utilisé (autre instance Nest ou autre appli).\n` +
          `   → Ferme l’autre terminal / processus, ou lance : npm run free:3000\n` +
          `   → Ou change PORT dans le fichier .env (ex. PORT=3001) et adapte l’URL côté Flutter.\n`,
      );
    }
    throw err;
  }
  console.log(`🚀 MEDAIChain API running on http://localhost:${port} (émulateur: http://10.0.2.2:${port})`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
  console.log(`📁 Uploads folder: ${join(process.cwd(), 'uploads')}`);
}
bootstrap();
