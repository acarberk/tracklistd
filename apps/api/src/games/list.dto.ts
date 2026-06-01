import { ApiProperty } from '@nestjs/swagger';

export class CreateListDto {
  @ApiProperty({ example: 'Cozy games', minLength: 1, maxLength: 100 })
  name!: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 1000 })
  description?: string | null;

  @ApiProperty({ required: false, default: true })
  isPublic?: boolean;
}

export class UpdateListDto {
  @ApiProperty({ required: false, minLength: 1, maxLength: 100 })
  name?: string;

  @ApiProperty({ required: false, nullable: true, maxLength: 1000 })
  description?: string | null;

  @ApiProperty({ required: false })
  isPublic?: boolean;
}

export class AddListItemDto {
  @ApiProperty({ example: 1942 })
  igdbId!: number;
}

class ListGameDto {
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
}

export class ListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty({ type: ListGameDto })
  game!: ListGameDto;
}

export class GameListSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty({ example: 7 })
  itemCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class GameListDetailDto extends GameListSummaryDto {
  @ApiProperty({ type: [ListItemDto] })
  items!: ListItemDto[];
}

export class GameListsResponseDto {
  @ApiProperty({ type: [GameListSummaryDto] })
  items!: GameListSummaryDto[];
}
