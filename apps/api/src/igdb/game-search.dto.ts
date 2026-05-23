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
