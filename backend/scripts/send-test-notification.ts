import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';

// Lightweight CLI arg parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = { cleanup: false, noRegister: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--token' && args[i + 1]) {
      out.token = args[i + 1];
      i++;
    } else if (a === '--cleanup') {
      out.cleanup = true;
    } else if (a === '--no-register') {
      out.noRegister = true;
    } else if (a === '--summary' && args[i + 1]) {
      out.summary = args[i + 1];
      i++;
    } else if (a === '--match-id' && args[i + 1]) {
      out.matchId = args[i + 1];
      i++;
    }
  }
  return out;
}

async function removeTokenFromDb(token: string) {
  // Use AppDataSource similarly to other scripts
  let dataSourceModule: any;
  try {
    dataSourceModule = require('../dist/src/data-source');
  } catch (_) {
    dataSourceModule = require('../src/data-source');
  }
  const { AppDataSource } = dataSourceModule;
  await AppDataSource.initialize();
  try {
    const res = await AppDataSource.query('DELETE FROM notification_tokens WHERE token = $1 RETURNING id', [token]);
    return res;
  } finally {
    await AppDataSource.destroy();
  }
}

async function main() {
  const argv = parseArgs();
  const envToken = argv.token || process.env.SMOKE_TEST_TOKEN;
  const summary = argv.summary || process.env.SUMMARY || 'Test notification from send-test-notification script';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const notifications = app.get(NotificationsService);

  // Minimal fake match object matching shape used by notifications.sendMatchNotice
  const fakeMatch: any = {
    id: argv.matchId || process.env.MATCH_ID || 9999,
    homeTeam: { name: process.env.HOME_TEAM || 'Home' },
    awayTeam: { name: process.env.AWAY_TEAM || 'Away' },
  };

  try {
    if (envToken && !argv.noRegister) {
      console.log('Registering temporary token for test');
      await notifications.registerToken({ token: envToken, platform: 'web' } as any);
    }

    await notifications.sendMatchNotice(fakeMatch, 'match-start', summary);
    console.log('sendMatchNotice invoked. Check logs for FCM output.');

    if (envToken && argv.cleanup) {
      // Prompt for confirmation before destructive cleanup
      const readline = await import('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const question = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));
      try {
        const answer = (await question(`Are you sure you want to DELETE token "${envToken}" from the local DB? Type 'yes' to confirm: `)).trim().toLowerCase();
        rl.close();
        if (answer === 'yes') {
          console.log('Cleaning up test token from DB');
          const res = await removeTokenFromDb(envToken);
          console.log('Cleanup result:', res);
        } else {
          console.log('Cleanup aborted by user — token remains in DB');
        }
      } catch (promptErr) {
        console.error('Prompt failed, skipping cleanup:', promptErr);
        try { rl.close(); } catch (_) {}
      }
    }
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
