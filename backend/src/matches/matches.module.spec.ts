import { LiveMatchService } from './live-match.service';
import { MatchSchedulerService } from './match-scheduler.service';
import { MatchesController } from './matches.controller';
import { MatchesModule } from './matches.module';
import { MatchesService } from './matches.service';

describe('MatchesModule', () => {
  it('wires controller/providers/exports', () => {
    const controllersMeta = Reflect.getMetadata('controllers', MatchesModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', MatchesModule) ?? [];
    const exportsMeta = Reflect.getMetadata('exports', MatchesModule) ?? [];

    expect(controllersMeta).toContain(MatchesController);
    expect(providersMeta).toContain(MatchesService);
    expect(providersMeta).toContain(LiveMatchService);
    expect(providersMeta).toContain(MatchSchedulerService);
    expect(exportsMeta).toContain(MatchesService);
    expect(exportsMeta).toContain(LiveMatchService);
  });
});
