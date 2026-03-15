import { FavoritesController } from './favorites.controller';
import { FavoritesModule } from './favorites.module';
import { FavoritesService } from './favorites.service';

describe('FavoritesModule', () => {
  it('wires favorites controller/provider/export', () => {
    const controllersMeta =
      Reflect.getMetadata('controllers', FavoritesModule) ?? [];
    const providersMeta = Reflect.getMetadata('providers', FavoritesModule) ?? [];
    const exportsMeta = Reflect.getMetadata('exports', FavoritesModule) ?? [];

    expect(controllersMeta).toContain(FavoritesController);
    expect(providersMeta).toContain(FavoritesService);
    expect(exportsMeta).toContain(FavoritesService);
  });
});
