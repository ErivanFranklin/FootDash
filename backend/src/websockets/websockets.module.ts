import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { SocialGateway } from './social.gateway';

@Module({
  providers: [MatchGateway, SocialGateway],
  exports: [MatchGateway, SocialGateway],
})
export class WebsocketsModule {}
