import { ApiProperty } from '@nestjs/swagger';

export class GameSearchResultDto {
  @ApiProperty({ example: 19560, description: 'IGDB game ID' })
  igdbId!: number;

  @ApiProperty({ example: 'the-legend-of-zelda-breath-of-the-wild' })
  slug!: string;

  @ApiProperty({ example: 'The Legend of Zelda: Breath of the Wild' })
  title!: string;

  @ApiProperty({ required: false, description: 'Short description from IGDB' })
  summary?: string;

  @ApiProperty({ required: false, format: 'uri' })
  coverUrl?: string;

  @ApiProperty({ required: false, format: 'date-time' })
  releaseDate?: string;

  @ApiProperty({ type: [String], example: ['Nintendo Switch', 'Wii U'] })
  platforms!: string[];

  @ApiProperty({ type: [String], example: ['Adventure', 'Role-playing (RPG)'] })
  genres!: string[];

  @ApiProperty({ required: false, example: 95.5 })
  igdbRating?: number;

  @ApiProperty({ required: false, example: 1247 })
  igdbRatingCount?: number;
}

export class GameSearchResponseDto {
  @ApiProperty({ type: [GameSearchResultDto] })
  results!: GameSearchResultDto[];
}

export class GameDetailDto {
  @ApiProperty({ format: 'uuid', description: 'Internal Game row ID' })
  id!: string;

  @ApiProperty({ example: 19560, description: 'IGDB game ID' })
  igdbId!: number;

  @ApiProperty({ example: 'the-legend-of-zelda-breath-of-the-wild' })
  slug!: string;

  @ApiProperty({ example: 'The Legend of Zelda: Breath of the Wild' })
  title!: string;

  @ApiProperty({ nullable: true })
  summary!: string | null;

  @ApiProperty({ nullable: true, format: 'uri' })
  coverUrl!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  releaseDate!: string | null;

  @ApiProperty({ type: [String] })
  platforms!: string[];

  @ApiProperty({ type: [String] })
  genres!: string[];

  @ApiProperty({ nullable: true, example: 95.5 })
  igdbRating!: number | null;

  @ApiProperty({ nullable: true, example: 1247 })
  igdbRatingCount!: number | null;
}
