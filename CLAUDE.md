# Game Vault — CLAUDE.md

Bu dosya Claude Code'un proje hafizasidir. Her oturumda otomatik okunur.

---

## Proje Vizyonu

**Game Vault**, oyuncular icin Letterboxd benzeri bir platform. Oyun koleksiyonu takibi, achievement tracking, sosyal karsilastirma ve AI destekli oyun kesfi sunar.

**Temel fark yaratacak ozellikler:**
- Backloggd'un toplulugu + Exophase'in achievement sync'i + native mobil = bos nis
- Steam/PSN/Xbox otomatik sync (rakiplerde yok veya paywalled)
- Ucretsiz temel ozellikler (GG uygulamasi her seyi $4.99/ay arkasina koyuyor)
- Turkce dil destegi (45M Turk oyuncusu, hicbir rakipte Turkce yok)

---

## Tech Stack

### Frontend
- **Next.js 15 + React 19**
- SSR/SSG ile SEO ve performans
- Server Components ile daha az client JS
- React Native ile mobil geçiş kolaylığı
- **Data Fetching:** TanStack Query + Axios (cache, retry, optimistic updates)
- **State Management:** Zustand (minimal, Provider-free)
- **Forms:** React Hook Form + Zod (zodResolver)
- **Validation:** Zod (shared schemas — BE ile aynı)

### Backend
- **NestJS + TypeScript + Fastify adapter**
- Full-stack TypeScript (FE ile shared types)
- Modüler mimari: Guard, Interceptor, Pipe
- Built-in WebSocket (gamification real-time)
- Bull Queue (Steam/PSN/Xbox async sync jobs)
- Swagger/OpenAPI otomatik docs (@nestjs/swagger)
- Test: Jest + Supertest + DI mock
- **Validation:** Zod (shared schemas — FE ile aynı)
- **Logging:** Pino (Fastify native, JSON log)
- **Config:** @nestjs/config + Zod env validation

### Veritabanı
- **PostgreSQL** — Ana veritabanı (ilişkisel veri + JSONB esnek metadata)
- **Redis** — Cache, session, leaderboard (sorted sets), Bull Queue backend, Pub/Sub

### Deployment
- **Vercel** — Next.js frontend hosting (ücretsiz tier, git push = deploy)
- **Railway** — NestJS backend + PostgreSQL + Redis hosting (~$5-15/ay)

### Auth
- **JWT + Passport.js** — Access + Refresh token, stateless auth
- OAuth: Steam, Google, Discord login (Passport stratejileri)
- NestJS Guard sistemi ile route bazlı yetkilendirme

### Mobil
- MVP kapsamında değil. İleride React Native + Expo planlanıyor (React bilgisi transferi)

### Styling
- **Tailwind CSS + shadcn/ui** — Utility-first CSS + hazır özelleştirilebilir componentler
- Dark mode desteği, Radix UI erişilebilirlik temeli

### ORM
- **Prisma** — Type-safe ORM, otomatik migration, Prisma Studio görsel DB yönetimi

### Test
- **Backend:** Jest + Supertest — her modül unit + integration test
- **Frontend:** Vitest + Testing Library — hook ve component testleri
- **Shared:** Zod şema unit testleri
- **E2E:** Playwright — v1.1'de kritik akışlar (register → login → oyun ekle)
- Strateji: Kapsamlı — tüm modüller test edilecek (~%70 coverage hedefi)

### Monorepo
- **Turborepo** — Basit config, hızlı build cache, Next.js ekosistemi ile uyumlu
- Yapı: `apps/` (web, api, mobile) + `packages/` (shared, ui, config)

