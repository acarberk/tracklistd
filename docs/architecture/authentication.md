# Authentication & Authorization

Design document for Tracklistd authentication, identity, and platform integration.

## Goals

- **Low-friction sign-up** for new users (one-tap OAuth preferred)
- **Clear separation** between identity (who you are) and integrations (what data you sync)
- **Multi-device, stateless** session model compatible with web and future mobile clients
- **Defense in depth** against common attacks: brute force, credential stuffing, account takeover, session theft
- **Multi-domain ready** — identity must not be tied to a single domain (games), since future phases add movies, TV, anime

## Decisions

### Identity Providers

Three methods at MVP. All three land on the same account model.

- **Google OAuth 2.0** — primary one-tap path, email pre-verified
- **Sign in with Apple** — iOS App Store compliance, privacy-friendly (email relay)
- **Email + password** — baseline for users without Google/Apple, testing, dev accounts

**Rejected for MVP:** Discord, Facebook, Twitter/X, GitHub. Can be added later as demand emerges.

### Integrations vs Identity

External platforms (Steam, PSN, Xbox, Trakt, MAL) are **not** identity providers. They are **integrations**: a user signs in with Google/Apple/email first, then optionally connects platforms to sync their libraries.

Rationale:

- Steam OpenID does not return email; pairing it with identity forced a second prompt
- Users outside gaming (future movie/anime modules) do not have Steam
- Linking multiple platforms to one account is natural when platforms are integrations
- Mobile apps can use native Apple/Google sign-in; Steam is only viable via WebView

### Session Model

Short-lived access token + long-lived refresh token with rotation.

- **Access token:** signed JWT (HS256), 15-minute TTL, carried in `Authorization: Bearer` header, stored in-memory on the client
- **Refresh token:** opaque random value, 7-day TTL, stored in `httpOnly`, `Secure`, `SameSite=Lax` cookie scoped to `/api/auth/refresh`
- **Rotation:** each refresh issues a new refresh token and invalidates the previous. Reuse of an invalidated token is treated as theft and revokes the entire token family

### Password Policy

- Minimum 8 characters (NIST SP 800-63B current guidance)
- No forced complexity rules (mixed case, numbers, symbols) — these decrease actual entropy in practice
- Check against Have I Been Pwned using k-anonymity API on registration and password change
- `bcrypt` hash with cost factor 12

### Email Verification

- Required before write actions (rating, reviewing, list creation, integrations)
- Read access (browsing, viewing profiles) allowed without verification
- Token lifetime: 24 hours, one-time use
- Google/Apple sign-ups skip verification (already verified by provider)

### CAPTCHA

- **Cloudflare Turnstile** on registration and password reset forms
- Conditional on login (shown after 3 failed attempts)

### Avatar

- Upload-only (images stored in object storage, served via CDN)
- No automatic import from Google/Apple profile pictures — cleaner user control, avoids stale third-party URLs

### Two-Factor Authentication

- Deferred to v1.1 (TOTP via authenticator apps)

## Data Model

Prisma schema. Timestamps and soft-delete fields are standard.

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  emailVerified   Boolean   @default(false)
  passwordHash    String?
  username        String    @unique
  displayName     String
  avatarUrl       String?
  bio             String?
  country         String?

  googleId        String?   @unique
  appleId         String?   @unique

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  platformIntegrations PlatformIntegration[]
  refreshTokens        RefreshToken[]
  emailTokens          EmailVerificationToken[]
  passwordResetTokens  PasswordResetToken[]

  @@index([email])
  @@index([username])
}

enum Platform {
  STEAM
  PSN
  XBOX
}

enum SyncStatus {
  PENDING
  SYNCING
  COMPLETED
  FAILED
  DISABLED
}

model PlatformIntegration {
  id              String     @id @default(uuid())
  userId          String
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform        Platform
  externalId      String
  externalHandle  String?
  accessToken     String?
  refreshToken    String?
  metadata        Json?
  connectedAt     DateTime   @default(now())
  lastSyncAt      DateTime?
  syncStatus      SyncStatus @default(PENDING)

  @@unique([userId, platform])
  @@unique([platform, externalId])
  @@index([userId])
}

model RefreshToken {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash   String    @unique
  family      String
  rotation    Int       @default(0)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?
  replacedBy  String?
  userAgent   String?
  ipAddress   String?

  @@index([userId])
  @@index([family])
  @@index([expiresAt])
}

model EmailVerificationToken {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String    @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}

