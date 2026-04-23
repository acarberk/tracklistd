import 'dotenv/config';

import { join } from 'path';

import { defineConfig } from 'prisma/config';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: join('prisma', 'schema.prisma'),
  migrations: {
    path: join('prisma', 'migrations'),
  },
  datasource: {
    url: connectionString,
  },
});
