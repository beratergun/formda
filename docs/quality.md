# Kalite doğrulaması

Kayıtlar ve medya testlerde tamamen kurgusaldır. Ham tarayıcı raporları ve ekran görüntüleri `docs/qa/` altında yerel tutulur; repoya yüklenmez.

| Kontrol | Sonuç / kapsam |
|---|---|
| ESLint / strict TypeScript | Geçti |
| Vitest | 94 test; kalori, Türkçe ayrıştırma, plan, puan, projeksiyon, asistan, ICS, eski veri ve depolama |
| Domain kapsamı | Satır %100 · dal %98,14 · fonksiyon %100 · ifade %99,6 |
| Playwright | Pixel 7 / Chromium ve iPhone 14 / WebKit: 8/8 geçti; tüm kayıtlar ve medya baytları yedek gidiş dönüşünde eşit |
| Mobil Lighthouse | Son ölçüm: performans 96 · erişilebilirlik 100 · en iyi uygulamalar 100; yerel üretim derlemesi, mobil profil. Önceki performans ölçümü 98. |
| WCAG otomasyonu | Kurgusal demo ile iki temada 18 görünüm; WCAG A/AA bulgusu yok |
| Görsel QA | 390×844 ve 412×915; açık/koyu tema, taşma ve konsol kontrolleri |
| Android kaynak paketi | `npm run android:sync` geçti; uzak sunucu adresi kullanılmıyor |
| APK | Gradle, Android lint ve imza doğrulaması GitHub Actions yayın aşamasında tamamlanır |

Tarayıcı testleri karşılama, tam 219 kcal öğün, kalıcı kayıt, çevrimdışı su kaydı, iki antrenman seti ve dinlenme sayacı, ilerleme grafiği, Cuma planı, fotoğraf karşılaştırması, vlog oynatma ve tam yedek gidiş dönüşünü kapsar. Kamera akışı ve vlog dosyası çalışma anında üretilir; kişisel veya dışarıdan indirilmiş medya kullanılmaz.

Windows WebKit portunda OffscreenCanvas, canvas.captureStream ve IndexedDB Blob davranışları gerçek iPhone Safari'den farklıdır. Bu portta galeri yükleme ve ikili medya uyumluluk yolu doğrulanır. Fiziksel iPhone/Android kamera izinleri, ana ekran kurulum menüleri ve işletim sistemi paylaşım panelleri masaüstü otomasyonunun yerine geçen fiziksel cihaz sonucu olarak sunulmaz.

## Yeniden çalıştırma

```sh
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install chromium webkit
npx playwright test
npm run preview -- --port 4173
# Ayrı terminalde:
node scripts/a11y.mjs
node scripts/lighthouse.mjs
npm run android:sync
```

Lighthouse puanları cihaz ve çalışma yüküne göre değişebilir; script 90/95/95 altını başarısız sayar. Lighthouse 13'te bulunmayan PWA kategorisi yerine manifest, maskable ikon, etkin service worker, Chrome kurulum denetimi ve çevrimdışı yeniden açılış test edilir. Üretimde ağ yalnızca statik uygulama varlıkları ve kullanıcının açık ürün aramasından oluşur.
