import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private readonly connectTimeoutMs = 3000;

  constructor(
    app: any,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      // If no Redis URL, use default adapter (no clustering)
      return;
    }

    const pubClient = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    const subClient = pubClient.duplicate();

    const withTimeout = async <T>(operation: Promise<T>): Promise<T> =>
      Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Redis connect timeout after ${this.connectTimeoutMs}ms`,
                ),
              ),
            this.connectTimeoutMs,
          );
        }),
      ]);

    try {
      await withTimeout(pubClient.connect());
      await withTimeout(subClient.connect());
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch {
      // Use immediate disconnect to avoid hanging bootstrap on quit/close.
      pubClient.disconnect();
      subClient.disconnect();
      this.adapterConstructor = undefined;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
