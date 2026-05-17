import { BadRequestException, type ExecutionContext } from '@nestjs/common';

import { TurnstileGuard } from './turnstile.guard';
import { type TurnstileService } from './turnstile.service';

interface FakeRequest {
  body?: unknown;
  ip?: string;
}

function buildContext(request: FakeRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function buildService(opts: { enabled: boolean; verifyResult?: boolean }): {
  service: TurnstileService;
  verify: jest.Mock;
} {
  const verify = jest.fn().mockResolvedValue(opts.verifyResult ?? true);
  const service = {
    isEnabled: opts.enabled,
    verify,
  } as unknown as TurnstileService;
  return { service, verify };
}

describe('TurnstileGuard', () => {
  it('passes through when turnstile is disabled', async () => {
    const { service, verify } = buildService({ enabled: false });
    const guard = new TurnstileGuard(service);
    const ctx = buildContext({ body: {} });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });

  it('throws AUTH_CAPTCHA_REQUIRED when enabled and token is missing', async () => {
    const { service } = buildService({ enabled: true });
    const guard = new TurnstileGuard(service);
    const ctx = buildContext({ body: {} });

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      response: { code: 'AUTH_CAPTCHA_REQUIRED' },
    });
  });

  it('throws AUTH_CAPTCHA_REQUIRED when token is empty string', async () => {
    const { service } = buildService({ enabled: true });
    const guard = new TurnstileGuard(service);
    const ctx = buildContext({ body: { turnstileToken: '' } });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws AUTH_CAPTCHA_FAILED when verify returns false', async () => {
    const { service, verify } = buildService({ enabled: true, verifyResult: false });
    const guard = new TurnstileGuard(service);
    const ctx = buildContext({ body: { turnstileToken: 'bad' }, ip: '1.2.3.4' });

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      response: { code: 'AUTH_CAPTCHA_FAILED' },
    });
    expect(verify).toHaveBeenCalledWith('bad', '1.2.3.4');
  });

  it('returns true when verify succeeds', async () => {
    const { service, verify } = buildService({ enabled: true, verifyResult: true });
    const guard = new TurnstileGuard(service);
    const ctx = buildContext({ body: { turnstileToken: 'good' }, ip: '5.6.7.8' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('good', '5.6.7.8');
  });

  it('tolerates missing body and rejects with AUTH_CAPTCHA_REQUIRED', async () => {
    const { service } = buildService({ enabled: true });
    const guard = new TurnstileGuard(service);
    const ctx = buildContext({});

    await expect(guard.canActivate(ctx)).rejects.toMatchObject({
      response: { code: 'AUTH_CAPTCHA_REQUIRED' },
    });
  });
});
