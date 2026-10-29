# Kilometre taşı 3 kontrolü

- Sürümlü Dexie v1 şeması, tipli repository ve tek seferlik başlangıç verileri hazır.
- Medya OPFS'ye kaydedilir, kullanılamadığında IndexedDB Blob'a düşer. Silme ve kota özeti vardır.
- Tam yedek worker içinde akışlı ZIP olarak üretilir. Medya birer dosya ve küçük parçalar hâlinde okunur; arayüzün ana iş parçacığında kodlama yapılmaz.
- Geri yüklemede sürüm, tüm tablo alanları, dosya adları, açılmış boyut sınırları ve medya boyutları Zod ile doğrulanır. Doğrulama bittikten sonra tek IndexedDB transaction ile birleştirilir veya değiştirilir.
- 73 test geçti. Veri + ikili medya → ZIP → tüm veriyi sil → geri yükle eşitliği; birleştirme; bozuk dosya reddi; Blob fallback test edildi.
- Lint, typecheck, test, build yeşil. Ekran değişmedi; Playwright MCP'de iki telefon boyutu ve iki tema için taşma kontrolü geçti.
- Gerçek tarayıcıdaki worker ve OPFS akışları, Profil ekranı ve uçtan uca aşamasında ayrıca test edilecek.
