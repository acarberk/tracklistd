import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**', '**/coverage/**'],
  },
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'packages/**/*.ts', 'packages/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      ...tsPlugin.configs['strict-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },
  {
    files: ['apps/web/**/*.tsx', 'apps/web/**/*.jsx', 'packages/ui/**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-console': 'off',
    },
  },
  prettierConfig,
];

export default config;
