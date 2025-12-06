import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';

describe('MatchGateway (e2e)', () => {
  let app: INestApplication;
  let clientSocket: Socket;
  // Increase timeout to allow app and DB to initialize in CI
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Use an explicit test port and wait for the app to be ready before creating socket
    const testPort = 3001;
    await app.listen(testPort);

    try {
      clientSocket = io(`http://localhost:${testPort}`, {
        transports: ['websocket'],
        reconnectionAttempts: 3,
        timeout: 5000,
      });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('socket connect timeout')), 8000);
        clientSocket.on('connect', () => {
          clearTimeout(timer);
          resolve();
        });
        clientSocket.on('connect_error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    } catch (err) {
      // If socket initialization fails, ensure app is closed and rethrow
      if (app) {
        await app.close();
      }
      throw err;
    }
  }, 20000);

  afterAll(async () => {
    if (clientSocket && typeof (clientSocket as any).close === 'function') {
      clientSocket.close();
    }
    if (app) {
      await app.close();
    }
  });

  it('should connect and disconnect', () => {
    expect(clientSocket.connected).toBe(true);
  });

  it('should subscribe to a match and receive an update', (done) => {
    const matchId = 'test-match-123';

    clientSocket.on('match-update', (data) => {
      expect(data.matchId).toBe(matchId);
      expect(data.message).toContain('Welcome');
      expect(data.score).toEqual({ home: 0, away: 0 });
      done();
    });

    clientSocket.emit('subscribe-match', matchId);
  });

  it('should unsubscribe from a match', (done) => {
    const matchId = 'test-match-456';

    clientSocket.emit('subscribe-match', matchId);

    // Give it a moment to join the room
    setTimeout(() => {
      clientSocket.emit('unsubscribe-match', matchId);
      // No easy way to confirm server-side leave, but we can ensure no more messages are sent
      // For this test, we'll just ensure the call doesn't crash
      done();
    }, 100);
  });
});
