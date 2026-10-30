# Besin kaynakları

Formda v2 kataloğu 797 kayıt içerir: 577 USDA kaydı, eski menü kimliklerini koruyan 60 kaynaklı karşılık ve 160 malzemeli örnek tarif. Her kayıtta kaynak, kaynak kimliği ve zorunlu çiğ/pişmiş/uygulanamaz durumu bulunur. Toplamlar yuvarlanmamış değerlerden hesaplanır.

Ek kayıtlar [USDA FoodData Central SR Legacy, Nisan 2018](https://fdc.nal.usda.gov/download-datasets/) JSON dağıtımından gelir. Kalori (1008), protein (1003), karbonhidrat (1005), yağ (1004), lif (1079) değerleri 100 gram için aynen alınır. Her satır kendi FDC kimliğini ve kaynak URL'sini içerir. Veri kamu malıdır; uygulama hiçbir USDA API çağrısı yapmaz.

`docs/food-audit.json` ilk 619 kaydın denetimini ve resmi kaynak arşivin SHA-256 değerini içerir. 559 USDA kaydının kcal/protein değerleri birebir eşleşti; 60 yaklaşık prototip kaydı kaynaklı karşılık veya tarifle düzeltildi. 35 yaygın malzemenin kcal/protein değerleri bağımsız resmi kaynak sabitiyle testlidir. Yedi günün menü toplamları ve pişme dönüşümleri de test edilir.

160 tarifin malzemeleri, malzeme gramları, pişmiş toplam ağırlığı ve porsiyonları `src/data/seed/turkish-recipes.json` içindedir. Malzeme toplamı bitmiş ağırlığa bölünerek 100 g ve porsiyona ölçeklenir; tarif ayrıntıları uygulamada görülebilir. Bunlar laboratuvarda ölçülmüş standart Türk yemeği değerleri değildir. Gerçek yağ, marka ve su miktarı sonucu değiştirir. Kullanıcı kendi tarifini gerçek bitmiş ağırlıkla kaydedebilir.

Lor için taneli taze peynir, kaşar için Gouda karşılığı görünür adında açıkça belirtilir. Sütte kaynak ev ölçüsü 244 g / 240 ml kullanılır; diğer örnek sıvılarda 1 ml ≈ 1 g kabulü vardır. Özgün İngilizce USDA açıklamaları korunur.

Katalog değişimi geçmiş öğünlerin kayıtlı kcal/protein değerlerini yeniden hesaplamaz; favorileri, kullanım sayılarını, özel yiyecek ve tarifleri korur. Eski JSON aktarımı dondurulmuş `legacy-foods.json` kullanarak eski 1458,5 kcal menü hesabını korur. Güncel katalogdaki iki yumurta + 30 g ekmek 219,6 kcal / 16,32 g protein olur (ekranda 220 kcal).

Denetimi tekrarlamak için `node scripts/audit-foods.mjs /path/to/FoodData_Central_sr_legacy_food_json_2018-04.json` çalıştır. Tarif kaynakları `scripts/turkish-recipes.json` ve `scripts/recipe-ingredients.json` içindedir; resmi arşiv repoya eklenmez.

[Open Food Facts](https://world.openfoodfacts.org/) yalnızca kullanıcının açık isim/barkod aramasında çağrılır. Seçilen ürün barkod, kaynak ve `off:` kaynak kimliğiyle yerel saklanır. Fotoğraf, günlük veya sağlık verisi gönderilmez.
