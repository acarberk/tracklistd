import { ApiProperty } from '@nestjs/swagger';
import { GAME_STATUSES } from '@tracklistd/shared';

export class AddUserGameDto {
  @ApiProperty({ example: 1942, description: 'IGDB game ID' })
  igdbId!: number;

  @ApiProperty({ enum: GAME_STATUSES, required: false, default: 'WANT_TO_PLAY' })
  status?: (typeof GAME_STATUSES)[number];

  @ApiProperty({ required: false, minimum: 1, maximum: 10 })
  rating?: number;

  @ApiProperty({ required: false, maxLength: 10_000 })
  review?: string;

  @ApiProperty({ required: false, format: 'date-time' })
  startedAt?: string;

  @ApiProperty({ required: false, format: 'date-time' })
  completedAt?: string;

  @ApiProperty({ required: false, minimum: 0 })
  hoursPlayed?: number;
}

export class UpdateUserGameDto {
  @ApiProperty({ enum: GAME_STATUSES, required: false })
  status?: (typeof GAME_STATUSES)[number];

  @ApiProperty({ required: false, nullable: true })
  rating?: number | null;

  @ApiProperty({ required: false, nullable: true })
  review?: string | null;

  @ApiProperty({ required: false, format: 'date-time', nullable: true })
  startedAt?: string | null;

  @ApiProperty({ required: false, format: 'date-time', nullable: true })
  completedAt?: string | null;

  @ApiProperty({ required: false, nullable: true })
  hoursPlayed?: number | null;
}

class GameSnapshotDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  igdbId!: number;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  summary!: string | null;

  @ApiProperty({ nullable: true })
  coverUrl!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  releaseDate!: string | null;

  @ApiProperty({ type: [String] })
  platforms!: string[];

  @ApiProperty({ type: [String] })
  genres!: string[];
}

export class UserGameDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: GAME_STATUSES })
  status!: (typeof GAME_STATUSES)[number];

  @ApiProperty({ nullable: true })
  rating!: number | null;

  @ApiProperty({ nullable: true })
  review!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  startedAt!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  completedAt!: string | null;

  @ApiProperty({ nullable: true })
  hoursPlayed!: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({ type: GameSnapshotDto })
  game!: GameSnapshotDto;
}

export class ListUserGamesResponseDto {
  @ApiProperty({ type: [UserGameDto] })
  items!: UserGameDto[];

  @ApiProperty({ nullable: true, format: 'uuid' })
  nextCursor!: string | null;
}
