import { Injectable, Logger } from '@nestjs/common';

import { EnvService } from '../config/env.service';

interface SiteVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

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

    const body = new URLSearchParams({
      secret: this.env.turnstileSecret,
      response: token,
    });
    if (ipAddress) {
      body.set('remoteip', ipAddress);
    }

    try {
      const response = await fetch(this.env.turnstileVerifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
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
