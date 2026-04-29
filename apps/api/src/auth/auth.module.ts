import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerifiedGuard } from './email-verified.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule.register({}), UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    TokenService,
    PasswordService,
    JwtAuthGuard,
    EmailVerifiedGuard,
  ],
  exports: [PasswordService, JwtService, JwtAuthGuard, EmailVerifiedGuard],
})
export class AuthModule {}
