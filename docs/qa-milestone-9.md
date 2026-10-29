# Kilometre taşı 9 kontrolü

- Profil: bilgiler, tema, bildirim izni/uygulama açıkken hatırlatmalar, fotoğraf aralığı, PIN ve küçük resim gizleme, puan ağırlıkları, depolama/kota/persist, ZIP, CSV, silme ve kurgusal demo.
- PIN: rastgele salt + PBKDF2 SHA-256 (150.000 tekrar); uygulama gizlenince kilitlenir. Beş başarısız denemede bekleme. Cihaz şifrelemesi olarak sunulmaz.
- ICS: Europe/Istanbul VTIMEZONE, UTF-8 75 oktet katlama, CRLF, kaçış, deterministik UID, çakışma doğrulaması ve -PT5M alarm.
- `importLegacy`: gunler/ayarlar ve düz belge yolları; öğünler, kutular, antrenman, profil, hedef, menü, plan ve sözler. Aktarım önizlemesi var.
- Yedek: CRC32 bütünlüğü, doğrulama sonrası atomik yükleme, eski OPFS dosyası temizliği. Karşılamadan doğrudan yedekle devam edilebilir.
- Gerçek tarayıcı: tam ZIP indir → tüm kayıtları sil → karşılamadan geri yükle. Tablolar + medya SHA-256 özetleri, alan sırası normalize edilerek aynı: `4e28888c08fa7e38b46a2c4e04a3086883dc36c33a5c29e8f2f687ae54a277db`. Son yedek zamanı karşılaştırma dışında tutuldu.
- Tarayıcı PIN yanlışını reddetti, doğrusunu açtı; takvim indirildi. İki telefon / iki tema: sayfa taşması ve konsol hatası yok.
- 87 test geçti. Domain satır %100, dal %98,74. Lint, typecheck, test ve build yeşil.
