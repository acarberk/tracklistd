import { Module } from '@nestjs/common';

import { GameController } from './game.controller';
import { IgdbService } from './igdb.service';
import { TwitchAuthService } from './twitch-auth.service';

@Module({
  controllers: [GameController],
  providers: [IgdbService, TwitchAuthService],
  exports: [IgdbService, TwitchAuthService],
})
export class IgdbModule {}
