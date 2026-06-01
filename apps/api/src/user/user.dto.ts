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

export class PublicProfileStatsDto {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({
    description: 'Count of games per status',
    example: { WANT_TO_PLAY: 5, PLAYING: 2, COMPLETED: 30, DROPPED: 3, ON_HOLD: 2 },
  })
  byStatus!: Record<string, number>;
}

export class PublicProfileDto {
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

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: PublicProfileStatsDto })
  stats!: PublicProfileStatsDto;
}

export class PublicUserGameDto {
  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true, format: 'uri' })
  coverUrl!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  releaseDate!: string | null;

  @ApiProperty({ type: [String] })
  platforms!: string[];

  @ApiProperty({ example: 'COMPLETED' })
  status!: string;

  @ApiProperty({ nullable: true, example: 8 })
  rating!: number | null;
}

export class PublicUserGamesDto {
  @ApiProperty({ type: [PublicUserGameDto] })
  items!: PublicUserGameDto[];
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
