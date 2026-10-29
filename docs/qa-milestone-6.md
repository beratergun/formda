# Kilometre taşı 6 kontrolü

- Karşılamanın son adımında isteğe bağlı başlangıç çekimi; ön/yan/arka pozlar. Galeri alternatifi var.
- Kamera, ön/arka seçim, 3/10 saniye, poz çerçevesi ve ilk fotoğrafla %30 hayalet hizalama.
- Fotoğraflar worker içinde yeniden kodlanır; 1600 px sınırı, WebP/JPEG, küçük resim, EXIF'siz çıktı.
- Ay bazlı zaman tüneli, iki kayıt seçme, kaydırmalı/yan yana karşılaştırma; tarih ve varsa kilo/bel etiketleri.
- Fotoğraf kareleri worker içinde çizilir. Tarayıcı MediaRecorder/canvas capture API'si DOM'a bağlı olduğu için son gerçek zamanlı kayıt ana iş parçacığında requestAnimationFrame ile yürür; arayüz engellenmez. İptal ve destek kontrolü vardır.
- Playwright MCP: yapay kamera ile iki çekim, hayalet hizalama, slider %70, yan yana, yenilemede iki kayıt, WebM dönüşüm videosu indirme geçti.
- 390×844 / 412×915, açık/koyu tema; taşma, konsol hatası/uyarısı yok. 74 test, lint, typecheck, build geçti.
