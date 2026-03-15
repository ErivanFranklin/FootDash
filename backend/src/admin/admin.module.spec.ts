import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { AdminModule } from './admin.module';
import { AdminService } from './admin.service';

describe('AdminModule', () => {
  it('registers controller and providers', () => {
    const controllersMeta = Reflect.getMetadata('controllers', AdminModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', AdminModule) ?? [];

    expect(controllersMeta).toContain(AdminController);
    expect(providersMeta).toContain(AdminService);
    expect(providersMeta).toContain(AdminAnalyticsService);
  });
});
