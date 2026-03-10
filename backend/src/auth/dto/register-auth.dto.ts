import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterAuthDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 's3cr3t123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
