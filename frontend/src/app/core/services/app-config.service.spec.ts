import { TestBed } from '@angular/core/testing';

import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppConfigService);
  });

  it('keeps defaults when config fetch fails', async () => {
    spyOn(window as any, 'fetch').and.returnValue(
      Promise.reject(new Error('missing')),
    );

    const apiBefore = service.apiBaseUrl;
    const wsBefore = service.wsUrl;

    await service.load();

    expect(service.apiBaseUrl).toBe(apiBefore);
    expect(service.wsUrl).toBe(wsBefore);
  });

  it('overrides config values when fetch returns valid json', async () => {
    spyOn(window as any, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: async () => ({
          apiBaseUrl: '/runtime-api',
          wsUrl: '/runtime-ws',
          authPath: '/runtime-auth',
          pushPublicKey: 'pk-runtime',
        }),
      } as Response),
    );
    spyOn<any>(service, 'isLocalhostRuntime').and.returnValue(false);

    await service.load();

    expect(service.apiBaseUrl).toBe('/runtime-api');
    expect(service.wsUrl).toBe('/runtime-ws');
    expect(service.authPath).toBe('/runtime-auth');
    expect(service.pushPublicKey).toBe('pk-runtime');
  });

  it('does not apply remote absolute urls on localhost runtime', async () => {
    spyOn(window as any, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        json: async () => ({
          apiBaseUrl: 'https://example.com/api',
          wsUrl: 'https://example.com/ws',
        }),
      } as Response),
    );
    spyOn<any>(service, 'isLocalhostRuntime').and.returnValue(true);

    const apiBefore = service.apiBaseUrl;
    const wsBefore = service.wsUrl;
    await service.load();

    expect(service.apiBaseUrl).toBe(apiBefore);
    expect(service.wsUrl).toBe(wsBefore);
  });

  it('builds authUrl safely with slash normalization', () => {
    (service as any).config.apiBaseUrl = 'http://localhost:3000/';
    (service as any).config.authPath = 'auth';

    expect(service.authUrl).toBe('http://localhost:3000/auth');

    (service as any).config.authPath = '/api/auth';
    expect(service.authUrl).toBe('http://localhost:3000/api/auth');
  });
});