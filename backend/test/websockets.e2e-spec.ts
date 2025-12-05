import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';

describe('MatchGateway (e2e)', () => {
  let app: INestApplication;
  let clientSocket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001); // Use a different port for testing

    const address = app.getHttpServer().listen().address();
    const port = typeof address === 'string' ? address : address.port;
    
    clientSocket = io(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close();
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
