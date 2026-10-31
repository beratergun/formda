# BERxFIT v3 yayın kontrolü

**Durum: BERxFIT v3 PWA yayımlandı ve canlı doğrulandı. Yeni Android APK ve birleşik v3.0.0 GitHub release'i eski imza anahtarı/kurulum kararı nedeniyle bekliyor.** PWA sonucu APK dağıtım başarısı olarak sunulmaz.

| Kapı             | Sonuç / kanıt                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Kimlik           | GEÇTİ: tüm tarihçe yalnızca Seyid Berat Ergün, boş trailer                                                                |
| Gizlilik         | GEÇTİ: şartname/reference/kişisel sağlık ve medya tracked değil; demo kurgusal                                            |
| Kaynak           | GEÇTİ: lint/typecheck/217 birim/kapsam/build; domain satır %99,85                                                         |
| Tarayıcı         | GEÇTİ: 32/32 Chromium + WebKit E2E; offline/medya/ZIP/eski veri                                                           |
| Arayüz           | GEÇTİ: iki tema, 80 responsive kontrol (320–1440), klavye/reduced motion; yeni karşılama 390/412 iki tema                 |
| Erişilebilirlik  | GEÇTİ: WCAG 2.0/2.1/2.2 AA etiketleriyle 56 Axe, sıfır ihlal; fiziksel cihaz sınırı ayrıca belirtilir                     |
| Performans       | GEÇTİ: değişmeyen CI kapısı 96/100/100; canlı mobil **100/100/100**, LCP 1,6 sn, TBT 10 ms, CLS 0                         |
| PWA geçişi       | GEÇTİ: yayımlanmış gerçek v2 ZIP → v3 Güncelle; iki motorda tüm DB/medya baytları ve tema korunur; offline 250+100=350 ml |
| Native           | GEÇTİ: CI 41194362584 build/lint/apksigner, BERxFIT adı/sürümü/eski appId, tam beş sağlık READ ve WRITE yokluğu           |
| APK güncellemesi | ENGELLİ: yeni sertifika v2.0.0 ile farklı; eski özel anahtar yedeği veya ayrı kurulum kararı gerekir                      |
| Sunum            | GEÇTİ: TR/EN README, orijinal logo, 28 kurgusal ekran, 24 sn demo, yedi carousel, çalışan yerel bağlantılar               |
| Pages yayını     | GEÇTİ: main CI 41192932078 başarılı; canlı HTTP 200, BERxFIT manifesti, kurulum/offline ve eski yönlendirme doğrulandı    |
| Dosyalar         | PWA ZIP + SHA-256 repo dışında hazır; 106 dosya test edilen build ile birebir. Yeni APK/etiket/release yayımlanmadı       |

PWA kaynağı 3bd4748. [Başarılı Pages CI](https://github.com/beratergun/formda/actions/runs/41192932078), [canlı uygulama](https://beratergun.github.io/formda/), [repo](https://github.com/beratergun/formda), [mevcut v2 sürümü](https://github.com/beratergun/formda/releases/tag/v2.0.0). v3 APK için henüz doğrulanmış indirme bağlantısı yoktur; README APK düğmesi açıkça mevcut v2'ye gider.

Son yerel PWA paketi, kurulum metni düzeltmesini de içeren 4c155bd build'idir: 106 dosya, 10.460.796 bayt; SHA-256 `ea648d20b7dbb2d9912784ecf36982a1222d154b3b7710511c27df5dcd5e4f9a`. Dosya `../berxfit-launch/releases/BERxFIT-v3.0.0-pwa.zip`. Bu yerel dosya yayımlanmış GitHub release varlığı değildir. Eski v1/v2 release ve ekleri korunur. APK yüklemesinde clobber kaldırılmıştır; etiket/package sürümü ve sertifika kapıları durur.

İmza sonucu ilk boş SHA ayrıştırmasına dayanmaz: [gerçek PEM/X509 CI](https://github.com/beratergun/formda/actions/runs/41194362584) iki dolu parmak izini karşılaştırdı ve `matches: false` verdi. Altı parser ve bir CLI çıkış kodu testi (toplam yedi) boş/farklı/belirsiz imzada dağıtımın engellendiğini doğrular. Cache yolu gerçek Gradle yoluna düzeltildi; kapı geçilmedikçe yeni anahtar saklanmaz.

Tek gerekli karar: eski v2 keystore yedeğinin yerel yolu, APK'yı bekletme veya yeni kimlikle yan yana kurulum. Bu karar olmadan mevcut Android appId/sertifika değiştirilmez ve eski kurulum silinmez. [İmza ve veri geçişi](BERXFIT_MIGRATION.md).

Fiziksel Android/iPhone, Health Connect sağlayıcı ve OS izin deneyleri **NOT RUN**; otomatik tarayıcı ve APK statik kontrollerinden ayrı raporlanır. Repo/Pages yolu korunur; bu teslim hesap düzeyinde repo rename işlemi yapmaz.
