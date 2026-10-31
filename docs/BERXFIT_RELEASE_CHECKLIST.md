# berXfit v3 yayın kontrolü

**31 Ekim: yeni marka yazımı berXfit. PWA önceki v3 build’iyle yayında; güncel yazım ve ayrı kurulum APK’sı henüz yayımlanmadı.**

- Kullanıcı yeni Android kimliğiyle yan yana kurulumu seçti. Formda ve verisi korunur.
- Yeni appId: io.github.beratergun.berxfit. Sürüm 3.0.0, versionCode 3.
- Kalıcı PKCS12 anahtarı repo dışında korunur; dört şifreli BERXFIT_ANDROID_* Secret ayarlandı. Debug dağıtım/cache yok.
- Public sertifika SHA-256: ab6c39cb845b42b960c73505b9ef2c2affb3bd2a7fd6925072c83d926d8c6e19. CI eşleşmeden APK dağıtmaz.
- Önceki PWA kanıtı: 217 uygulama testi, 32 E2E, 56 Axe, CI 96/100/100, canlı 100/100/100.
- Güncel aday için lint/typecheck/217 uygulama + 10 imza testi/build; tam tarayıcı, logo, yerel ZIP aktarımı, native CI ve son canlı doğrulama yeniden tamamlanacak.
- Eski v1/v2 release ve ekleri korunur. Yeni v3 release henüz yok; final indirme bağlantısı henüz doğrulanmadı.
- Fiziksel Android/iPhone ve Health Connect OS izin testleri **NOT RUN**.

[Geçiş](BERXFIT_MIGRATION.md) · [Test raporu](BERXFIT_TEST_REPORT.md) · [Android imza rehberi](android.md).
