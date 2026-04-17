import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

import baseConfig from './base.js';

/** @type {import("eslint").Linter.Config[]} */
const libraryConfig = [
  ...baseConfig,

  // TSX/JSX dosyaları için React kuralları (packages/ui component'ları)
  {
    files: ['**/*.tsx', '**/*.jsx'],
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
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Saf TypeScript dosyaları (packages/shared — hem browser hem node'da çalışabilir)
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
];

export default libraryConfig;
