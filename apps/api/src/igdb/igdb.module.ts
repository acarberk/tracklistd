import { Module } from '@nestjs/common';

import { IgdbService } from './igdb.service';
import { TwitchAuthService } from './twitch-auth.service';

@Module({
  providers: [IgdbService, TwitchAuthService],
  exports: [IgdbService, TwitchAuthService],
})
export class IgdbModule {}
