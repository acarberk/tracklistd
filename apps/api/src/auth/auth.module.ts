import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { MailerModule } from '../mailer/mailer.module';
import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerifiedGuard } from './email-verified.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleStrategy } from './google.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from './jwt.service';
import { OAuthService } from './oauth.service';
import { PasswordResetService } from './password-reset.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule.register({}), PassportModule, UserModule, MailerModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    TokenService,
    PasswordService,
    EmailVerificationService,
    PasswordResetService,
    OAuthService,
    GoogleStrategy,
    JwtAuthGuard,
    EmailVerifiedGuard,
    GoogleAuthGuard,
  ],
  exports: [PasswordService, JwtService, JwtAuthGuard, EmailVerifiedGuard],
})
export class AuthModule {}
