import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  // Helpful runtime log for local testing to verify which port the app bound to
  // and to make it easier to debug port conflicts in developer environments.
  // This is intentionally small and safe to keep in place.
  // eslint-disable-next-line no-console
  console.log(`Nest listening on http://localhost:${port}`);
}
bootstrap();
