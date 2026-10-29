# Kararlar ve varsayımlar

- Başlangıçta depoda yalnızca özel şartname ve salt okunur prototip vardı. Uygulama temiz bir React 18 + strict TypeScript projesi olarak kuruluyor.
- Yayın hedefi kullanıcının seçtiği `beratergun/yol` GitHub Pages adresidir. Hash tabanlı yönlendirme, statik sunucuda sayfa yenilemelerini güvenilir kılar.
- Prototipteki kişisel isim, ölçüler ve sabit tarih yeni kullanıcı için varsayılan yapılmaz. Tanıtım materyallerinde yalnızca kurgusal veriler kullanılır.
- İlk kilometre taşında yalnızca o aşamada uygulanmış akışlar UI QA kapsamına alınır; sonraki ekranlar ilgili kilometre taşlarında eklenip test edilir.
- Gün anahtarları Europe/Istanbul takvimine göre hesaplanır; UTC gece yarısı farkı kayıt gününü değiştirmez.
- Puanın kalori bileşeni şartnameye göre yalnızca üç ayrı öğün kaydı ve hedef ±250 kcal ile verilir; prototipteki aralık dışı yarım puan taşınmaz.
- Uyarlanabilir TDEE hesabında kilo değişimi son ortalama eksi ilk ortalamadır; enerji dengesi için bu fark alımdan çıkarılır. Kilo kaybı böylece harcamayı artıran kanıt olur.
- Şartnamedeki 4 haftalık blok (3 yüklenme + 1 hafif hafta) prototipin tek 13. hafta molasının yerine geçer. Her 12. haftada değerlendirme vardır.
- Besinler için uydurma veri yerine resmi USDA dağıtımı kullanıldı. Referans kayıtlar yaklaşık kaynak etiketiyle korundu; tür ve marka farklarını gizlemek için eksik makrolar tamamlanmadı.
- Fotoğraf/video kare hazırlığı OffscreenCanvas worker'larında yapılır. MediaRecorder ve HTMLCanvasElement.captureStream DOM API'leri olduğundan son kayıt ana iş parçacığında requestAnimationFrame ile akıtılır. Bu tarayıcı kısıtı, ağır senkron iş yapılarak aşılmaz.
- Ek Android teslimi aynı React kodunu Capacitor içinde paketler. Release keystore'u kullanıcıya aittir; sırlar yoksa Android'in standart geliştirme sertifikalı debug APK'sı sağlanır. Kurulabilen Android APK'ları bir sertifika gerektirir; debug sertifikası mağaza/release imzası olarak sunulmaz.
- Fotoğraf sıkıştırma öncelikle worker'da yapılır. Worker içindeki görüntü API'lerini desteklemeyen tarayıcılarda HTMLImageElement/canvas uyumluluk yolu kullanılır; 1600 px sınırı, kalite ve EXIF temizleme korunur.
- Windows'taki Playwright WebKit portu canvas kaynaklı sahte kamera akışını desteklemediği için iPhone boyutu testinde galeriden üretilmiş PNG yüklenir. Gerçek sahte kamera/hayalet çekim ve çalışma anında üretilen vlog Chromium'da test edilir; fiziksel iPhone kamera izni ve mağaza dağıtımı otomasyon sonucu olarak sunulmaz.
- Video oluşturma API'leri yoksa dönüşüm ve bir saniye montajı, dış kaynak içermeyen tek bir HTML slayt gösterisi olarak dışa aktarılır. Vlog için kapak kareleri kullanılır; azaltılmış hareket tercihinde kareler sabit listeye dönüşür.
- Yedek ZIP32 girişleri worker'da 64 KB parçalarla okunur; CRC ve şema doğrulaması bitmeden mevcut kayıtlar değiştirilmez. ZIP64 ve çok parçalı ZIP kabul edilmez.
- Blob yazımını reddeden IndexedDB motorlarında yalnızca bu hata için MIME türüyle birlikte Uint8Array uyumluluk kodlaması kullanılır; okuma katmanı tekrar Blob üretir. Toplu geri yüklemenin ilk denemesi başarısızsa transaction geri alınır, uyumluluk kodlamasıyla atomik olarak tekrar denenir.
