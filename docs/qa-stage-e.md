# E · Beslenme, enerji ve cihaz kaynakları

- İlk 619 besin denetlendi: 559 USDA kcal/protein değeri birebir doğrulandı; 60 yaklaşık kayıt kaynaklı karşılık/tarifle düzeltildi. Katalog 797 yiyecek ve 160 malzemeli örnek tarif içerir. 35 bağımsız USDA kaynağı ve yedi menü toplamı testlidir.
- Günlük enerji MET, kilo, süre, set/RPE ve adım hesabından tahmin edilir. Kaynak toplamı ile seans iki kez eklenmez. Hedefe ekleme varsayılan kapalı, yüzde ayarı isteğe bağlıdır.
- Android Health Connect için beş kategoride yalnızca okuma, izin reddi/yokluğu ve kısmi hata yolları uygulandı. PWA elle kayıt sunar. Fiziksel Android izin paneli masaüstü testinin kapsamı dışındadır; Gradle/lint son sürüm CI kapısında doğrulanacaktır.
- Kalıcı kayıt, eski katalog göçü ve ZIP yedek gidiş dönüşü geçmiş kcal, kişisel tarif, favori ve yeni sağlık alanlarını korur. Profil kaydet bildirimi artık kalıcı yazım tamamlandıktan sonra çıkar.
- 140 birim testi, lint, strict TypeScript, build ve Pixel 7/iPhone 14 için 18 E2E yeşil. İki temada 26 Axe görünümünde ihlal yok. Mobil Lighthouse 97/100/100.
- Playwright MCP ile 390×844 ve 412×915 boyutlarında açık/koyu Bağlı kaynaklar ve Fotoğraf ekranları tıklandı, yatay taşma görülmedi. Ekranlar yerel `docs/qa/2026-10-30/e-*.png` dosyalarında.
- Apache-2.0 Food101 Swin q8 modelinin sabit revizyonu gerçek tarayıcıda 10 ayrı sınıftan 10 fotoğrafla 10/10 ilk üç isabet sağladı. Yeni worker çevrimdışı yeniden açılışta önbellekten çalıştı. Harici GET/HEAD dışında ağ yazımı yok. Sonuç `docs/model-evaluation.json` içindedir; 10 örnek genel veya Türk mutfağı doğruluğu garantisi değildir. Öneri ancak kullanıcının yiyecek ve porsiyon onayıyla kayda dönüşür.
