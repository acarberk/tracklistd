import { Injectable, Logger } from '@nestjs/common';

import { EnvService } from '../config/env.service';

import { type Mailer, type SendEmailInput } from './mailer.types';

@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger(ConsoleMailer.name);

  constructor(private readonly env: EnvService) {}

  send(input: SendEmailInput): Promise<void> {
    this.logger.log({
      event: 'email_send_console',
      from: this.env.mailerFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return Promise.resolve();
  }
}
