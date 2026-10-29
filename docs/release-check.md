# Yayın denetimi

## İlk dağıtım sırası

Yeni oluşturulan `beratergun/formda` reposunda ilk push öncesinde çalışan Pages yayını bulunamaz. Bu ilk dağıtımda yerel kalite, yazar, özel dosya, README varlıkları ve repo ayarları kontrol edilir; push'tan hemen sonra Pages etkinleştirilir ve gerçek dağıtımın başarısı / HTTP 200 doğrulanır. Release, bu canlı kontrol ve APK derlemesi başarılı olmadan oluşturulmaz. Sonraki push'larda mevcut canlı adres de yayın öncesi denetime dahildir.

Bu sıra, boş repo → ilk push → Pages dağıtımı → canlı doğrulama → release akışını uygulanabilir kılar. İlk dağıtım için canlı kontrol ertelenir; test veya gizlilik kontrolü atlanmaz.

## Kanıtlar

- Commit yazar/committer: Seyid Berat Ergün; ek yazar trailer'ı yok.
- Özel çalışma dosyaları, referans klasörü, gerçek sağlık verisi ve medya Git izleme dışında.
- Lint, strict TypeScript, 95 birim testi ve üretim build'i başarılı.
- İki telefon profilinde 8 E2E; iki temada 18 WCAG görünümü; yerel mobil Lighthouse eşikleri sağlandı.
- 16 kurgusal ekran görüntüsü, telefon kolajları, 6 karelik GIF, düğmeler ve sosyal önizleme hazır.
- Repo açıklaması, homepage ve 12 topic ayarlı; issues açık, wiki kapalı.
- Canlı Pages, APK ve release bağlantılarının nihai sonuçları dağıtımdan sonra bu belgeye eklenir.

## Canlı ve yerel doğrulama — 30 Ekim 2026

| Kontrol                | Sonuç                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pages                  | https://beratergun.github.io/formda/ · HTTP 200 · HTTPS                                                                                   |
| Web CI                 | [Kalite ve dağıtım](https://github.com/beratergun/formda/actions/runs/40963272035) başarılı; 95 birim, 8 E2E, 18 erişilebilirlik görünümü |
| CI mobil Lighthouse    | 96 / 100 / 100                                                                                                                         |
| Canlı mobil Lighthouse | 90 / 100 / 100; eşikler 90 / 95 / 95                                                                                                   |
| Canlı çevrimdışı akış  | 219 kcal öğün → yenile → çevrimdışı su → yenile; kayıtlar kaldı                                                                        |
| Kurulabilirlik         | Temiz kalıcı Chromium profilinde Chrome kurulum hatası yok                                                                             |
| Ağ                     | Temiz profilde dış alan adı, yazma isteği ve konsol hatası yok; açık ürün sorgusu yapılmadı                                            |
| Android                | [APK derlemesi](https://github.com/beratergun/formda/actions/runs/40963272082) başarılı; Gradle + lint + apksigner doğrulandı             |
| APK içeriği            | `io.github.beratergun.formda`, sürüm `1.0.0`, uzak `server.url` yok; SHA-256 artifact ile eşleşti                                         |
| İmza                   | Release sırları yapılandırılmadığı için geliştirme sertifikalı debug APK                                                               |
| README                 | GitHub görünümünde iki büyük düğme ve görseller hatasız yüklendi                                                                       |

MCP'nin kurulu masaüstü tarayıcısında yerel antivirüs betiği enjekte edildiği görüldü. Uygulama ağ sonucu, bu eklentileri taşımayan ayrı test profilinde `scripts/live-check.mjs` ile doğrulandı. Cihazın güvenlik ayarları değiştirilmedi.

## v1.0.0 teslimi

- [Release](https://github.com/beratergun/formda/releases/tag/v1.0.0) yayınlandı; APK, PWA ZIP ve iki sağlama dosyası eklendi.
- Etiket commit'i `751ef945f80ce723768fafd58845bf7bf1580582`; yazar, committer ve tagger Seyid Berat Ergün, GitHub release sahibi `beratergun`.
- [Son uygulama kalite/Pages koşusu](https://github.com/beratergun/formda/actions/runs/40965745121) ve [APK koşusu](https://github.com/beratergun/formda/actions/runs/40965745198) başarılı.
- [Release olayının APK derlemesi](https://github.com/beratergun/formda/actions/runs/40966380808) de başarılı; yayın ekleri bu koşunun çıktılarıyla güncellendi.
- Son canlı mobil Lighthouse: **100 / 100 / 100**. İlk dağıtım ölçümü 90 / 100 / 100, CI ölçümü 96 / 100 / 100; ağ ve cihaz etkisi saklanmaz.
- Canlı çevrimdışı kayıt ve kurulabilirlik denetimi tekrar geçti; dış alan adı/yazma isteği ve çalışma zamanı hatası yok.
- Repo dışındaki `../yol-launch/` paketinde Türkçe yazı 202, İngilizce yazı 214 kelime; her biri 7 hashtag. 1200×1200 kapak ve üç 1080×1350 kolaj boyutları doğrulandı.
- Mevcut `beratergun/beratergun` profil README'si değiştirilmedi; eklenecek bölüm dış pakette hazırlandı.
