import { DashboardController } from './dashboard.controller';
import { DashboardModule } from './dashboard.module';
import { DashboardService } from './dashboard.service';

describe('DashboardModule', () => {
  it('registers dashboard controller and service', () => {
    const controllersMeta =
      Reflect.getMetadata('controllers', DashboardModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', DashboardModule) ?? [];

    expect(controllersMeta).toContain(DashboardController);
    expect(providersMeta).toContain(DashboardService);
  });
});
