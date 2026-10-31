# BERxFIT · Uygulama sırası

Her aşama sonunda lint, typecheck, birim ve build; ilgili mobil E2E, Playwright MCP görsel QA ve kısa rapor. Owner kimliği ve boş trailer korunur. Önceki özellikler kaldırılmaz; yeni kaynaklar veya entegrasyonlar çalışıyormuş gibi gösterilmez.

1. **P0 sayısal giriş ve kayıt güvenliği:** tüm sayı alanlarını denetle; ham taslak, locale parse, boş/sıfır/negatif/sınır/NaN/Infinity/üstel ve geçersiz yapıştırma; commit engeli. Önce gerçek hatayı belgeleyen regresyonlar, sonra düzeltme.
2. **BERxFIT marka ve sistem:** sağlanan orijinal rasterı koru; boş şeffaf alan dışında kırpma yok; maskable/adaptive güvenli alan. Dark-first graphite/navy, blue/cyan kontrol renkleri, yeşil marka/başarı. Ortak kart, hata, alan, navigasyon, grafik ve motion durumları. Açık tema korunur.
3. **Günlük/nutrition UX:** sık işlemleri kısalt; gerçek verili kompakt dashboard, makro ve haftalık/kilo özetleri; mevcut öğün düzenle/kopyala, özel besin ve doğrulanmış porsiyon akışı.
4. **Antrenman/rehber:** duraklat/devam/iptal, kesintiden dönüş; hareket ekle/çıkar/sırala; çekirdek 10 hareketin teknik pozları, hız/oynat/duraklat/yeniden başlat ve statik fallback. Lisanslı dış medya veya ağır 3D motor varsayma.
5. **İlerleme/habit ve sağlamlaştırma:** su kayıt geçmişi ve düzeltme, güvenli kilo silme/düzenleme, gerçek veri ve boş grafikler, hedef/kişiselleştirme; desteklenen hatırlatmaları koru. Eklentili AI coach/cloud/GPS gibi dış bağımlı P3 özellikler eklenmiş sayılmaz.
6. **Tam kalite ve teslim:** 320/360/390/412/430/768/1024/desktop; iki tema, tüm ikincil ekranlar, keyboard ve reduced motion; WCAG, offline, yedek, eski veri; native build/manifest/imza. README, görsel/demo, migration ve test/limit raporları. Yayın doğrulanmadan release tamamlandı denmez.

PWA veri alanları, mevcut Android appId ve keystore kimliği korunur. Repo/base yol değişimi gerekiyorsa redirect, manifest/scope ve eski release bağlantıları birlikte doğrulanır. Mevcut v1/v2 release'leri ve varlıkları silinmez/üzerine yazılmaz. Yeni major aday 3.0.0; önce yerel ve CI release kapıları.

31 Ekim son durum: Faz 1–5 tamamlandı. Faz 6 PWA yayını ve canlı 100/100/100 doğrulaması tamamlandı; 217 uygulama + 7 imza kapısı testi, 32 mobil E2E, 56 Axe ve gerçek v2 PWA güncellemesi iki motorda doğrulandı. Native build/lint/metadata/izin kontrolleri geçti. Birleşik v3 APK/release, gerçek X509 sertifika farkı nedeniyle eski keystore veya ayrı kurulum kararı bekliyor; tüm çalışma bu engelle birlikte milestones/test/migration belgelerinde kayıtlı.
