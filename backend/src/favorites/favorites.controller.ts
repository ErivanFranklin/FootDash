import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { FavoritesService } from './favorites.service';
import { FavoriteEntityType } from './entities/favorite.entity';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async addFavorite(
    @CurrentUser() user: { sub: number },
    @Body() body: { entityType: FavoriteEntityType; entityId: number },
  ) {
    return this.favoritesService.addFavorite(
      user.sub,
      body.entityType,
      body.entityId,
    );
  }

  @Delete(':entityType/:entityId')
  async removeFavorite(
    @CurrentUser() user: { sub: number },
    @Param('entityType') entityType: FavoriteEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    await this.favoritesService.removeFavorite(user.sub, entityType, entityId);
    return { success: true };
  }

  @Get()
  async getUserFavorites(
    @CurrentUser() user: { sub: number },
    @Query('type') type?: FavoriteEntityType,
  ) {
    return this.favoritesService.getUserFavorites(user.sub, type);
  }

  @Get('check/:entityType/:entityId')
  async isFavorite(
    @CurrentUser() user: { sub: number },
    @Param('entityType') entityType: FavoriteEntityType,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    const isFav = await this.favoritesService.isFavorite(
      user.sub,
      entityType,
      entityId,
    );
    return { isFavorite: isFav };
  }
}
