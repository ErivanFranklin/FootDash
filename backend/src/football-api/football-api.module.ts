import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FootballApiService } from './football-api.service';
import { FootballApiCacheService } from './football-api-cache.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL:
          config.get<string>('FOOTBALL_API_URL') ||
          'https://api-football-v1.p.rapidapi.com/v3',
        timeout: config.get<number>('FOOTBALL_API_TIMEOUT_MS', 5000),
        headers: {
          'x-apisports-key': config.get<string>('FOOTBALL_API_KEY') || '',
        },
      }),
    }),
  ],
  providers: [FootballApiCacheService, FootballApiService],
  exports: [FootballApiService, FootballApiCacheService],
})
export class FootballApiModule {}
