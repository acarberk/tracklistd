import { Global, Module, type Provider } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { EnvService } from '../config/env.service';

import { ConsoleMailer } from './console.mailer';
import { MAILER_TOKEN, type Mailer } from './mailer.types';
import { ResendMailer } from './resend.mailer';

const mailerProvider: Provider = {
  provide: MAILER_TOKEN,
  inject: [EnvService],
  useFactory: (env: EnvService): Mailer => {
    if (env.mailerDriver === 'resend') {
      return new ResendMailer(env);
    }
    return new ConsoleMailer(env);
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [mailerProvider],
  exports: [mailerProvider],
})
export class MailerModule {}