### Git & CI/CD
- **Branching:** Trunk-Based Development (kısa ömürlü feature branch, sık merge, feature flag)
- **CI/CD:** GitHub Actions (lint, type check, test, build — her PR'da otomatik)
- **Deploy:** Main'e merge = otomatik deploy (Vercel + Railway)
- **Commit:** Conventional Commits (commitlint + Husky pre-commit hook)
- **Branch naming:** `feature/`, `fix/`, `chore/`, `docs/`, `refactor/` + kebab-case

---

## Rakip Analizi (Tamamlandı)

### Ana Rakipler
| Rakip | Güçlü Yön | Kritik Eksik |
|-------|-----------|-------------|
| **Backloggd** (650K+ kullanıcı) | En büyük topluluk, review/liste sistemi | Mobil yok, sync yok, achievement yok |
| **GG** ($4.99/ay) | Tek native mobil app | Agresif paywall, sync sınırlı |
| **Exophase** | En kapsamlı achievement tracker (10+ platform) | Koleksiyon yönetimi/review yok, eski UI |
| **HowLongToBeat** | Oyun süre veritabanı (sektör referansı) | Tracker olarak zayıf, mobil bozuk |
| **Infinite Backlog** (€6/ay Legend) | En kapsamlı tracker: Steam/PSN/Xbox/GOG sync, achievement, play log/session, XP/level, custom tags, progress bar | Küçük topluluk, mobil yok, gamification basit, UI çekici değil |
| **Grouvee** | Sınırsız özel raf sistemi ($10/yıl) | Eski UI, sadece Steam import |

### Veri Kaynağı
- **RAWG API** — 500K+ oyun veritabanı (genre, platform, Metacritic, screenshot, achievement)

### Pazar Boşlukları (Game Vault Fırsatları)
1. **Mobil + Web birlikte ücretsiz** — Backloggd web-only, GG mobil paywalled
2. **Ücretsiz otomatik sync** — Rakipler premium'a koyuyor
3. **Koleksiyon + Achievement birlikte** — Backloggd'da achievement yok, Exophase'de koleksiyon yok
4. **Gamification** — Hiçbir rakipte Duolingo seviyesinde gamification yok
5. **Türkçe dil desteği** — 45M Türk oyuncusu, sıfır rakipte Türkçe
6. **Ücretsiz temel deneyim** — GG her şeyi paywall arkasına koyuyor

---

## Oyuncu Beklentileri (Tamamlandı)

### Hedef Kitle Segmentleri
1. **Backlog Yöneticisi** (Ana hedef) — 100+ oyunu var, takip edemiyor, otomatik sync istiyor
2. **Achievement Hunter** — Platinum/completion peşinde, cross-platform achievement takibi
3. **İstatistik Meraklısı** — Detaylı stats, yıllık özet, genre analizi
4. **Sosyal Oyuncu** — Arkadaş aktivitesi, karşılaştırma, ortak oyun keşfi

### Kritik Pain Points
1. **Retention krizi** — İlk hafta heyecan, 1 ay sonra bırakma (tüm tracker'larda)
2. **Mobil uygulama eksik** — Çoğu kişi telefondan takip etmek istiyor
3. **Elle ekleme zahmetli** — 500+ oyun kütüphanesi tek tek eklenemez
4. **Agresif paywall** — GG'nin $4.99/ay modeli kullanıcı kaybettiriyor
5. **Gamification yok** — Tracker'lar "sıkıcı araç" olarak kalıyor

### Retention Çözümü: Gamification (Duolingo + Strava modellerinden)
- Streak sistemi → +60% bağlılık (Duolingo referans)
- Liga leaderboard → +25% aktivite (Duolingo referans)
- Sosyal kudos → %80 retention 9 hafta (Strava referans)

---

## Gamification Tasarımı (Tamamlandı)

### Mekanikler
1. **Streak** — Günlük katkı serisi (freeze, shield, milestone, recovery, wager)
2. **XP** — Oyun ekle (10), review (30), achievement (5), bitirme (25), kudos (2)
3. **Level** — Logaritmik eğri: Level 1 (0 XP) → Level 50 (175K XP), unvanlar
4. **Liga** — Haftalık: Bronze → Silver → Gold → Diamond → Champion (30 kişi, terfi/düşüş)
5. **Rozetler** — Koleksiyon/Achievement/Streak/Topluluk/Gizli kategorileri, nadirlik sistemi
6. **Challenge** — Haftalık/aylık/topluluk/kişisel zorluklar
7. **Sezon** — 3 aylık sezonlar, özel rozetler (FOMO)

### Kırmızı Çizgi: Gamification HER ZAMAN ücretsiz (retention = büyüme = premium dönüşüm)

---

## Monetization (Tamamlandı)

### Free vs Premium
**Game Vault Free (Ücretsiz):**
- Sınırsız oyun ekleme, durum takibi, 1-10 puan
- Steam/PSN/Xbox sync (günde 1 kez)
- Tüm gamification (streak, XP, level, leaderboard, rozetler)
- Review, arkadaş, activity feed, 5 liste
- Minimal banner reklam

**Game Vault Pro ($3.99/ay veya $29.99/yıl):**
- Reklamsız
- Gerçek zamanlı sync (anlık)
- Gelişmiş istatistikler + yıllık özet (Wrapped)
- Sınırsız liste + şablonlar
- Özel profil temaları, animasyonlu çerçeveler
- Streak Shield (haftada 3 gün koruma)
- Özel premium rozet seti (kozmetik)
- Veri export (CSV/JSON)

### Ek Gelir Kaynakları
- **Affiliate** — Oyun satış yönlendirme komisyonu (Humble Bundle vb.)
- **Promoted Games** — İndie geliştiriciler için sponsorlu keşfet alanı
- **Kozmetik Mağaza** — Profil temaları, çerçeveler ($0.99-$1.99)
- **Year in Review Sponsorluk** — Wrapped görsellerde sponsor logosu
- **API Lisansı** — v2+ için B2B veri satışı

---

## MVP Kapsamı — Dengeli MVP (v1.0)

### Auth & Kullanıcı: Email + Steam OAuth + JWT + Profil sayfası/düzenleme + Şifre sıfırlama
### Koleksiyon: RAWG API arama + ekleme + durum (5 kategori) + puan (1-10) + review + liste (5) + filtre
### Steam Sync: Hesap bağlama + kütüphane sync + playtime + achievement (Bull Queue async)
### Gamification: XP + Level (logaritmik) + Streak (freeze + milestone)
### Sosyal: Arkadaş takip + activity feed
### Stats: Temel istatistikler (oyun sayısı, genre/platform dağılımı, oyun süreleri)
### Sayfalar: Ana sayfa + oyun detay + profil (public) + koleksiyon
### Altyapı: i18n (TR/EN) + dark/light mode + SEO (SSG) + rate limiting + error handling

### Yol Haritası
- **v1.1** (MVP+1-2 ay): Liga/Leaderboard, Rozetler, Challenge, Premium/Stripe, Google/Discord OAuth, Kudos, Gelişmiş stats
- **v1.2** (v1.1+2-3 ay): PSN/Xbox sync, Sezonluk sistem, Kozmetik mağaza, Year in Review, Arkadaş karşılaştırma

---

## UI/UX Tasarımı (Tamamlandı)

### Sayfalar
- Ana Sayfa (giriş yok: hero + popüler + CTA / giriş var: streak + feed + challenge + oynuyorum)
- Oyun Detay (kapak, meta, koleksiyon kontrol, achievement, review, benzer oyunlar)
- Profil (banner, avatar, level, streak, rozet vitrini, stats, aktivite, top oyunlar)
- Koleksiyon (grid/list, durum sekmeleri, filtre, sıralama, listeler)
- Keşfet (arama, genre/platform filtre, trend, en yüksek puan, kişisel öneriler)
- Ayarlar (profil, platform bağlantıları, tema/dil, bildirimler, güvenlik, premium)
- Giriş/Kayıt (Steam OAuth + email/şifre, minimal)

### Mobil Navigasyon: Bottom Tab Bar
- 🏠 Ana | 🔍 Keşfet | ➕ Hızlı Ekle | 📚 Koleksiyon | 👤 Profil
- ➕ ortada = ana aksiyon (streak koruma) — Instagram/Duolingo modeli

### Kritik Akışlar
1. Kayıt → Onboarding (platform seç → Steam bağla → sync → ilk puan) → Streak başlar
2. Günlük kullanım: Uygulama aç → streak/challenge gör → 30sn'de aksiyon → XP kazan
3. Oyun keşfi: Arama/keşfet → detay → koleksiyona ekle → durum/puan → XP
4. Steam sync: Ayarlar → bağla → arka plan sync → bildirim "127 oyun sync edildi!"

---

## Tüm Kararlar Tamamlandı ✅

1. ~~Rakip Analizi~~ ✅
2. ~~Oyuncu Beklentileri~~ ✅
3. ~~Fark Yaratan Özellikler~~ ✅
4. ~~Feature Listesi + MVP Kapsamı~~ ✅
5. ~~Gamification Tasarımı~~ ✅
6. ~~UI/UX Tasarımı~~ ✅
7. ~~Monetization~~ ✅

---

## Uygulama Sahibi İsteği

### Öğretme Yaklaşımı (HER KOD YAZIMINDA UYGULANACAK)
- **Adım adım ilerle** — küçük, anlaşılır parçalar halinde kod yaz
- **5N1K açıklaması** — her kod bloğu için:
  - **Ne:** Bu kod ne yapıyor?
  - **Neden:** Neden bu şekilde yazdık?
  - **Nasıl:** Nasıl çalışıyor (mekanizma)?
  - **Nerede:** Projede nereye oturuyor?
  - **Ne zaman:** Ne zaman çalışır/tetiklenir?
  - **Alternatifler:** Başka nasıl yazılabilirdi? Neden bu yöntemi tercih ettik?
- **Terim açıklaması** — her yeni teknik terimi ilk kullanımda açıkla
- **Kısa kod blokları** — büyük dosyaları parça parça yaz, her parçayı açıkla, review'a sun
- **Quiz/Challenge** — uygun yerlerde küçük quizler veya mini challenge'lar ver
- Proje amacı: hem ürün çıkarmak hem öğrenmek — ikisi birlikte

### Kod Kalitesi Standartları (ZORUNLU)

#### SOLID Prensipleri
- **S — Single Responsibility:** Her dosya, her fonksiyon, her class TEK bir iş yapar
- **O — Open/Closed:** Yeni özellik eklerken mevcut kodu değiştirme, genişlet
- **L — Liskov Substitution:** Alt tipler, üst tiplerin yerine geçebilmeli
- **I — Interface Segregation:** Küçük, spesifik interface'ler (büyük şişkin interface yok)
- **D — Dependency Inversion:** Somut sınıflara değil, soyutlamalara (interface) bağlan

#### React / Next.js Best Practices
- **Thinking in React:** UI'ı component hiyerarşisine böl → state'i minimal tut → veri yukarıdan aşağıya aksın
- **Server Components öncelikli:** Mümkün olan her yerde Server Component kullan, "use client" sadece gerektiğinde
- **Composition over Inheritance:** Component'ları composition ile birleştir, inheritance kullanma
- **Custom Hook'lar:** Tekrarlanan logic'i custom hook'lara çıkar
- **Colocate related code:** İlgili dosyalar birbirine yakın dursun (feature-based folder structure)
- **Key prop:** Liste render'larda her zaman unique ve stable key kullan
- **useCallback/useMemo:** Gereksiz re-render'ları önlemek için gerektiğinde kullan (premature optimization yapma)
- **Error Boundary:** Hata yakalama için Error Boundary pattern'ı uygula

#### NestJS Best Practices
- **Modüler mimari:** Her domain (auth, game, user, sync) kendi modülünde
- **DTO pattern:** Gelen/giden veri için her zaman DTO (Data Transfer Object) kullan
- **Guard/Interceptor/Pipe:** Cross-cutting concern'leri decorator ile çöz
- **Repository pattern:** DB erişimi service katmanında, controller'da DB sorgusu yok
- **Exception Filter:** Global hata yakalama, kullanıcıya tutarlı hata formatı
- **Config validation:** Environment variable'ları Zod ile validate et

#### Güvenlik (EN ÖNCELİKLİ)
- **Input validation:** ASLA kullanıcı girdisine güvenme, her şeyi Zod ile validate et
- **SQL Injection:** Prisma parameterized query kullan, raw SQL'den kaçın
- **XSS koruması:** Kullanıcı girdisini render etmeden önce sanitize et
- **CSRF koruması:** State-changing isteklerde CSRF token kullan
- **Rate limiting:** Tüm API endpoint'lerinde rate limit uygula
- **Helmet:** HTTP header güvenliği (X-Frame-Options, HSTS, vb.)
- **CORS:** Sadece izin verilen origin'lere izin ver
- **Password hashing:** bcrypt ile minimum 10 salt round
- **JWT güvenliği:** Kısa ömürlü access token (15dk), refresh token rotation, httpOnly cookie
- **Environment secrets:** .env dosyası ASLA commit edilmez, .gitignore'da olmalı
- **Dependency audit:** npm audit ile düzenli zafiyet kontrolü
- **Least privilege:** Her servis/kullanıcı sadece ihtiyaç duyduğu yetkiye sahip

#### Genel Kod Standartları
- **TypeScript strict mode:** `strict: true`, `noImplicitAny: true`
- **ESLint + Prettier:** Tutarlı kod stili, otomatik format
- **Naming convention:** camelCase (değişken/fonksiyon), PascalCase (component/class/type), UPPER_SNAKE_CASE (sabit)
- **Meaningful names:** `getUserGames()` evet, `getData()` hayır
- **DRY (Don't Repeat Yourself):** Tekrarlanan kodu shared utility'ye çıkar
- **YAGNI (You Aren't Gonna Need It):** İhtiyaç olmayan kodu yazma, gerektiğinde ekle
- **Early return:** Derin nesting yerine erken return kullan
- **Immutability:** State'i mutate etme, yeni obje/array oluştur
- **Error handling:** try/catch ile hata yakala, kullanıcıya anlamlı mesaj göster
- **Commenting:** Kod "ne" yaptığını kendisi anlatmalı, yorum "neden" yaptığını açıklamalı
- **Git commit:** Küçük, atomik commit'ler, anlamlı commit mesajları