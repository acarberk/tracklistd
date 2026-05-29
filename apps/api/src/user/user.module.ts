import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { PublicUserController } from './public-user.controller';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UserController, PublicUserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
