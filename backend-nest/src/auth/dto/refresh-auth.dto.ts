import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshAuthDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  refreshToken!: string;
}