model PasswordResetToken {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String    @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime  @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

Tokens are stored as SHA-256 hashes, never in plaintext. The raw token is returned once at creation and is unrecoverable afterward.

Rate-limit counters (login attempts, CAPTCHA triggers) live in Redis with short TTLs rather than Postgres, to avoid write amplification.

## Flows

### Email Registration

```
POST /api/auth/register
  body: { email, password, username, displayName, turnstileToken }

  validate input (Zod)
  verify Turnstile token
  check email + username uniqueness
  check password against HIBP
  hash password (bcrypt, cost=12)
  create User (emailVerified=false)
  create EmailVerificationToken (24h)
  send verification email via Resend

  return 201 { userId, email }
```

User lands on `/auth/verify-email-sent` and clicks the link in their inbox.

```
GET /api/auth/verify-email?token=XXX

  find EmailVerificationToken by hash
  check not expired, not used
  mark token usedAt=now
  set user.emailVerified=true

  redirect to /welcome
```

### Email Login

```
POST /api/auth/login
  body: { email, password, turnstileToken? }

  rate limit: 5 attempts / 15 min / (ip + email)
  find user by email
  compare password with bcrypt
  on failure: record attempt, increment counter
  on success:
    generate access token (15m)
    generate refresh token (7d), family=new UUID, rotation=0
    store hash in RefreshToken table
    set refresh cookie
    return { accessToken, user }
```

After 3 failed attempts, require Turnstile on the next attempt.

### Google OAuth

```
1. User clicks "Continue with Google"
2. Browser redirects to Google authorization endpoint
   scope: openid email profile
3. Google redirects to /api/auth/google/callback?code=XXX
4. Backend exchanges code for ID token
5. Backend validates ID token signature
6. Extract: googleId (sub), email, emailVerified
7. Match flow:
   - User exists by googleId -> login
   - User exists by email -> link googleId, login
   - New user -> create account (emailVerified from Google)
8. Issue tokens, redirect to /welcome or /
```

### Apple Sign-In

```
1. User clicks "Sign in with Apple"
2. Browser redirects to Apple authorization endpoint
3. Apple redirects to /api/auth/apple/callback with id_token
4. Backend verifies id_token against Apple JWKS
5. Extract: appleId (sub), email (first sign-in only), name (first sign-in only)
6. Match flow:
   - User exists by appleId -> login
   - User exists by email -> link appleId, login
   - New user -> create account, persist name/email carefully (first-only)
7. Issue tokens, redirect
```

Apple's email relay addresses (`@privaterelay.appleid.com`) are accepted as-is. The user never sees or controls the underlying real address.

### Token Refresh

```
POST /api/auth/refresh
  cookie: refresh_token=XXX

  parse cookie, hash token
  find RefreshToken by tokenHash
  checks:
    - not expired
    - not revoked
    - rotation is current (no replay)
  if replay detected:
    revoke entire family
    return 401 + clear cookie
  else:
    mark old token revoked
    issue new access token (15m)
    issue new refresh token (family=same, rotation+1)
    update cookie
    return { accessToken }
```

### Password Reset

```
POST /api/auth/forgot-password
  body: { email, turnstileToken }

  verify Turnstile
  find user by email (do not disclose existence)
  if found: create PasswordResetToken (1h), send email
  always return 200 { message: "If the email exists, a reset link was sent" }

POST /api/auth/reset-password
  body: { token, newPassword }

  find token by hash, check expiry + not used
  check new password against HIBP
  hash + update user
  mark token used
  revoke all refresh tokens for user (force re-login everywhere)

  return 200
```

### Logout

```
POST /api/auth/logout
  reads refresh cookie
  revokes the token (current only — other devices remain logged in)
  clears cookie
```

```
POST /api/auth/logout-everywhere
  requires valid access token
  revokes all active refresh tokens for the user
  clears cookie
```

### Steam Integration (Post-Login)

```
1. Logged-in user clicks "Connect Steam"
2. Backend redirects to Steam OpenID endpoint with return URL
3. User authenticates on Steam, approves
4. Steam redirects to /api/integrations/steam/callback with OpenID response
5. Backend verifies OpenID signature
6. Extract SteamID64 from claimed_id URL
7. Check: is this SteamID already in PlatformIntegration?
   - Yes, different user -> 409 Conflict
   - Yes, same user -> idempotent success
   - No -> create PlatformIntegration (syncStatus=PENDING)
8. Fetch profile from Steam Web API (ISteamUser/GetPlayerSummaries)
9. Enqueue library sync job (Bull)
10. Redirect to /settings/integrations with success message
```

Disconnect:

```
DELETE /api/integrations/steam
  requires valid access token
  delete PlatformIntegration (syncStatus -> cascade cleanup handled by job)
```

## API Endpoints

| Method | Path                             | Auth    | Description                 |
| ------ | -------------------------------- | ------- | --------------------------- |
| POST   | /api/auth/register               | none    | Email registration          |
| POST   | /api/auth/login                  | none    | Email login                 |
| GET    | /api/auth/verify-email           | none    | Email verification (query)  |
| POST   | /api/auth/resend-verification    | access  | Resend verification email   |
| POST   | /api/auth/forgot-password        | none    | Request reset link          |
| POST   | /api/auth/reset-password         | none    | Submit new password         |
| POST   | /api/auth/refresh                | refresh | Rotate tokens               |
| POST   | /api/auth/logout                 | refresh | Revoke current session      |
| POST   | /api/auth/logout-everywhere      | access  | Revoke all sessions         |
| GET    | /api/auth/google                 | none    | Start Google OAuth          |
| GET    | /api/auth/google/callback        | none    | Google redirect handler     |
| GET    | /api/auth/apple                  | none    | Start Apple OAuth           |
| POST   | /api/auth/apple/callback         | none    | Apple redirect handler      |
| GET    | /api/auth/me                     | access  | Current user                |
| PATCH  | /api/auth/me                     | access  | Update profile              |
| POST   | /api/auth/change-password        | access  | Change password             |
| DELETE | /api/auth/me                     | access  | Delete account (soft, GDPR) |
| GET    | /api/integrations/steam          | access  | Start Steam OpenID          |
| GET    | /api/integrations/steam/callback | access  | Steam redirect handler      |
| DELETE | /api/integrations/steam          | access  | Disconnect Steam            |

## Error Model

Consistent JSON shape across all auth endpoints:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": { "field": "password" }
  }
}
```

Error codes are stable machine-readable identifiers. UI maps them to localized strings.

Selected codes:

- `AUTH_INVALID_CREDENTIALS` — wrong email or password
- `AUTH_EMAIL_TAKEN` — email already registered
- `AUTH_USERNAME_TAKEN` — username already in use
- `AUTH_WEAK_PASSWORD` — password failed HIBP check
- `AUTH_EMAIL_NOT_VERIFIED` — action requires verified email
- `AUTH_RATE_LIMITED` — too many attempts
- `AUTH_CAPTCHA_REQUIRED` — Turnstile token missing or invalid
- `AUTH_TOKEN_EXPIRED` — token TTL exceeded
- `AUTH_TOKEN_REUSED` — refresh token replay detected
- `INTEGRATION_ALREADY_LINKED` — platform account in use by another user

HTTP status mapping: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` rate limited.

