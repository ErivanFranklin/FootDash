import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserProfileService } from './services/user-profile.service';
import { UserPreferencesService } from './services/user-preferences.service';
import { AvatarUploadService } from './services/avatar-upload.service';
import { UserProfileController } from './controllers/user-profile.controller';
import { UserPreferencesController } from './controllers/user-preferences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserPreferences])],
  controllers: [UserProfileController, UserPreferencesController],
  providers: [UserProfileService, UserPreferencesService, AvatarUploadService],
  exports: [UserProfileService, UserPreferencesService],
})
export class UsersModule {}
