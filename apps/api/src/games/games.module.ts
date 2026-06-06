import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { IgdbModule } from '../igdb/igdb.module';

import { GameController } from './game.controller';
import { GameService } from './game.service';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { UserGameController } from './user-game.controller';
import { UserGameService } from './user-game.service';

@Module({
  imports: [IgdbModule, AuthModule],
  controllers: [GameController, UserGameController, ListController],
  providers: [GameService, UserGameService, ListService],
  exports: [GameService, UserGameService],
})
export class GamesModule {}
