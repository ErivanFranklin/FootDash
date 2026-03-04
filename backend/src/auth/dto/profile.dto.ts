import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class ProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ example: false })
  isPro: boolean;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;
}
