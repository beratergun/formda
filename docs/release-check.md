# Yayın denetimi

## İlk dağıtım sırası

Yeni oluşturulan `beratergun/yol` reposunda ilk push öncesinde çalışan Pages yayını bulunamaz. Bu ilk dağıtımda yerel kalite, yazar, özel dosya, README varlıkları ve repo ayarları kontrol edilir; push'tan hemen sonra Pages etkinleştirilir ve gerçek dağıtımın başarısı / HTTP 200 doğrulanır. Release, bu canlı kontrol ve APK derlemesi başarılı olmadan oluşturulmaz. Sonraki push'larda mevcut canlı adres de yayın öncesi denetime dahildir.

Bu sıra, boş repo → ilk push → Pages dağıtımı → canlı doğrulama → release akışını uygulanabilir kılar. İlk dağıtım için canlı kontrol ertelenir; test veya gizlilik kontrolü atlanmaz.

## Kanıtlar

- Commit yazar/committer: Seyid Berat Ergün; ek yazar trailer'ı yok.
- Özel çalışma dosyaları, referans klasörü, gerçek sağlık verisi ve medya Git izleme dışında.
- Lint, strict TypeScript, 95 birim testi ve üretim build'i başarılı.
- İki telefon profilinde 8 E2E; iki temada 18 WCAG görünümü; yerel mobil Lighthouse eşikleri sağlandı.
- 16 kurgusal ekran görüntüsü, telefon kolajları, 6 karelik GIF, düğmeler ve sosyal önizleme hazır.
- Repo açıklaması, homepage ve 12 topic ayarlı; issues açık, wiki kapalı.
- Canlı Pages, APK ve release bağlantılarının nihai sonuçları dağıtımdan sonra bu belgeye eklenir.
