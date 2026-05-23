import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { IgdbModule } from '../igdb/igdb.module';

import { GameService } from './game.service';
import { UserGameController } from './user-game.controller';
import { UserGameService } from './user-game.service';

@Module({
  imports: [IgdbModule, AuthModule],
  controllers: [UserGameController],
  providers: [GameService, UserGameService],
  exports: [GameService, UserGameService],
})
export class GamesModule {}
