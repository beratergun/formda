# Uygulama ilerlemesi

| #   | Kapsam                                                     | Durum                                                                                                                                       |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | İskelet, araçlar, CI, tasarım tokenları, UI kiti           | Tamamlandı                                                                                                                                  |
| 2   | Saf domain fonksiyonları ve testler                        | Tamamlandı                                                                                                                                  |
| 3   | Dexie, OPFS, yedek / geri yükleme                          | Tamamlandı                                                                                                                                  |
| 4   | Karşılama, Bugün, beslenme                                 | Tamamlandı                                                                                                                                  |
| 5   | Antrenman ve hareket kütüphanesi                           | Tamamlandı                                                                                                                                  |
| 6   | Fotoğraf ve karşılaştırma                                  | Tamamlandı                                                                                                                                  |
| 7   | Vlog, Günlük, raporlar                                     | Tamamlandı                                                                                                                                  |
| 8   | İlerleme ve Planım                                         | Tamamlandı                                                                                                                                  |
| 9   | Profil, gizlilik, ICS, eski veri aktarımı                  | Tamamlandı                                                                                                                                  |
| 9b  | Uygulama yükleme deneyimi, Capacitor Android, APK iş akışı | Tamamlandı: gerçek APK, Android lint ve apksigner CI doğrulandı                                                                             |
| 10  | E2E, erişilebilirlik, performans                           | Tamamlandı: 95 birim, 8 E2E, iki temada 18 WCAG görünümü, mobil Lighthouse 96/100/100                                                       |
| 11  | README ve görseller                                        | Tamamlandı: iki dil, iki kurulum düğmesi, 16 demo ekranı, telefon kolajları, 6 kare GIF, sosyal önizleme ve yayın belgeleri; 95 birim testi |
| 12  | GitHub Pages ve v1.0.0                                     | Tamamlandı                                                                                                                                  |
| 13  | LinkedIn ve CV paketi                                      | Tamamlandı                                                                                                                                  |

## Formda v2 (30 Ekim 2026)

- A — Yerel marka/veri/Android çalışması tamamlandı; 96 birim, 8 E2E, 18 Axe görünümü, Lighthouse 99/100/100. Repo formda olarak yeniden adlandırıldı. Pages/Android CI başarılı, canlı uygulama HTTP 200 ve çevrimdışı veri doğrulandı. Eski adres yönlendirmesi yayında. Commit 28a4b09.
- F — Tamamlandı. v2.0.0 yayınlandı; son doğrulama aşağıda.

- B — Koç ana ekranı, ortak tasarım, motivasyon galerileri ve paylaşılabilir aylık hikâyeler uygulandı. 96 birim, 10 E2E, 18 Axe görünümünde sıfır ihlal ve Lighthouse 100/100/100; tamamlandı. Sıradaki aşama C.

- C — Altı program, güne özel üç alternatif ve hareket değiştirme uygulandı. 125 birim, iki yeni mobil program E2E, lint/typecheck/build, 18 Axe görünümü ve %99,79 domain satır kapsamı yeşil. 12/12 tam regresyon geçti. Aynı hareketin yinelenmesini önleyen son düzeltmenin iki mobil E2E ve 29 domain testi de doğrulandı. Tamamlandı; sıradaki aşama D.

- D — 159 hareket, 34 alet, ayrıntılı rehber, iki vektör poz ve döngü, alet ekranından programa ekleme tamamlandı. 127 birim, iki mobil alet E2E, lint/typecheck/build ve 22 Axe görünümü geçti. Son iki mobil alet E2E ve reduced-motion poz döngüsü kontrolü geçti. Tamamlandı; sıradaki aşama E.