## Security Measures Summary

| Threat                 | Mitigation                                               |
| ---------------------- | -------------------------------------------------------- |
| Brute force login      | Rate limit + Turnstile after 3 failures                  |
| Credential stuffing    | HIBP check on registration and change                    |
| Session theft          | Refresh rotation + replay detection                      |
| XSS token exfiltration | Access token in memory, refresh in httpOnly cookie       |
| CSRF                   | SameSite=Lax cookie + double-submit on state-changing    |
| Email enumeration      | Constant response on forgot-password regardless of hit   |
| Account takeover       | Revoke all sessions on password change                   |
| Signup spam            | Turnstile + rate limit per IP                            |
| Supply chain           | Dependabot alerts + weekly updates, pnpm lockfile freeze |

## Implementation Phases

### Phase 1 — Foundation

- Prisma schema for User, tokens, PlatformIntegration
- PostgreSQL via Docker Compose (local dev)
- First migration applied
- NestJS bootstrap: app module, config module (Zod env validation), Pino logger, health endpoint

### Phase 2 — Email Authentication

- `AuthModule` scaffold: service, controller, guards
- Register + email verification (Resend integration)
- Login with refresh rotation
- Forgot/reset password
- Rate limiting via `@nestjs/throttler` + Redis
- Turnstile verification service

### Phase 3 — OAuth

- Google strategy (`passport-google-oauth20`)
- Apple strategy (custom, using `apple-signin-auth`)
- Account linking logic (email match flow)

### Phase 4 — Frontend

- Landing page (public marketing home)
- Auth pages: login, register, verify-email, forgot-password, reset-password
- Auth state (Zustand) + axios interceptor for token refresh
- Onboarding flow (username selection after first sign-in)

### Phase 5 — Platform Integrations

- `IntegrationsModule` with Steam strategy
- Steam OpenID verification
- Bull Queue setup (Redis backend)
- Library sync worker (separate job)

## Technical Stack

- **Runtime:** Node.js 22, NestJS (Fastify adapter)
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Cache / Queue:** Redis 7, BullMQ
- **Validation:** Zod (shared between backend and frontend)
- **Password hashing:** bcrypt (cost 12)
- **JWT:** HS256, `jsonwebtoken` or NestJS `@nestjs/jwt`
- **Email:** Resend (transactional)
- **CAPTCHA:** Cloudflare Turnstile
- **HIBP:** k-anonymity API (no key required)
- **OAuth:** `passport-google-oauth20`, `apple-signin-auth`, custom Steam OpenID verifier

## Open Questions

Not blockers for Phase 1 but worth revisiting:

- **GDPR / account deletion:** soft delete with retention window, or hard delete on request?
- **Export user data:** JSON bundle endpoint for data portability
- **Audit log:** which auth events to log (login success/fail, password change, OAuth link/unlink)
- **Suspicious login detection:** notify on new device, new country
- **Sign-in with Apple on Web vs iOS:** separate client IDs, shared account

## References

- NIST SP 800-63B — Digital Identity Guidelines
- OWASP Authentication Cheat Sheet
- RFC 6749 — OAuth 2.0
- RFC 7519 — JWT
- Apple Sign-In REST API docs
- Steam Web API OpenID documentation
