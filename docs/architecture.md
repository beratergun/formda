# Mimari

berXfit, aynı kaynak kodundan PWA ve Capacitor Android uygulaması üretir. GitHub Pages yalnızca statik varlıkları dağıtır. Uygulama sunucusu veya kullanıcı hesabı yoktur.

## Katmanlar

- `app/`: yönlendirme, yerel Store, kilit, yükleme/güncelleme kartları ve hata sınırı.
- `features/`: Bugün, Günlük, İlerleme, Planım, Profil ve kayıt ekranları.
- `domain/`: React'ten bağımsız hesap ve karar fonksiyonları. Kalori toplamı gösterim aşamasına kadar yuvarlanmaz; bilinmeyen makro sıfır olarak uydurulmaz.
- `data/`: Dexie v1 tabloları, repository, medya dosyaları, seed ve yedek worker'ları.
- `ui/` / `styles/`: ortak bileşenler, telefon düzeni ve iki temanın CSS token'ları.

Store değişiklikleri yaklaşık 700 ms sonra kaydeder; sayfa gizlenince bekleyen kayıt hemen boşaltılır. Repository yalnızca değişen tabloları transaction içinde yeniler. Tarih anahtarları Europe/Istanbul gününe aittir. Hash yönlendirme Pages üzerinde sayfa yenilemesini destekler.

## Medya

Fotoğraf worker'ı uzun kenarı 1600 px'e indirir, WebP %80 veya JPEG üretir ve piksel üzerinden yeniden kodlayarak EXIF/konum bilgisini kaldırır. Worker görüntü API'leri yoksa aynı boyut ve kalite kuralı DOM canvas ile uygulanır.

Medya önce özel OPFS dizinine yazılır; metadata ve küçük resim IndexedDB'de tutulur. OPFS yoksa Blob kullanılır. Bazı depolama motorları Blob yazımını reddeder: bu durumda MIME bilgisi ve Uint8Array ile uyumluluk kaydı yapılır. Dexie okuma adaptörü her iki biçimi aynı Blob arayüzüne çevirir. Fotoğraf ve video hiçbir API'ye yüklenmez.

Kare hazırlığı worker'dadır. MediaRecorder ve canvas.captureStream DOM API'leri gerektiğinden son video kaydı requestAnimationFrame ile akıtılır. Video kaydı desteklenmiyorsa dış kaynak veya script içermeyen HTML slayt gösterisi verilir. Vlog slaytlarında kapak kareleri kullanılır.

## Yedek

Worker, veritabanını okuyarak sürümlü `data.json`, medya dosyaları ve küçük resimlerden ZIP üretir. Girişler parça parça işlenir. Geri yükleme ZIP dizinini ve dosyaları 64 KB aralıklarla okur; CRC, boyut ve Zod şeması doğrulanır. Bütün doğrulama bitmeden mevcut veri değiştirilmez.

Değiştirme/birleştirme atomik transaction ile yapılır; eski OPFS dosyaları yalnızca başarılı işlemden sonra kaldırılır. Blob yazımı desteklenmiyorsa ilk transaction geri alınır, ikili uyumluluk biçimiyle yeniden uygulanır. İçerik, tür ve medya baytları korunur.

Yedek biçimi ZIP32'dir. Tek arşiv yaklaşık 4 GB sınırına sahiptir; ZIP64 ve çok parçalı arşivler kabul edilmez. Çok yıllık büyük video arşivlerinde videoları ayrıca dışa aktarmak gerekir. Uygulama bu sınırı aşan arşiv üretmeye çalışırsa anlaşılır hata verir; kayıtları silmez. Yapılandırılmış JSON için okuma sınırı 128 MB'dır. PIN yedek şifrelemesi değildir.

## Plan ve projeksiyon

`planFor(date, settings, overrides)` yalnızca görünen güne ait sonucu üretir. Dört haftalık bloklar, altı faz ve tekrarlayan sürdürme dönemi vardır; her 12. hafta değerlendirmedir. Beş yıllık kayıt dizisi önceden yaratılmaz. Haftalık şablonlar ve tarih istisnaları ayrı tutulur.

TDEE başlangıçta Mifflin-St Jeor ve aktivite katsayısını kullanır. Yeterli kayıt varsa gerçek alım/kilo trendiyle uyarlanır. Haftalık simülasyon değişen kiloya göre harcamayı yeniler ve hedefte korumaya geçer. Bant ve tarihlerin hepsi tahmindir.

## Ağ ve Android

Yalnızca açık kullanıcı eylemiyle Open Food Facts ürün adı/barkod sorgusu ve açık onayla model dosyası indirmesi yapılır. Profil, günlük ve fotoğraf bu isteklerin parçası değildir. Yerel fontlar, çizilmiş görseller ve Workbox önbelleği çevrimdışı kullanımı sağlar.

Program seçimi haftalık şablonu üretir; alternatifler ve hareket değişimleri tarih istisnasında saklanır. Kişisel planın önceki hali ayrıca korunur. Katalog sürümü 2 kaynaklı yiyecekleri güncellerken tarihsel öğün anlık görüntülerini, favorileri ve kişisel tarifleri korur.

Enerji hesabı saf domain fonksiyonudur: brüt MET hesabından aktif değer ayrılır; set/RPE ve adım tahminleri etiketlenir. Elle/Health Connect günlük toplamı varsa seanslar eklenmez. Health Connect eklentisi yalnızca beş okuma kategorisiyle çağrılır; manifestte yazma izinleri kaldırılır. Okuma önizlemesi ayrı onayla yerel kayda dönüşür.

İsteğe bağlı yemek tanıma worker'ı sabit Apache-2.0 model revizyonunu ONNX/WASM ile çalıştırır. Model ilk açık eylemde indirilir; çalışma dosyaları ve ağırlıkları tarayıcı önbelleğinde kalır. Bilinen görüntü bileşenleri doğrudan yüklenerek çevrimdışı dosya keşfi önlenir. Yeni fotoğraf önceki worker/önerileri sıfırlar; kullanıcı onayından önce hiçbir yiyecek kaydı oluşturulmaz.

Android paketi uzak `server.url` kullanmaz; `dist-native` varlıklarını içerir. Kamera/mikrofon izni yerel eklentiyle istenir. Dışa aktarma cache dosyasını Android paylaşım paneline sunar. Otomatik bulut ve cihazlar arası yedek kapalıdır. PWA ile APK ayrı origin/uygulama alanlarıdır; ZIP ile taşınır.

[Kalite ve platform sınırları](quality.md) · [Android imza rehberi](android.md).
