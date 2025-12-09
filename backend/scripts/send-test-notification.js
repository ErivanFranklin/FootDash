#!/usr/bin/env node
/*
 * Minimal Node.js script to send a test FCM notification without ts-node.
 * Usage:
 *   node backend/scripts/send-test-notification.js --token "<DEVICE_TOKEN>" [--service-account "/path/to/serviceAccount.json"]
 */

const fs = require('fs');
const path = require('path');

let logStream = null;

function log(...args) {
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  console.log(...args);
  if (logStream) {
    logStream.write(`[${new Date().toISOString()}] ${message}\n`);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const res = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--token' || a === '-t') res.token = args[++i];
    else if (a === '--service-account' || a === '-s') res.serviceAccount = args[++i];
    else if (a === '--help' || a === '-h') res.help = true;
    else if (a === '--no-register') res.noRegister = true;
    else if (a === '--register') res.register = true;
    else if (a === '--cleanup') res.cleanup = true;
    else if (a === '--dry-run') res.dryRun = true;
    else if (a === '--debug') res.debug = true;
    else if (a === '--log-file') res.logFile = args[++i];
  }
  return res;
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log('Usage: node backend/scripts/send-test-notification.js --token "<DEVICE_TOKEN>" [--service-account "/path/to/serviceAccount.json"]');
    process.exit(0);
  }

  // Setup log file if requested
  if (args.logFile) {
    const logDir = path.dirname(args.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    logStream = fs.createWriteStream(args.logFile, { flags: 'a' });
    log(`Log file opened: ${args.logFile}`);
  }

  const token = args.token;
  if (!token) {
    console.error('Error: --token is required');
    process.exit(1);
  }

  // Resolve service account path: prefer explicit arg, then GOOGLE_APPLICATION_CREDENTIALS, then a sensible default
  let saPath = args.serviceAccount || process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '.', 'Downloads', 'foot-dash-firebase-adminsdk-fbsvc-263d4a60a4.json');
  saPath = path.resolve(saPath);
  if (!fs.existsSync(saPath)) {
    console.error(`Service account JSON not found at ${saPath}`);
    console.error('Set --service-account or set GOOGLE_APPLICATION_CREDENTIALS env var to point to the JSON file.');
    process.exit(1);
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (err) {
    console.error('Missing dependency: firebase-admin. Please run `cd backend && npm install firebase-admin`');
    console.error(err && err.message);
    process.exit(1);
  }

  try {
    const serviceAccount = require(saPath);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      log('Firebase Admin initialized');
    }
  } catch (err) {
    console.error('Failed to initialize Firebase Admin with service account:', err && err.message);
    process.exit(1);
  }

  // Setup database connection if --register is used
  let dataSource = null;
  if (args.register) {
    try {
      const { AppDataSource } = require('../data-source');
      dataSource = AppDataSource;
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
        log('Database connection initialized');
      }
    } catch (err) {
      console.error('Failed to initialize database connection:', err && err.message);
      console.error('Ensure DB environment variables are set (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME or DATABASE_URL)');
      process.exit(1);
    }
  }

  const payload = {
    notification: {
      title: 'FootDash staging smoke',
      body: 'This is a test notification from the FootDash smoke script.',
    },
    data: {
      source: 'smoke-script',
      ts: String(Date.now()),
    },
  };
  try {
    // Support either a single token or a comma-separated list of tokens
    let tokens = [];
    if (Array.isArray(token)) tokens = token;
    else if (typeof token === 'string') tokens = token.split(',').map(t => t.trim()).filter(Boolean);

    if (args.debug) {
      log('DEBUG: serviceAccountPath=', saPath);
      log('DEBUG: serviceAccountExists=', fs.existsSync(saPath));
      log('DEBUG: parsed tokens count=', tokens.length);
      const sample = tokens.slice(0, 3).map(t => (t.length > 24 ? t.slice(0, 24) + '...' : t));
      log('DEBUG: token samples (truncated)=', sample);
      log('DEBUG: admin.apps.length=', admin && admin.apps ? admin.apps.length : 0);
    }

    // Register tokens in database if requested
    if (args.register && dataSource) {
      try {
        const { NotificationToken } = require('../src/notifications/notification-token.entity');
        const tokenRepo = dataSource.getRepository(NotificationToken);
        
        for (const tkn of tokens) {
          const existing = await tokenRepo.findOne({ where: { token: tkn } });
          if (!existing) {
            const newToken = tokenRepo.create({
              token: tkn,
              platform: 'web', // Default to web for smoke tests
            });
            await tokenRepo.save(newToken);
            log(`Registered new token: ${tkn.slice(0, 24)}...`);
          } else {
            log(`Token already registered: ${tkn.slice(0, 24)}...`);
          }
        }
      } catch (err) {
        console.error('Failed to register tokens in database:', err && err.message);
        if (err && err.stack) console.error(err.stack);
      }
    }

    if (args.dryRun) {
      if (tokens.length > 1) {
        const message = { tokens, notification: payload.notification, data: payload.data };
        log('DRY-RUN: multicast message object:\n', JSON.stringify(message, null, 2));
      } else {
        const message = { token: tokens[0] || token, notification: payload.notification, data: payload.data };
        log('DRY-RUN: single message object:\n', JSON.stringify(message, null, 2));
      }
      if (logStream) logStream.end();
      if (dataSource && dataSource.isInitialized) await dataSource.destroy();
      process.exit(0);
    }

    if (tokens.length > 1) {
      // sendMulticast for multiple tokens
      const message = {
        tokens,
        notification: payload.notification,
        data: payload.data,
      };
      const resp = await admin.messaging().sendMulticast(message);
      log('FCM multicast result:');
      log(`  success: ${resp.successCount}, failure: ${resp.failureCount}`);
      if (resp.failureCount > 0) {
        const failures = resp.responses
          .map((r, i) => ({ index: i, error: r.error }))
          .filter(x => x.error)
          .map(x => ({ index: x.index, message: x.error && x.error.message ? x.error.message : String(x.error) }));
        log('  failures:', JSON.stringify(failures, null, 2));
      }
    } else {
      // single token send
      const message = {
        token: tokens[0] || token,
        notification: payload.notification,
        data: payload.data,
      };
      const messageId = await admin.messaging().send(message);
      log('FCM send result: messageId=', messageId);
    }

    if (logStream) logStream.end();
    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Error sending FCM notification:');
    if (err && err.code) console.error('  code:', err.code);
    if (err && err.message) console.error('  message:', err.message);
    if (err && err.details) console.error('  details:', err.details);
    if (err && err.stack) console.error(err.stack);
    if (logStream) logStream.end();
    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    process.exit(1);
  }

}

main().catch(err => {
  console.error('Unhandled error in send-test-notification:', err && err.stack ? err.stack : err);
  process.exit(1);
});
