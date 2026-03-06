import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @ApiProperty({
    description: '6-digit TOTP code',
    example: '123456',
  })
  @IsString()
  @Length(6, 8)
  code!: string;
}
