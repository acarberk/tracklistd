import libraryConfig from '@tracklistd/config/eslint/library';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...libraryConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
];

export default config;
