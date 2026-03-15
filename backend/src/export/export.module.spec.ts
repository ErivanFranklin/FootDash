import { ExportController } from './export.controller';
import { ExportModule } from './export.module';
import { ExportService } from './export.service';

describe('ExportModule', () => {
  it('registers export controller and service', () => {
    const controllersMeta = Reflect.getMetadata('controllers', ExportModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', ExportModule) ?? [];

    expect(controllersMeta).toContain(ExportController);
    expect(providersMeta).toContain(ExportService);
  });
});