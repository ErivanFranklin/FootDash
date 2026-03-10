import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SearchType {
  ALL = 'all',
  TEAMS = 'teams',
  USERS = 'users',
  MATCHES = 'matches',
}

export class SearchQueryDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @Transform(({ value }: { value: string }) => value?.trim())
  q!: string;

  @IsOptional()
  @IsEnum(SearchType)
  type: SearchType = SearchType.ALL;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export interface SearchResultItem {
  id: number;
  type: 'team' | 'user' | 'match';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  query: string;
  type: SearchType;
}
