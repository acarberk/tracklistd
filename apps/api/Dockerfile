# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH \
    COREPACK_DEFAULT_TO_LATEST=0 \
    HUSKY=0
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY packages/config packages/config
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY turbo.json ./
RUN pnpm --filter @tracklistd/shared build \
 && pnpm --filter @tracklistd/api exec prisma generate \
 && pnpm --filter @tracklistd/api build \
 && pnpm --filter @tracklistd/api deploy --prod --legacy /out \
 && cp -RT apps/api/dist /out/dist \
 && cp -RT apps/api/prisma /out/prisma \
 && SRC_PRISMA=$(find /repo/node_modules/.pnpm -maxdepth 4 -type d -name '.prisma' -print -quit) \
 && DST_PRISMA_DIR=$(find /out/node_modules/.pnpm -maxdepth 3 -type d -name '@prisma+client@*' -print -quit) \
 && test -n "$SRC_PRISMA" && test -n "$DST_PRISMA_DIR" \
 && cp -R "$SRC_PRISMA" "$DST_PRISMA_DIR/node_modules/.prisma"

FROM node:${NODE_VERSION}-bookworm-slim AS runner
ENV NODE_ENV=production \
    PORT=3001
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --no-create-home nodejs
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /out ./
USER nodejs
EXPOSE 3001
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
