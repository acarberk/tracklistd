import libraryConfig from '@tracklistd/config/eslint/library';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM'de __dirname yok — import.meta.url üzerinden elde ediyoruz
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...libraryConfig,

  // Bu paketin tsconfig'ini doğru yere yönlendir
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
