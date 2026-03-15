import { TypeOrmModule } from '@nestjs/typeorm';

import { Match } from '../matches/entities/match.entity';
import { Team } from '../teams/entities/team.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { SearchController } from './search.controller';
import { SearchModule } from './search.module';
import { SearchService } from './search.service';

describe('SearchModule', () => {
  it('registers expected imports/controllers/providers', () => {
    const importsMeta = Reflect.getMetadata('imports', SearchModule) ?? [];
    const controllersMeta = Reflect.getMetadata('controllers', SearchModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', SearchModule) ?? [];

    expect(importsMeta.length).toBeGreaterThan(0);
    expect(importsMeta[0]?.module).toBe(TypeOrmModule);
    expect(controllersMeta).toContain(SearchController);
    expect(providersMeta).toContain(SearchService);
  });
});