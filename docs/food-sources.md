# Besin kaynakları

Başlangıç menüsü, verilen referans veri setindeki değerleri korur. Bu satırlar uygulamada **Referans menü · yaklaşık değer; tarif/markaya göre değişir** olarak etiketlenir. Makroları verilmeyen kaynaklarda karbonhidrat ve yağ tahmin edilmez.

Ek kayıtlar [USDA FoodData Central SR Legacy, Nisan 2018](https://fdc.nal.usda.gov/download-datasets/) JSON dağıtımından gelir. Kalori (1008), protein (1003), karbonhidrat (1005), yağ (1004), lif (1079) değerleri 100 gram için aynen alınır. Her satır kendi FDC kimliğini ve kaynak URL'sini içerir. Veri kamu malıdır; uygulama hiçbir USDA API çağrısı yapmaz.

Türkçe adlar arama kolaylığı içindir. Aynı besinin farklı hazırlama ve işleme çeşitleri SR numarasıyla ayırt edilir; özgün açıklama arama takma adı olarak korunur. Her çeşit ayrı ölçülmüş besin kaydıdır. Tarifler ve paketli ürünlerde kullanıcının gerçek tarifi veya etiketi esas alınır.

Veriyi yeniden üretmek için resmi SR Legacy JSON arşivini geçici `formda-food-source` klasörüne çıkarıp `node scripts/seed-usda.mjs` çalıştır. Kaynak arşiv uygulama deposuna eklenmez.
