/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'chore',
        'docs',
        'style',
        'refactor',
        'test',
        'perf',
        'ci',
        'revert',
        'build',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
  },
};

export default config;
