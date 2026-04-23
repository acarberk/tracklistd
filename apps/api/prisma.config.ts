import 'dotenv/config';

import { join } from 'path';

import { defineConfig } from 'prisma/config';

const isGenerate = process.argv.includes('generate');

const connectionString =
  process.env.DATABASE_URL ??
  (isGenerate ? 'postgresql://placeholder:placeholder@localhost:5432/placeholder' : undefined);

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

export default defineConfig({
  schema: join('prisma', 'schema.prisma'),
  migrations: {
    path: join('prisma', 'migrations'),
  },
  datasource: {
    url: connectionString,
  },
});
