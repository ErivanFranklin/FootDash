import { PaymentsController } from './payments.controller';
import { PaymentsModule } from './payments.module';
import { PaymentsService } from './payments.service';

describe('PaymentsModule', () => {
  it('registers payments controller and service provider', () => {
    const controllersMeta =
      Reflect.getMetadata('controllers', PaymentsModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', PaymentsModule) ?? [];

    expect(controllersMeta).toContain(PaymentsController);
    expect(providersMeta).toContain(PaymentsService);
  });
});
