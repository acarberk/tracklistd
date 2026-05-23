import { Injectable, Logger } from '@nestjs/common';

import { EnvService } from '../config/env.service';

interface SiteVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 5000;
const MAX_TOKEN_LENGTH = 2048;

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly env: EnvService) {}

  get isEnabled(): boolean {
    return this.env.isTurnstileEnabled;
  }

  async verify(token: string, ipAddress: string | undefined): Promise<boolean> {
    if (!this.env.turnstileSecret) {
      return true;
    }
    if (token.length > MAX_TOKEN_LENGTH) {
      this.logger.warn({ event: 'turnstile_token_too_long', length: token.length });
      return false;
    }

    const body = new URLSearchParams({
      secret: this.env.turnstileSecret,
      response: token,
    });
    if (ipAddress) {
      body.set('remoteip', ipAddress);
    }

    try {
      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn({
          event: 'turnstile_verify_http_error',
          status: response.status,
        });
        return false;
      }

      const result = (await response.json()) as SiteVerifyResponse;
      if (!result.success) {
        this.logger.warn({
          event: 'turnstile_verify_failed',
          errors: result['error-codes'] ?? [],
        });
      }
      return result.success;
    } catch (error) {
      this.logger.error({ event: 'turnstile_verify_exception', error });
      return false;
    }
  }
}
