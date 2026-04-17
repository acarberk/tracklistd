import globals from 'globals';

import baseConfig from './base.js';

/** @type {import("eslint").Linter.Config[]} */
const nestjsConfig = [
  ...baseConfig,

  // NestJS backend dosyaları
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // NestJS decorator'ları metadata üretir — strict-type-checked false positive verir
      // Bu kurallar "error" yerine "warn" olarak ayarlandı
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Backend'de Pino logger kullanılır ama console de açık kalsın (dev/debug)
      'no-console': 'off',

      // NestJS DI: constructor(private readonly service: SomeService) {} — boş constructor gerekli
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },

  // Test dosyaları için tüm strict kuralları gevşet
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off',
    },
  },
];

export default nestjsConfig;
