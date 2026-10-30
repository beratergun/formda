# BERxFIT · Doğrulama kaydı

## Faz 0 tabanı

Commit `6b3dcd8`: lint, typecheck, 140 birim ve üretim build geçti. Kurulu bağımlılık ağacı doğrulandı; yeni bağımlılık eklenmedi. Güvenlik taraması 4 düşük, 0 orta/yüksek/kritik bulgu verdi. Gerçek tarayıcıda 0 silme hatası ve başlangıç görseli kaydedildi.

## Faz 1 · Sayısal giriş ve başlangıç sağlamlaştırması

| Hata                                                          | Kök neden                                                         | Değişiklik ve kanıt                                                                                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Silinen alan 0/min değerine geri dönüyor                      | Her tuşta sayı dönüşümü ve clamp                                  | 36 sayı kontrolü ortak NumericInput; ham taslak ayrı. Component ve iki mobil E2E 0→1500, silme, ondalık, kaydet/yükle doğrulandı                                   |
| Geçersiz/negatif giriş eski veya yanlış değeri kaydedebiliyor | HTML min/max otomatik domain doğrulaması sanılmış                 | Alan sınırları, finite/precision/locale parser ve commit kapsamı. Boş/sıfır, negatif, çok büyük, NaN, Infinity, üstel, belirsiz binlik ve yapıştırma regresyonları |
| Hata metni alan adına karışıyor                               | Açıklama aynı label içinde                                        | Sabit erişilebilir ad ve ayrı aria-describedby hata ilişkisi; ad değişmeden invalid durumu testli                                                                  |
| `85,5` kilo basamağı yanlış ayrılıyor                         | Virgül hem liste hem ondalık ayracı                               | Liste ayracı `;`, ondalık virgül/nokta; `90; 85,5; 80` kalıcı kayıt testi. Geçersiz parçalar sessizce atılmaz                                                      |
| Çok kısa vlog kaydedilemiyor                                  | 0,1 sn sabit trim sınırı negatif üst sınır üretiyor               | Gerçek süreyle sınırlı başlangıç/bitiş; çalışma anında üretilen kısa WebM kaydı ve tam yedek gidiş dönüşü geçti                                                    |
| WebKit offline seed worker erişim hatası                      | Her açılışta gereksiz worker ve eşzamanlı StrictMode başlatmaları | Güncel DB kontrolü, tek paylaşılan hazırlık, çalışan yerel transaction fallback. Üç entegrasyon testi ve iki motor offline E2E geçti                               |

Son Faz 1 kapısı: **lint/typecheck/173 birim/build yeşil; Pixel 7/Chromium ve iPhone 14/WebKit 20/20 E2E; açık/koyu 26 Axe görünümünde sıfır ihlal.** Playwright MCP 390×844 ve 412×915 boyutlarında iki tema, boş alan ve `12,5` girişi doğruladı; taşma görülmedi. Başlangıçtaki bir E2E koşusu build çıktısı yenilenirken başladığı için boş sayfa yakaladı; derleme ve test sırası ayrıldı. Bulgular gizlenmedi veya assertion'lar kaldırılmadı; eski invalid testleri yeni erken alan doğrulaması ve kalıcılık kanıtıyla güncellendi.

DB/OPFS adları, kişisel kayıtlar, eski meal snapshot değerleri ve backup formatı değişmedi. Bu aşamada veri migration'ı gerekmedi. UI NumericInput sınırları domain'e geçersiz taslak göndermez; otomatik kayıt alanlarında son geçerli değer korunur, optional alan temizliği yokluk olarak saklanır.

Fiziksel Android/iPhone testi: **NOT RUN**, bu oturumda bağlı fiziksel cihaz doğrulaması yok. Yeni BERxFIT marka, ana ekran, rehber ve yeni özellik aşamaları henüz tamamlanmış veya yayınlanmış sayılmaz.

## Faz 2 · Marka ve tasarım sistemi

