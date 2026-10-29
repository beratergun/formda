# Kilometre taşı 1 kontrolü

- React 18, strict TypeScript, Vite, Tailwind, ESLint, Prettier ve Vitest kuruldu.
- Pages için `/yol/` tabanı, hash yönlendirme, manifest, maskable ikonlar, yerel fontlar ve güncelleme bildirimi hazır.
- Kart, halka, düğme, segment, stepper, dialog sheet, boş durum ve iskelet bileşenleri eklendi.
- Playwright MCP: 390×844 ve 412×915, açık/koyu tema. Yatay taşma yok. Hızlı ekle dialog aç/kapat ve sekme geçişi geçti. Konsolda hata/uyarı yok.
- Tailwind sınıf adı çakışması halka üzerinde gereksiz çerçeve oluşturdu; bileşen sınıfı özelleştirildi.
- Henüz uygulanmamış kayıt, antrenman, medya ve yedek akışları sonraki kilometre taşlarında doğrulanacak.
- Geliştirme bağımlılıkları denetlendi; Vitest ve sharp güvenlik düzeltmeli sürümlere yükseltildi. Workbox zincirindeki dört düşük önem düzeyli uyarı, henüz düzeltilmiş deepmerge sürümü bulunmadığından izleniyor. Üretim bağımlılıklarında uyarı yok.
