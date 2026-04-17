import nestjsConfig from '@tracklistd/config/eslint/nestjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nestjsConfig,

  // Bu app'in tsconfig'ini doğru yere yönlendir
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
];

export default config;
