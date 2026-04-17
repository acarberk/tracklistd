/** @type {import('@commitlint/types').UserConfig} */
const config = {
  // Conventional Commits kurallarını temel al
  extends: ['@commitlint/config-conventional'],

  rules: {
    // İzin verilen commit türleri
    'type-enum': [
      2, // 2 = error (ihlalde commit reddedilir)
      'always',
      [
        'feat', // Yeni özellik
        'fix', // Bug düzeltme
        'chore', // Bakım (build, bağımlılık güncellemesi vb.)
        'docs', // Sadece dokümantasyon
        'style', // Kod formatı (mantık değişmez)
        'refactor', // Ne bug fix ne yeni özellik — sadece yeniden yapılandırma
        'test', // Test ekleme/güncelleme
        'perf', // Performans iyileştirmesi
        'ci', // CI/CD konfigürasyon değişiklikleri
        'revert', // Önceki commit'i geri al
        'build', // Build sistemi veya harici bağımlılık değişiklikleri
      ],
    ],

    // Subject (başlık) maksimum 100 karakter
    'header-max-length': [2, 'always', 100],

    // Subject büyük harfle başlamamalı: "Add feature" ❌  "add feature" ✅
    'subject-case': [2, 'always', 'lower-case'],

    // Subject nokta ile bitmemeli: "add feature." ❌
    'subject-full-stop': [2, 'never', '.'],

    // Boş subject yasak
    'subject-empty': [2, 'never'],

    // Scope küçük harf: "feat(Auth)" ❌  "feat(auth)" ✅
    'scope-case': [2, 'always', 'lower-case'],
  },
};

export default config;
