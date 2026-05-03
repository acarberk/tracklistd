import { JwtService as NestJwtService } from '@nestjs/jwt';

import { type EnvService } from '../config/env.service';

import { JwtService } from './jwt.service';

describe('JwtService', () => {
  let service: JwtService;

  const env: Pick<
    EnvService,
    'jwtAccessSecret' | 'jwtRefreshSecret' | 'jwtAccessTtl' | 'jwtRefreshTtl'
  > = {
    jwtAccessSecret: 'a'.repeat(64),
    jwtRefreshSecret: 'b'.repeat(64),
    jwtAccessTtl: '15m',
    jwtRefreshTtl: '7d',
  };

  beforeEach(() => {
    const nest = new NestJwtService();
    service = new JwtService(nest, env as EnvService);
  });

  describe('access token', () => {
    it('signs and verifies a valid token round-trip', async () => {
      const token = await service.signAccessToken({
        sub: 'user-123',
        email: 'berk@test.com',
        emailVerified: true,
      });

      const payload = await service.verifyAccessToken(token);
      expect(payload.sub).toBe('user-123');
      expect(payload.email).toBe('berk@test.com');
      expect(payload.emailVerified).toBe(true);
    });

    it('rejects a token signed with the refresh secret', async () => {
      const refreshToken = await service.signRefreshToken({
        sub: 'user-123',
        jti: 'jti-1',
        family: 'fam-1',
        rotation: 0,
      });

      await expect(service.verifyAccessToken(refreshToken)).rejects.toThrow();
    });

    it('rejects a tampered token', async () => {
      const token = await service.signAccessToken({
        sub: 'user-123',
        email: 'berk@test.com',
        emailVerified: false,
      });

      const parts = token.split('.');
      const tampered = `${parts[0] ?? ''}.${parts[1] ?? ''}.AAAA`;

      await expect(service.verifyAccessToken(tampered)).rejects.toThrow();
    });
  });

  describe('refresh token', () => {
    it('round-trips and preserves rotation chain fields', async () => {
      const token = await service.signRefreshToken({
        sub: 'user-9',
        jti: 'unique-jti',
        family: 'family-uuid',
        rotation: 3,
      });

      const payload = await service.verifyRefreshToken(token);
      expect(payload.sub).toBe('user-9');
      expect(payload.jti).toBe('unique-jti');
      expect(payload.family).toBe('family-uuid');
      expect(payload.rotation).toBe(3);
    });

    it('rejects a token signed with the access secret', async () => {
      const accessToken = await service.signAccessToken({
        sub: 'user-9',
        email: 'a@b.com',
        emailVerified: true,
      });

      await expect(service.verifyRefreshToken(accessToken)).rejects.toThrow();
    });
  });
});
