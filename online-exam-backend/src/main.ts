import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  // 🧩 Nonaktifkan body parser agar Multer bisa membaca stream multipart
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ⛔️ Nonaktifkan parser JSON untuk route upload video
  app.use('/api/exam-sessions/:sessionId/upload-video', (req, res, next) => {
    req.headers['content-type']?.includes('multipart/form-data')
      ? next() // biarkan Multer handle multipart
      : bodyParser.json()(req, res, next);
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // ValidationPipe tetap aman digunakan
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Izinkan akses ke folder uploads
  // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads/',
  // });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
