import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';

async function main() {
  // Allow overriding token via env var for one-off tests
  const envToken = process.env.SMOKE_TEST_TOKEN;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const notifications = app.get(NotificationsService);

  // Minimal fake match object matching shape used by notifications.sendMatchNotice
  const fakeMatch: any = {
    id: process.env.MATCH_ID || 9999,
    homeTeam: { name: process.env.HOME_TEAM || 'Home' },
    awayTeam: { name: process.env.AWAY_TEAM || 'Away' },
  };

  const summary = process.env.SUMMARY || 'Test notification from send-test-notification script';

  try {
    if (envToken) {
      // Register a token temporarily so sendMatchNotice will include it
      await notifications.registerToken({ token: envToken, platform: 'web' } as any);
    }

    await notifications.sendMatchNotice(fakeMatch, 'match-start', summary);
    console.log('sendMatchNotice invoked. Check logs for FCM output.');
  } catch (err) {
    console.error('Error invoking sendMatchNotice:', err);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
