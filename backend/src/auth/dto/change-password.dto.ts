import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'OldPass123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: 'New password (min 8 characters)', example: 'NewStr0ng!Pass', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
