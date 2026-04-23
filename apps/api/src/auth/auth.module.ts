import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';

import { PasswordService } from './password.service';

@Module({
  imports: [UserModule],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class AuthModule {}
