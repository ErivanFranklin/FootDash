import { NotificationsController } from './notifications.controller';
import { NotificationsModule } from './notifications.module';
import { NotificationsService } from './notifications.service';

describe('NotificationsModule', () => {
  it('registers and exports notifications service', () => {
    const controllersMeta =
      Reflect.getMetadata('controllers', NotificationsModule) ?? [];
    const providersMeta =
      Reflect.getMetadata('providers', NotificationsModule) ?? [];
    const exportsMeta = Reflect.getMetadata('exports', NotificationsModule) ?? [];

    expect(controllersMeta).toContain(NotificationsController);
    expect(providersMeta).toContain(NotificationsService);
    expect(exportsMeta).toContain(NotificationsService);
  });
});
