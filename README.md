# Tracklistd

[![CI](https://github.com/acarberk/tracklistd/actions/workflows/ci.yml/badge.svg)](https://github.com/acarberk/tracklistd/actions/workflows/ci.yml)
[![CodeQL](https://github.com/acarberk/tracklistd/actions/workflows/codeql.yml/badge.svg)](https://github.com/acarberk/tracklistd/actions/workflows/codeql.yml)

Unified media tracking platform for games, movies, TV shows, and anime — inspired by Letterboxd and Backloggd.

## Overview

Tracklistd lets users track their media consumption across multiple domains in a single profile. Each media type is a separate module built on shared infrastructure: authentication, gamification, and social features.

Current focus is Phase 1 — game tracking with platform integrations (Steam, PSN, Xbox).

## Tech Stack

**Frontend**

- Next.js 15 (App Router, Server Components)
- React 19
- TanStack Query + Axios for data fetching
- Zustand for client state
- React Hook Form + Zod for forms and validation
- Tailwind CSS + shadcn/ui

**Backend**

- NestJS with Fastify adapter
- TypeScript (strict mode)
- JWT + Passport.js for authentication
- Bull Queue for async jobs (platform sync)
- Pino for structured logging
- Zod for runtime validation

**Data**

- PostgreSQL (primary database)
- Redis (cache, sessions, leaderboard, queue backend)
- Prisma (ORM)

**Infrastructure**

- Turborepo + pnpm workspaces
- GitHub Actions (CI)
- CodeQL (SAST)
- Vercel (frontend hosting)
- Railway (backend and databases)

## Architecture

Monorepo managed by Turborepo and pnpm workspaces.

```
apps/
├── web/          Next.js frontend
└── api/          NestJS backend

packages/
├── config/       Shared TypeScript, ESLint, and Prettier configs
├── shared/       Shared types, utilities, Zod schemas
└── ui/           Shared React components
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10.32+

### Install

```bash
pnpm install
```

### Common Commands

```bash
pnpm turbo run lint         # Lint all packages
pnpm turbo run type-check   # TypeScript check
pnpm turbo run test         # Run tests
pnpm turbo run build        # Build all packages
```

Individual package scripts are runnable via `pnpm --filter <package-name> <script>`.

## Code Quality

- TypeScript strict mode across all packages
- ESLint `strict-type-checked` + `stylistic-type-checked`
- Prettier for formatting
- Husky + lint-staged for pre-commit hooks
- Commitlint enforcing Conventional Commits
- Changesets for versioning and changelogs
- CodeQL for static security analysis on every PR

## Project Status

Early development. Infrastructure and tooling are in place; application modules are not yet implemented.

## License

All rights reserved. Source is public for portfolio and transparency purposes. Reuse, redistribution, or derivative works are not permitted without explicit permission.
