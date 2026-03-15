import { HealthController } from './health.controller';
import { HealthModule } from './health.module';

describe('HealthModule', () => {
  it('registers health controller', () => {
    const controllersMeta = Reflect.getMetadata('controllers', HealthModule) ?? [];

    expect(controllersMeta).toContain(HealthController);
  });
});