- E — 619 kayıt denetimi, 797 yiyecek/160 tarif, MET/adım enerji tahmini, isteğe bağlı hedef yüzdesi, Android beş kategoride salt okuma ve PWA elle kayıt tamamlandı. 140 birim, 18 tam E2E, son model/kalıcı kayıt değişikliğinin 4 mobil E2E testi ve 26 Axe görünümü geçti; lint/typecheck/build yeşil. Lighthouse 97/100/100. Gerçek model 10 ayrı Food101 sınıfında 10/10 ilk üç ve yeni worker ile çevrimdışı testi geçti; ağ yazımı yok. Fiziksel Android Health Connect izinleri henüz telefonda denenmedi. Sıradaki F: v2.0.0 sürümü, tanıtım görselleri, tam yayın kapısı, Pages/APK CI ve release.

- F tamamlandı — Kaynak commit 3b21296, etiket/release v2.0.0. Pages CI 41012177668, push APK CI 41012177729 ve release APK CI 41012891384 başarılı. 140 birim, 18 E2E, 26 Axe; CI ve canlı Lighthouse 100/100/100. Canlı HTTP 200, kurulabilirlik ve çevrimdışı kayıt; eski adres yönlendirmesi doğrulandı. Son APK/PWA ZIP tekrar indirilip SHA-256 ile eşleşti; Formda appId/sürüm, yalnızca beş sağlık READ izni ve WRITE yokluğu doğrulandı. Yeni TR/EN README, 22 ekran, 24 saniye GIF ve ../formda-launch içindeki yedi carousel/metin/senaryo/CV/profil eki hazır. v1.0.0 notuna v2 bağlantısı eklendi. Otomatik iş kalmadı. Kullanıcının işleri: sosyal önizleme, profil sabitleme, isteğe bağlı imza Secrets ve fiziksel telefon izin/veri denemeleri. Detay: docs/qa-stage-f.md.

## BERxFIT geliştirmesi

- Faz 0: yeni iki şartname ve logo alındı; Formda 6b3dcd8 tabanı temiz. Lint/typecheck/140 birim/build yeşil. Gerçek tarayıcıda 0 silme hatası doğrulandı. Envanter ve uygulama sırası docs/BERXFIT_AUDIT.md ve docs/BERXFIT_IMPLEMENTATION_PLAN.md içinde. Faz 1: ortak sayı girişi, locale doğrulama ve tüm sayı alanlarının taşınmasıyla devam ediliyor. Yeni BERxFIT henüz yayınlanmadı; Android appId/veri anahtarları korunacak.

- BERxFIT Faz 1 tamamlandı: 36 sayı alanı, ham taslak/locale/doğrulama, sabit erişilebilir adlar, kilo basamakları, kısa vlog sınırları ve tekil/gerektiğinde worker başlangıcı düzeltildi. Lint/typecheck/173 birim/build, 20 mobil E2E ve 26 Axe görünümü yeşil. Veri adları/backup biçimi ve geçmiş kayıtlar korundu. Sıradaki Faz 2: orijinal sahip logosu ve dark-first BERxFIT tasarım sistemi, marka varlıkları, kompakt dashboard. Henüz BERxFIT yayını yok.

- BERxFIT Faz 2 sürüyor: orijinal PNG ve türevler, PWA/Android görünen adı, dark-first semantik tema, kompakt kalori/makro kartı ve desktop gezinme uygulandı. İlk 173 birim/lint/typecheck/build yeşil. Açık tema eski puan kartı kontrastı ve eski dashboard E2E seçicisi düzeltildi. Son tam kapı çalışıyor; tamamlanıp commit edilmeden Faz 2 bitti sayılmaz. Sonraki: Faz 3 öğün düzenleme/kopyalama/özel besin ve gerçek haftalık özet. Repo/base henüz formda, yayın yapılmadı.

- BERxFIT Faz 2 tamamlandı: tam kalite kapısı lint/typecheck/173 birim/build, 20/20 E2E ve 26 Axe sıfır ihlal. Orijinal logo hash ve türev ölçüleri tasarım belgesinde. 320–1440 responsive tarayıcı kontrolü yeşil. Sıradaki Faz 3: snapshot üzerinden öğün düzenle/kopyala/sil/geri al, özel besin ve gerçek haftalık özet. BERxFIT henüz yayınlanmadı.
