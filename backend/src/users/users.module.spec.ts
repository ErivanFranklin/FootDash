import { AvatarUploadService } from './services/avatar-upload.service';
import { UserPreferencesService } from './services/user-preferences.service';
import { UserProfileService } from './services/user-profile.service';
import { UsersModule } from './users.module';

describe('UsersModule', () => {
  it('exports expected services for cross-module usage', () => {
    const providersMeta = Reflect.getMetadata('providers', UsersModule) ?? [];
    const exportsMeta = Reflect.getMetadata('exports', UsersModule) ?? [];

    expect(providersMeta).toContain(UserProfileService);
    expect(providersMeta).toContain(UserPreferencesService);
    expect(providersMeta).toContain(AvatarUploadService);
    expect(exportsMeta).toContain(UserProfileService);
    expect(exportsMeta).toContain(UserPreferencesService);
  });
});