Orijinal sahip logosu header, karşılama, web/PWA ikonları, iOS splash ve Android launcher/splash için içerik kesilmeden türetildi. Dark-first navy/blue/cyan tema, açık tema, semantic renkler, kompakt kalori/makro ve tahmini aktivite, öne alınmış su/öğünler ve desktop gezinme uygulandı. `3.0.0-rc.1` yerel geliştirme sürümü; appId ve yerel veri kimlikleri değişmedi.

Son kapı: **lint/typecheck/173 birim/build; 20/20 mobil E2E; iki temada 26 Axe görünümünde sıfır ihlal.** İlk tur açık tema puan kartındaki üç eski renk ve eski dört halka CSS seçicisi tespit edildi; semantik renkler ve dört gerçek metriği ayrı doğrulayan assertion ile düzeltildi, tam paket tekrar geçti. Hareket/öğün, offline, medya ve tam yedek regresyonları korundu.

Playwright MCP: 390×844 ve 412×915 iki tema; yazıyla öğün, toplam güncellemesi ve yenileme sonrası kalıcılık; 320/360/390/412/430/768/1024/1440 ana ekran taşma yok; 1024 px beş ana ekranın iki temasında taşma yok, pageerror yok. Ekran görüntüleri ignored `docs/qa/berxfit-phase2-*`. Native kaynak ikonları üretildi; yeni APK derlemesi/telefona kurulum bu aşamada **NOT RUN**. CI ve yayın kapısı sonraki teslim aşamasında.

## Faz 3 · Beslenme ve gerçek haftalık özet

Öğün miktarı düzenleme, aynı snapshot ile tekrar ekleme, onaylı silme ve kimlik bazında tekil geri alma uygulandı. Kopya fotoğrafı ödünç almaz; orijinal medya korunur. Kaydedilen kcal/protein/carb/fat, kaydın kendi miktarına göre orantılanır; güncel katalog eski değeri değiştirmez. Sıfır miktarlı legacy kalem sessizce tahmin edilmez. Özel besinler kullanıcı beyanı kaynağıyla kaydedilir, miktar/porsiyon onayı ayrıdır; eksik makrolar bilinmiyor kalır. Başarısız yazımdan sonra tekrar deneme aynı yeni kayıt kimliğini kullanır.

Haftalık kart gerçek beslenme günleri, tamamlanmış seanslar ve tarihli manuel/Health Connect tartılarından türetilir. Boş günler ortalamaya sıfır katılmaz. Hesap domain’i geçersiz kaynak, finite olmayan referans ve sayı taşmasını reddeder.

Son kapı: **lint/typecheck/188 birim/build yeşil; Pixel 7 + iPhone 14 yeni nutrition E2E 2/2; iki temada genişletilmiş 30 Axe görünümünde sıfır ihlal.** E2E özel besin 200 kcal/20 g protein/10 g carb/5 g fat referansından 150 g = 300/30/15/7,5 hesabını, 75 g düzenlemeyi, boş miktarın engellenmesini, kopya/sil/geri al ve tam ZIP geri yükleme sonrası iki kaydın/toplamların eşleşmesini doğrular. WebKit uzun entegrasyon ilk 90 sn sınırını restore devam ederken aştı; medya kurtarma senaryosuna benzer şekilde bu kapsamlı test 180 sn sınırla 96 sn’de geçti. Başarı assertion’ları korunmuştur.

Playwright MCP 390×844/412×915 iki tema: `1,5` miktar girişi, kaydet/yenile, editör ve özel besin ekranları; taşma ve pageerror yok. Mevcut Faz 2 tam 20 E2E regresyonunun yerine bu iki test geçirilmiş sayılmaz; tam birleşik paket teslim kapısında tekrar çalıştırılacak. Yeni sourceKind user yedek şemasında desteklenir, eski format/alanlar korunur. Fiziksel cihaz: NOT RUN.
