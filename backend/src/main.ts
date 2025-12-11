import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './websockets/redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure static file serving for avatars
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Serve frontend production build (www) and provide SPA fallback for client-side routing.
  // Exclude API and uploads routes from the fallback so API routes continue to work.
  // Try two candidate paths for the built frontend (dist vs source run modes)
  const candidateA = join(__dirname, '..', '..', 'frontend', 'www');
  const candidateB = join(__dirname, '..', '..', '..', 'frontend', 'www');
  const frontendDist = existsSync(candidateA) ? candidateA : candidateB;
  if (existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist);
    app.use((req: any, res: any, next: any) => {
      const url = req.url || '';
      if (
        url.startsWith('/api') ||
        url.startsWith('/uploads') ||
        url.startsWith('/swagger') ||
        url.startsWith('/api-docs')
      ) {
        return next();
      }
      res.sendFile(join(frontendDist, 'index.html'));
    });
  }

  app.enableCors();
  // Relax Helmet CSP in development to allow Swagger UI assets and inline scripts
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet(
      isProd
        ? undefined
        : {
            contentSecurityPolicy: false,
          },
    ),
  );

  // Set up Redis adapter for Socket.IO clustering
  const configService = app.get(ConfigService);
  const redisAdapter = new RedisIoAdapter(app, configService);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('FootDash API')
    .setDescription(
      'Football/soccer dashboard API for teams, matches, and statistics',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Teams', 'Team management endpoints')
    .addTag('Matches', 'Match data endpoints')
    .addTag('Statistics', 'Team and player statistics')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}
bootstrap();
