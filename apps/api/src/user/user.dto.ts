import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true, format: 'uri' })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, maxLength: 500 })
  bio!: string | null;

  @ApiProperty({ nullable: true, example: 'TR', description: 'ISO 3166-1 alpha-2 country code' })
  country!: string | null;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false, minLength: 1, maxLength: 100 })
  displayName?: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 500 })
  bio?: string | null;

  @ApiProperty({ required: false, nullable: true, example: 'TR' })
  country?: string | null;

  @ApiProperty({ required: false, nullable: true, format: 'uri' })
  avatarUrl?: string | null;
}
