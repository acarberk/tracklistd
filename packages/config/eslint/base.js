import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
const baseConfig = [
  // Global ignore listesi — tüm config'lere otomatik uygulanır
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.js.map',
    ],
  },

  // TypeScript dosyaları için ana kural seti
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // typescript-eslint v8: tsconfig.json'u otomatik bulur, hardcode gerekmez
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript strict kuralları — tip güvenliği maksimum
      ...tsPlugin.configs['strict-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,

      // Biraz fazla verbose olan strict kuralları kapat
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Kritik kurallar
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Type import'ları ayrı tut: import type { Foo } from './foo'
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // _prefix ile başlayan kullanılmayan değişkenlere izin ver
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Import sıralaması: builtin → external → internal → parent → sibling
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'warn',

      // Genel kurallar
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },

  // Prettier SON SIRADA olmalı — ESLint'in formatting kurallarını kapatır
  prettierConfig,
];

export default baseConfig;
