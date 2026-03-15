import { MatchGateway } from './match.gateway';
import { SocialGateway } from './social.gateway';
import { WebsocketsModule } from './websockets.module';

describe('WebsocketsModule', () => {
  it('registers and exports both gateways', () => {
    const providers = Reflect.getMetadata('providers', WebsocketsModule) ?? [];
    const exportsMeta = Reflect.getMetadata('exports', WebsocketsModule) ?? [];

    expect(providers).toContain(MatchGateway);
    expect(providers).toContain(SocialGateway);
    expect(exportsMeta).toContain(MatchGateway);
    expect(exportsMeta).toContain(SocialGateway);
  });
});