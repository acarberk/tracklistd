import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { EnvService } from '../config/env.service';

import { type Mailer, type SendEmailInput } from './mailer.types';

@Injectable()
export class ResendMailer implements Mailer {
  private readonly logger = new Logger(ResendMailer.name);
  private readonly client: Resend;

  constructor(private readonly env: EnvService) {
    const apiKey = this.env.resendApiKey;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when MAILER_DRIVER=resend');
    }
    this.client = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<void> {
    const result = await this.client.emails.send({
      from: this.env.mailerFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (result.error) {
      this.logger.error({ event: 'email_send_failed', error: result.error });
      throw new InternalServerErrorException('Failed to send email');
    }

    this.logger.log({ event: 'email_sent', to: input.to, id: result.data.id });
  }
}
