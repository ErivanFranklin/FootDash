import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './websockets/redis-io.adapter';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  console.log('[STARTUP] Creating Nest application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log('[STARTUP] Nest application created successfully');

  // Configure static file serving for avatars
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api'); // Standardize all endpoints under /api/*

  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true, // Allow cookies to be sent cross-origin
  });
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
  // Never block API startup on Redis socket adapter availability.
  try {
    await Promise.race([
      redisAdapter.connectToRedis(),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Redis websocket adapter init timeout')),
          3000,
        );
      }),
    ]);
  } catch (error) {
    console.warn(
      '[STARTUP] Redis websocket adapter unavailable, continuing without clustering:',
      error instanceof Error ? error.message : String(error),
    );
  }
  app.useWebSocketAdapter(redisAdapter);

  // Register global error handlers
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

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
      // Only handle navigation requests (GET) for SPA fallback. Ignore API and non-GET requests.
      if (req.method !== 'GET') return next();
      if (
        url.startsWith('/api') ||
        url.startsWith('/uploads') ||
        url.startsWith('/swagger') ||
        url.startsWith('/api-docs')
      ) {
        return next();
      }
      // If the request looks like a static file (has an extension), skip fallback.
      if (url.includes('.') && !url.endsWith('/')) return next();
      res.sendFile(join(frontendDist, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  console.log(`[STARTUP] Starting server on port ${port}...`);
  await app.listen(port);
  console.log(
    `[STARTUP] ✅ Application is running on: http://localhost:${port}`,
  );
  console.log(
    `[STARTUP] ✅ Swagger documentation available at: http://localhost:${port}/api`,
  );
}

bootstrap().catch((error) => {
  console.error('[STARTUP] ❌ FATAL ERROR during bootstrap:');
  console.error(error);
  process.exit(1);
});
