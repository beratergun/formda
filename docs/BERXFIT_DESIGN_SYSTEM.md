# BERxFIT · Tasarım sistemi

Durum: Faz 2 uygulama hedefi; görsel doğrulama tamamlanmadan teslim edilmiş sayılmaz.

## Marka kaynağı

Sahibin sağladığı PNG 1254×1254, gerçek alfa kanallı. Orijinal aynen saklanacak; şeffaf kenarların dışındaki içerik değiştirilmeden türevler üretilecek. Alfa sınırı 1190×623, sol 32/üst 299. Figür, grafik, X ve wordmark'ın hiçbir bölümü kesilmeyecek. Raster türevler vektör orijinal diye tanıtılmayacak; üretken logo değişimi yok.

Koyu tipografi siyah üstünde kaybolduğu için header/splash/launcher üzerinde nötr açık bir plaka kullanılacak. Logo yeşili korunacak; uygulama kontrolleri mavi/cyan, başarı yeşil. Maskable/adaptive türevlerde tüm eser güvenli orta bölgede kalacak.

## Semantik renkler

- Koyu temel: #070B12, yüzey #0D1421 / #131E2D, çizgi #253247.
- Metin #F4F7FB, ikincil #A1B0C3. Açık tema ayrıca, aynı hiyerarşiyle korunacak.
- Etkileşim: erişilebilir mavi; veri çizgileri blue/cyan; gerçek başarı ve marka #39D96B.
- Uyarı ve hata ayrı semantik token; durumlar yalnızca renkle anlatılmayacak.
- Buton ön/arka plan eşleşmeleri WCAG AA ile doğrulanacak. Logo renkleri marka varlığıdır, giriş/normal metin kontrastı yerine kullanılmayacak.

## Düzen ve bileşenler

8 px boşluk adımları, 20–24 px kart köşesi, ince sınırlar ve kontrollü gölge. Başlık/rakam için paketlenmiş Bricolage, metinde Onest; tabular rakamlar. 44 px minimum dokunma, görünür odak, safe-area ve 16 px mobil input yazısı.

Ana ekran önce kalori/makro ve günün gerçek eylemini gösterecek. Dört dev halka yerine bir ana kalori görünümü ve kompakt protein/harcama/adım metrikleri; mevcut hesap ve erişilebilir etiketler korunacak. Su ve öğünler öne, uzun motivasyon/XP ve sözler daha aşağı taşınacak. Kayıt yokken gerçek boş durum; yapay ölçüm yok.

Mobil 320–430 px, tablet 768 px, desktop 1024+; masaüstünde yalnızca ilgili ekranlarda iki sütun ve gezinme rayı. Formlar aşırı genişletilmeyecek. Görsel sıra ile klavye/DOM sırası tutarlı kalacak.

Ortak NumericInput ham taslak, doğrulanmış değer, boş/sıfır ayrımı, locale ondalık, hata açıklaması ve iptal davranışı taşır. Primary commit eylemleri en yakın doğrulama kapsamındaki geçersiz alanı raporlar; kapat/iptal/sil kontrolleri kullanıcının çıkışını engellemez.

## Hareket rehberi yaklaşımı

Özgün ve açıkça şema olarak etiketli 2D teknik görseller tercih edilecek; ağır 3D motor veya telifli uzak video eklenmeyecek. Önce squat, push-up, bench press, lat pulldown, curl, shoulder press, row, plank, lunge ve RDL gözden geçirilecek. İki poz ve yön işaretleri, oynat/duraklat/hız gibi kontroller yalnızca uygun hareketlerde sunulacak. Plank gibi statik hareketlere yapay tekrar animasyonu eklenmeyecek.

Görseli doğrulanmamış varyantlar için anatomik doğruluk iddiası taşıyan genel avatar yerine kas haritası ve ayrıntılı metin/kurulum rehberi gösterilecek. Mevcut 159 hareketin rehber içeriği korunacak. Hareketli veya yüksek kaliteli bir varlık yoksa varmış gibi sunulmayacak.

## Durumlar ve doğrulama

Boş/yükleniyor/hata/başarı/disabled durumları tüm kayıt akışlarında açık olacak. Reduced motion altında hareketler duracak veya statik pozlara dönecek. Tamamlanan veriler ve haftalık/kilo özetleri yalnızca kayıt ve hedeflerden türetilecek. Görsel inceleme gerçek tarayıcıda, iki temada yapılacak; tasarım hedefleri tek başına test sonucu değildir.
