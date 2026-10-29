# Formda Android uygulaması

Uygulama kimliği: `io.github.beratergun.formda`. Android, PWA ile aynı React/TypeScript kaynaklarını kullanır. `dist-native/` derlemesi APK içine paketlenir; açılışta GitHub Pages veya başka bir sunucudan arayüz yüklenmez.

## Yerel geliştirme

Node.js 22+, JDK 21 ve Android SDK 36 gerekir. Android Studio SDK'yı kurabilir.

```powershell
npm ci
npm run android:sync
npm run android:open
# Alternatif: android klasöründe .\gradlew.bat assembleDebug
```

`capacitor.config.ts` içinde uzak `server.url` yoktur. Medya Android WebView'in özel OPFS alanında, destek yoksa IndexedDB Blob olarak kalır. Dışa aktarma, cache alanına parça parça yazıp Android paylaşım panelini açar. Cihaz dosyalarına kaydetme veya bir uygulamaya gönderme tercihini kullanıcı yapar. Otomatik bulut yedeği ve cihazlar arası veri çıkarımı manifest ve XML kurallarıyla kapalıdır.

Kamera ve mikrofon yalnızca kullanıcı ilgili kaydı başlattığında yerel izin eklentisiyle istenir. İnternet izni, kullanıcının açıkça başlattığı Open Food Facts sorgusu içindir. Sunucu, hesap, analitik ve uzaktan medya işleme yoktur.

## Otomatik APK

`.github/workflows/android.yml`, `main` push'unda ve elle tetiklendiğinde kalite kontrollerini, native derlemeyi, Android lint'i ve APK imza doğrulamasını çalıştırır. `Formda-android-apk` artifact'ında `Yol-v<version>.apk` ve SHA-256 dosyası bulunur. Release yayınlandığında aynı dosyalar release'e eklenir.

Dört imza sırrı varsa release APK; yoksa standart Android geliştirme sertifikalı debug APK seçilir. Kurulabilen APK bir sertifika gerektirir; debug APK mağaza/release imzası olarak sunulmaz. Debug sertifikası farklı koşularda değişebilir; gelecekte farklı sertifikaya geçmeden önce tam yedek al.

## Kullanıcının release anahtarı

Bu komutları kendi bilgisayarında uygula. Anahtar repoya girmez; parolaları yalnızca etkileşimli istemlere yaz.

```powershell
$keyDirectory = Join-Path $env:USERPROFILE '.android-keys'
New-Item -ItemType Directory -Force -Path $keyDirectory
$keyPath = Join-Path $keyDirectory 'formda-release.jks'
keytool -genkeypair -v -keystore $keyPath -storetype PKCS12 -alias yol -keyalg RSA -keysize 4096 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes($keyPath)) | gh secret set ANDROID_KEYSTORE_BASE64 --repo beratergun/formda
gh secret set ANDROID_KEYSTORE_PASSWORD --repo beratergun/formda
gh secret set ANDROID_KEY_ALIAS --repo beratergun/formda
gh secret set ANDROID_KEY_PASSWORD --repo beratergun/formda
gh workflow run android.yml --repo beratergun/formda
```

Alias istemine `yol`, parola istemlerine oluşturduğun anahtarın ilgili parolasını gir. Anahtarı ve parolaları güvenli bir yerde ayrıca yedekle. Sırlar eklendikten sonra iş akışı imzalı release varyantını üretir. Eski debug kurulumundan imzalı kuruluma geçerken sertifika değiştiği için önce tam yedek alıp eski kurulumu kaldırman gerekebilir.

## PWA ve APK verileri

PWA ve Android uygulaması ayrı uygulama alanları kullanır. Aralarında geçmek için tam ZIP yedeğini indir ve diğer uygulamada geri yükle. Hiçbir otomatik eşitleme yapılmaz.
