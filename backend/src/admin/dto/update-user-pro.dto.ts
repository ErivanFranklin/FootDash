import { IsBoolean } from 'class-validator';

export class UpdateUserProDto {
  @IsBoolean()
  isPro: boolean;
}
