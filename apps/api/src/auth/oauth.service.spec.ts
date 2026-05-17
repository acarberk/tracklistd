import { ConflictException } from '@nestjs/common';
import { type User } from '@prisma/client';

import { type UserService } from '../user/user.service';

import { type GoogleProfileInput, OAuthService } from './oauth.service';

function buildUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 'user-1',
    email: 'victim@example.com',
    username: 'victim',
    displayName: 'Victim',
    passwordHash: null,
    avatarUrl: null,
    emailVerified: false,
    googleId: null,
    appleId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as User;
}

function buildInput(overrides: Partial<GoogleProfileInput> = {}): GoogleProfileInput {
  return {
    googleId: 'google-abc',
    email: 'victim@example.com',
    emailVerified: true,
    displayName: 'Victim',
    ...overrides,
  };
}

describe('OAuthService — email takeover defense', () => {
  function buildService() {
    const findByGoogleId = jest.fn();
    const findByEmail = jest.fn();
    const findByUsername = jest.fn();
    const linkGoogleId = jest.fn();
    const createFromOAuth = jest.fn();
    const users = {
      findByGoogleId,
      findByEmail,
      findByUsername,
      linkGoogleId,
      createFromOAuth,
    } as unknown as UserService;
    return {
      service: new OAuthService(users),
      findByGoogleId,
      findByEmail,
      linkGoogleId,
    };
  }

  it('returns existing user when googleId already linked', async () => {
    const { service, findByGoogleId, linkGoogleId } = buildService();
    const existing = buildUser({ googleId: 'google-abc', emailVerified: true });
    findByGoogleId.mockResolvedValue(existing);

    const result = await service.upsertFromGoogle(buildInput());

    expect(result).toBe(existing);
    expect(linkGoogleId).not.toHaveBeenCalled();
  });

  it('throws INTEGRATION_ALREADY_LINKED when email is bound to a different google account', async () => {
    const { service, findByGoogleId, findByEmail, linkGoogleId } = buildService();
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(buildUser({ googleId: 'google-other', emailVerified: true }));

    await expect(service.upsertFromGoogle(buildInput())).rejects.toBeInstanceOf(ConflictException);
    expect(linkGoogleId).not.toHaveBeenCalled();
  });

  it('clears password when linking google to an unverified account with a password', async () => {
    const { service, findByGoogleId, findByEmail, linkGoogleId } = buildService();
    const victim = buildUser({
      passwordHash: 'bcrypt-hash-from-attacker',
      emailVerified: false,
    });
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(victim);
    linkGoogleId.mockResolvedValue({
      ...victim,
      googleId: 'google-abc',
      emailVerified: true,
      passwordHash: null,
    });

    await service.upsertFromGoogle(buildInput({ emailVerified: true }));

    expect(linkGoogleId).toHaveBeenCalledWith(victim.id, 'google-abc', {
      markEmailVerified: true,
      clearPassword: true,
    });
  });

  it('does NOT clear password when account is already email-verified', async () => {
    const { service, findByGoogleId, findByEmail, linkGoogleId } = buildService();
    const legitOwner = buildUser({
      passwordHash: 'bcrypt-legit-password',
      emailVerified: true,
    });
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(legitOwner);
    linkGoogleId.mockResolvedValue({ ...legitOwner, googleId: 'google-abc' });

    await service.upsertFromGoogle(buildInput({ emailVerified: true }));

    expect(linkGoogleId).toHaveBeenCalledWith(legitOwner.id, 'google-abc', {
      markEmailVerified: true,
      clearPassword: false,
    });
  });

  it('does NOT clear password when google reports email_verified=false', async () => {
    const { service, findByGoogleId, findByEmail, linkGoogleId } = buildService();
    const victim = buildUser({
      passwordHash: 'bcrypt-hash',
      emailVerified: false,
    });
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(victim);
    linkGoogleId.mockResolvedValue(victim);

    await service.upsertFromGoogle(buildInput({ emailVerified: false }));

    expect(linkGoogleId).toHaveBeenCalledWith(victim.id, 'google-abc', {
      markEmailVerified: false,
      clearPassword: false,
    });
  });

  it('does NOT clear password when account has no password set', async () => {
    const { service, findByGoogleId, findByEmail, linkGoogleId } = buildService();
    const oauthOnly = buildUser({ passwordHash: null, emailVerified: false });
    findByGoogleId.mockResolvedValue(null);
    findByEmail.mockResolvedValue(oauthOnly);
    linkGoogleId.mockResolvedValue(oauthOnly);

    await service.upsertFromGoogle(buildInput({ emailVerified: true }));

    expect(linkGoogleId).toHaveBeenCalledWith(oauthOnly.id, 'google-abc', {
      markEmailVerified: true,
      clearPassword: false,
    });
  });
});
