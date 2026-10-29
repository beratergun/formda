# Kilometre taşı 4 kontrolü

- Dört adımlı karşılama; hedef, ufuk, başlangıç, ekipman ve deneyim tercihi; isteğe bağlı isim.
- Gerçek IndexedDB kayıtlarından puan, XP, seri, asistan, söz, kalori/protein, su, enerji, yatış, öğün ve günlük kutuları.
- Yiyecek sayfasında altı yöntem: arama, yerel metin ayrıştırma, fotoğraf iliştirme, Open Food Facts, tarif, kopyalama. Fotoğraflar worker içinde 1600 px WebP/JPEG olarak yeniden kodlanır ve metaverileri taşınmaz.
- 700 ms otomatik kayıt ve görünürlük değişiminde flush. Hata olduğunda kayıt bekliyor mesajı; başarılı olmayan işlem için kaydedildi gösterilmez.
- Playwright MCP: karşılama → fotoğrafı atla → Bugün → 2 yumurta + 1 dilim ekmek → 219 kcal / 15,6 g protein → yenile → aynı kayıt. Su ve enerji düğmeleri çalıştı.
- 390×844 ve 412×915 açık/koyu ekran görüntüleri alındı; sayfa taşması ve konsol hatası/uyarısı yok.
- Lint, typecheck, 73 test ve build geçti. Kamera başlangıç fotoğrafı 6. aşamada, diğer sekmeler 5–9. aşamalarda genişletilecek.
