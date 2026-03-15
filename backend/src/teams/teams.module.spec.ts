import { TeamsController } from './teams.controller';
import { TeamsModule } from './teams.module';
import { TeamsService } from './teams.service';

describe('TeamsModule', () => {
  it('exposes controller/provider/export wiring', () => {
    const controllersMeta = Reflect.getMetadata('controllers', TeamsModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', TeamsModule) ?? [];
    const exportsMeta = Reflect.getMetadata('exports', TeamsModule) ?? [];

    expect(controllersMeta).toContain(TeamsController);
    expect(providersMeta).toContain(TeamsService);
    expect(exportsMeta).toContain(TeamsService);
  });
});