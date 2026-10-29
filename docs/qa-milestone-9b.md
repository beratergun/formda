# PWA ve Android dağıtım hazırlığı

- Standalone manifest, maskable ikonlar, Apple touch ikon, dört iPhone başlangıç görseli ve HTML ilk açılış görünümü.
- İlk karşılamada yükleme kartı; Profil'de tekrar açılabilir. Android beforeinstallprompt, appinstalled ve iPhone için Paylaş → Ana Ekrana Ekle → Uygulama Olarak Aç görsel rehberi.
- Playwright MCP'de yükleme olayı simülasyonu prompt'u bir kez çağırdı ve yükleme sonrası kart gizlendi. iPhone rehberi gerçek dialog içinde açıldı; ekran görüntüsü alındı.
- Capacitor 8, uygulama kimliği `io.github.beratergun.formda`; aynı kaynak, APK içine yerel `dist-native` varlıkları. Uzak server.url yok. Native web derlemesi ve cap sync yerelde geçti.
- Yerel kamera/mikrofon izin eklentisi, donanım geri tuşu, native safe-area, özel cache'e parça parça yazıp sistem paylaşım paneliyle dışa aktarma.
- Android Auto Backup ve device transfer kapalı. İkon/splash uygulamanın kendi görsel diliyle değiştirildi.
- Android workflow: JDK 21/SDK 36; debug + Android lint; dört Secret varsa imzalı release; apksigner doğrulaması, SHA-256, artifact ve release eki.
- `docs/android.md` içinde kullanıcıya ait anahtar oluşturma ve Secrets adımları var. Anahtar oluşturulmadı veya depoya konmadı.
- Bu Windows ortamında Android SDK yok. Gerçek Gradle/APK derlemesi GitHub'daki iş akışında doğrulanacak; APK doğrulanmadan tamamlanmış yayın olarak raporlanmayacak.
