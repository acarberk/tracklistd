import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

import baseConfig from './base.js';

/** @type {import("eslint").Linter.Config[]} */
const nextjsConfig = [
  ...baseConfig,

  // React + browser ortamı
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        // node_modules'dan React versiyonunu otomatik algıla
        version: 'detect',
      },
    },
    rules: {
      // React 17+ JSX transform: artık her dosyada `import React` gerekmez
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // React overrides
      'react/prop-types': 'off', // TypeScript zaten tipleri kontrol eder
      'react/display-name': 'warn',
      'react/no-unescaped-entities': 'off', // JSX text'te ' " gibi karakterlere izin ver
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Next.js App Router Server Components: async olabilir ama await olmayabilir
  {
    files: ['**/app/**/*.ts', '**/app/**/*.tsx'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Server-side dosyalarda console kullanımına izin ver
  {
    files: ['**/app/**/*.ts', '**/pages/**/*.ts', '**/server/**/*.ts', '**/middleware.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default nextjsConfig;
