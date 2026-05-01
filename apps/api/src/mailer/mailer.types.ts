export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  send(input: SendEmailInput): Promise<void>;
}

export const MAILER_TOKEN = Symbol('MAILER');
