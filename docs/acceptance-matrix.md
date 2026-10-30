# Kabul kontrolü

Dağıtım öncesi denetim, yalnızca ekranların açılmasını değil, kayıt ve hesap yollarını da kapsar. A–E sonuçları aşama raporlarındadır; v2 yayın kapısı ayrıca uygulanır.

v2 yerel kapsam: 140 birim testi, iki profilde 18 E2E ve 26 tema/ekran WCAG görünümü. Modelin 10 ayrı sınıfta gerçek ilk üç isabet ve çevrimdışı yeniden açılışı doğrulandı. Kanıtlar [kalite](quality.md), [E raporu](qa-stage-e.md) ve [yayın denetimi](release-check.md) belgelerindedir. Fiziksel Health Connect kaynak/izin paneli ve iPhone kurulum/kamera panelleri masaüstü otomasyonunun kapsamı dışındadır.

| Alan      | Doğrulama                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Beslenme  | 2 yumurta, çiğ tavuk, örnek menü, 40+ Türkçe ayrıştırma; tarif, porsiyon, fotoğraf, kopyalama, açık ürün sorgusu |
| Plan      | Görünen güne deterministik hesap, 4/12 hafta döngüsü, 5 yıl, tüm şablonlar ve düzenleyiciler                     |
| Antrenman | Önceki seans, iki set, kg/tekrar/RPE, dinlenme, çift ilerleme, hacim/rekor/1RM, yüzme/kardiyo                    |
| Fotoğraf  | Başlangıç, kamera, hizalama, sıkıştırma, seçili karelerle karşılaştırma/video, yerel depolama                    |
| Vlog      | Kayıt, yükleme, gerçek kırpma, oynatma, kapak, etiket, 1 saniye montajı ve destek fallback'i                     |
| Rapor     | Günlük/haftalık/aylık, arama, duygu ve hassasiyet, PNG, yazdırma görünümü                                        |
| Asistan   | Gerçek verili günlük mesaj, besin kombinasyonları, trendler, kutlamalar ve güvenlik kuralları                    |
| Veri      | ZIP içeriği ve ikili medya eşitliği, bütünlük, silme, birleştirme, eski JSON, CSV ve ICS                         |
| Uygulama  | PWA kurulabilirlik/çevrimdışı, Android yerel varlıklar/izinler, APK derleme ve imza doğrulaması                  |
| Kalite    | İki telefon/iki tema, klavye, AA kontrast, E2E, %90+ domain kapsamı, Lighthouse eşikleri                         |
| Yayın     | Pages HTTP 200, gerçek APK eki, görseller/README, yazar ve özel dosya kontrolü, tanıtım paketi                   |

| v2 alanı                           | Kanıt                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Programlar ve günlük alternatifler | 29 program domain testi ve iki mobil program E2E; haftalık plan ile gün istisnası ayrıdır                 |
| Aletler ve pozlar                  | 159 hareket/34 alet veri denetimi, iki mobil alet E2E, iki tema Axe rehber kontrolü                       |
| Besin kaynakları                   | 619 denetim sonucu, 35 kaynak eşleşmesi, 160 tarif ve yedi menü toplamı testleri                          |
| Harcanan enerji                    | MET/set/RPE, boy/kilo/adım, kaynak çift sayımı ve hedefe isteğe bağlı yüzde testleri; iki mobil E2E       |
| Sağlık bağlantısı                  | Beş salt okuma tipi, yokluk/ret/kısmi hata, yerel birleştirme ve yinelenen seans testleri; PWA yokluk E2E |
| Fotoğraf önerisi                   | Gerçek Food101 q8 10/10 ilk üç, çevrimdışı yeni worker; iki mobil onay/porsiyon E2E                       |
| Sunum                              | 22 yeni ekran, 24 saniye GIF, 1280×640 sosyal görsel, 7 carousel; TR 193 / EN 218 kelime                  |
