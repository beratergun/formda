# Android · berXfit

Yeni uygulama kimliği `io.github.beratergun.berxfit`tir. Kullanıcı 31 Ekim 2026'da eski Formda ve verisini koruyarak yan yana APK kurulmasını seçti. Eski `io.github.beratergun.formda` uygulaması ayrı kalır. PWA adresi `/formda/` değişmez.

React/TypeScript arayüzü `dist-native/` olarak APK içine paketlenir; uzak server.url yoktur. Android 8+ ve güncel WebView gerekir. Sağlık sağlayıcısı yoksa elle kayıt çalışır. Health Connect yalnızca adım, aktif kalori, egzersiz, kilo ve uyku için beş READ izni kullanır; WRITE yoktur. Yeni uygulamanın izinleri ayrıca verilir.

## Veri aktarımı

Eski Formda → Profil → Tam yedek al. Yeni berXfit'i ayrı kur; temiz karşılama ekranında Yedeğimden devam et ile ZIP'i seç. Kurulum tamamlandıysa Profil → Geri yükleme yöntemi seçimi → Tam yedeği geri yükle yolunu kullan. ZIP seçimi doğrulamadan sonra geri yüklemeyi başlatır; ayrı bir ZIP önizleme/onay penceresi yoktur. Ardından tüm kayıt ve medyayı doğrula. Eski uygulamayı kaldırma/verisini temizleme. İki APK ve PWA ayrı veri alanlarıdır; sonraki değişiklikler otomatik senkronize olmaz. Ayrıntılar [geçiş belgesinde](BERXFIT_MIGRATION.md).

## Kalıcı release imzası

İlk berXfit anahtarı kullanıcı hesabında oluşturulmuş RSA-4096 / PKCS12 release anahtarıdır. Özel dosyalar repo dışındaki `%USERPROFILE%\.android-keys\berxfit-v3` klasöründedir; klasör ACL'i yalnızca kullanıcı ve SYSTEM erişimi verir. `berxfit-release.p12` şifreli keystore, `credentials.private.json` yerel erişim bilgileri, `berxfit-certificate.pem` public sertifikadır. Bu klasörü güvenli bir yedeğe/parola yöneticisine ayrıca sakla. Anahtar/parola dosyalarını repoya veya sohbete yükleme.

CI için şu dört şifreli repo Secret ayarlanmıştır:

- `BERXFIT_ANDROID_KEYSTORE_BASE64`
- `BERXFIT_ANDROID_KEYSTORE_PASSWORD`
- `BERXFIT_ANDROID_KEY_ALIAS`
- `BERXFIT_ANDROID_KEY_PASSWORD`

`android/signing-identity.json` yalnızca public applicationId ve sertifika SHA-256 pinini içerir. Her APK bu pinle eşleşmelidir. Sonraki sürümlerde aynı anahtar korunur. Eksik/değişmiş anahtar dağıtımı durdurur; debug dağıtım fallback'i veya keystore cache'i yoktur. Özel anahtar yalnızca runner geçici dizinine çözülür ve iş sonunda kaldırılır.

## Otomatik APK ve denetimler

Android workflow `assembleRelease lintRelease`, apksigner, appId/ad/sürüm, uzak sunucu yokluğu, eski applicationId'nin manifestte bulunmaması ve tam beş READ/WRITE yokluğunu denetler. Sertifika PEM'i Node X509 ile okunup public pine karşılaştırılır. Yanlış signer, yanlış applicationId, boş veya belirsiz sertifika dağıtımı engeller. On ayrı imza/CLI regresyonu iki CI pipeline'ında çalışır.

Başarılı iş `berXfit-android-apk` artifact'ında APK ve SHA-256 üretir. Release etiketi package sürümüne eşit olmalıdır; release event'inde dosyalar eklenir, mevcut varlığın üzerine yazılmaz. v1/v2 release'leri korunur. Fiziksel Android kurulumu, iki uygulamanın cihazda yan yana açılması ve Health Connect sağlayıcıları ayrıca denenmelidir; CI/manifest testleri fiziksel cihaz testi değildir.

## Yerel geliştirme

Node 22.12+, JDK 21 ve Android SDK 36 ile `npm ci`, `npm run android:sync`, ardından `npm run android:open`. Dağıtılacak paket CI'da kalıcı release anahtarıyla üretilir. Yerel debug APK dağıtım paketi olarak kullanılmaz.
