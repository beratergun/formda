# berXfit v3 · Güncel doğrulama

31 Ekim 2026: lint/typecheck ve 217 birim testi geçti. Domain kapsamı: satır %99,85; fonksiyon %100; dal %97,03; ifade %99,11. Ayrıntılı mevcut sonuçlar ve test edilmeyen cihazlar [berXfit test raporunda](BERXFIT_TEST_REPORT.md). Son tam E2E, WCAG 2.2, Lighthouse ve yayın doğrulamaları [yayın kontrolünde](BERXFIT_RELEASE_CHECKLIST.md) kapanmadan v3 yayınlanmış sayılmaz.

Aşağıdaki v2 kayıtları tarihsel tabandır; yeni kod için otomatik başarı kanıtı değildir.

# Formda v2 · Kalite doğrulaması

Tüm uygulama kayıtları ve tanıtım silüetleri kurgusaldır. Ham tarayıcı raporları `docs/qa/` altında yerel tutulur. Model değerlendirmesinde kullanılan herkese açık Food101 fotoğrafları da bu ignored klasördedir; repoya eklenmez.

| Kontrol                                   | Yerel sonuç / kapsam                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| ESLint / strict TypeScript / üretim build | Yerel ve CI son kapı geçti                                                                                          |
| Vitest                                    | 140 test: hesaplar, Türkçe ayrıştırma, plan, alternatifler, kaynaklar, enerji, izin hataları, eski veri ve depolama |
| Domain kapsamı                            | Satır %100 · fonksiyon %100 · dal %97,37 · ifade %99,67                                                             |
| Playwright                                | Pixel 7/Chromium ve iPhone 14/WebKit: 18/18; yeni model/kalıcı profil değişikliğinin 4 testi ayrıca geçti           |
| Erişilebilirlik                           | Açık/koyu temada 26 WCAG A/AA görünümünde sıfır ihlal                                                               |
| Mobil Lighthouse                          | CI ve canlı 100/100/100; yerel Windows 96/100/100; v1 tabanı korunur                                                |
| Görsel QA                                 | Playwright MCP, 390×844 ve 412×915, iki tema; kaynak/öğün/plan/rehber akışları, taşma ve konsol kontrolü            |
| Gerçek yemek modeli                       | 10 ayrı Food101 sınıfında 10/10 ilk üç; yeni worker çevrimdışı çalıştı; ağ yazımı yok                               |
| Veri koruma                               | Tarihsel kcal, favoriler, özel tarifler, yeni profil/sağlık alanları ve medya baytları yedek gidiş dönüşünde eşit   |
| Android                                   | Gradle/lint, beş salt okuma izni, APK Signature v2 ve son release SHA-256 doğrulandı                                |
| Sunum                                     | 22 ekran, 24 saniye GIF, 1280×640 sosyal görsel, 7 carousel; TR 193 / EN 218 kelime                                 |

Lighthouse performansı cihaz ve çalışma yüküyle değişir. Script artık eski yayın tabanı olan 96/100/100 altını başarısız sayar. Model ölçümü küçük bir smoke değerlendirmesidir; Türk mutfağının tamamı için %100 doğruluk iddiası değildir. Model 101 sınıfla sınırlı ve isteğe bağlıdır.

Tarayıcı testleri karşılama, güncel 220 kcal öğün, kalıcı kayıt, çevrimdışı su, set/dinlenme/özet, program/alternatif/hareket değiştirme, alet rehberi, aylık hikâye, fotoğraf/vlog ve tam ZIP geri yüklemeyi kapsar. Health Connect yokluğu, salt okuma çağrıları ve ret/kısmi hata birimlerde; PWA güvenli devam E2E'de doğrulanır.

Fiziksel Android Health Connect izin paneli ve gerçek veri sağlayıcıları bu masaüstü oturumunda denenmedi. Windows WebKit sonucu fiziksel iPhone testi değildir. İşletim sistemi kurulum, kamera ve paylaşım panelleri telefonda doğrulanmalıdır. Release anahtarı kullanıcıya aittir; Secrets yoksa APK geliştirme sertifikalıdır.

## Tekrar çalıştırma

```sh
npm ci
npm run lint && npm run typecheck && npm run test && npm run build
npm run test:coverage
npx playwright install chromium webkit
npx playwright test
# Ayrı terminalde: npm run preview -- --port 4173
node scripts/a11y.mjs
node scripts/lighthouse.mjs
node scripts/evaluate-food-model.mjs
node scripts/check-docs.mjs
node scripts/check-presentation.mjs
npm run android:sync
node scripts/check-apk.mjs /path/to/Formda-v2.0.0.apk
```

Lighthouse 13'te PWA kategorisi yerine manifest, maskable ikon, service worker, Chrome kurulabilirlik denetimi ve çevrimdışı yeniden açılış ayrıca sınanır. Son canlı/CI sonuçları [yayın kontrolünde](release-check.md) kaydedilir.
