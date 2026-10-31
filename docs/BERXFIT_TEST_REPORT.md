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

## Faz 4a · Kesintiye dayanıklı antrenman

Seans başlangıcında plan hareketleri TemplateExercise biçiminde snapshot alınır; ekle/çıkar/sırala yalnızca bu seansı değiştirir. Set ekleme son Store durumundan atomik; kaldırılan hareketin setleri korunur. Not, stil, aktif hareket, dinlenme, ısınma/soğuma ve aralık sayaçları kalıcıdır. Duraklatma tüm süreleri dondurur; devamda kalan süre korunur. Enerji ve günlük/özet süreleri aynı aktif süre fonksiyonunu kullanır. İptal, kayıtları silmeden cancelledAt ile işaretlenir; done=false olduğundan sayım/enerji/rekora katılmaz. Tamamlanma başarısı kalıcı yazımdan sonra gösterilir; yazım hatasında tamamlanma geri alınır. Seans kimliği URL içinde kaldığından bitiş özetinde yenileme yeni seans yaratmaz.

Tam ekranın arkasında kalan gezinme/başlık klavye odağından çıkarıldı; kayıt durumu seans içinde görünür. Yenilemede değeri dolu seans notuna sabit erişilebilir ad verildi. Store boş patch işlemini yok sayarak yanlış sürekli Kaydediliyor durumunu önler.

Son kapı: **lint/typecheck/194 birim/build; mevcut iki set senaryosu + yeni seans senaryosu iki motorda 4/4; 34 Axe görünümünde sıfır ihlal.** Yeni E2E duraklat/yenile/not/dinlenme, düğmenin durması, sıra kalıcılığı, ekleme/çıkarma, tamamlanan hareketi listeden çıkarsa da setin korunması, özetin yenilenmesi ve iptal sonrası haftalık tamamlanan seans sayısının 1 kalmasını doğrular. Var olan tam ZIP testi duraklatılmış seansın bütün sayaçlarını/notunu/stilini de birebir encode/decode/restore eder.

MCP 390×844 ve 412×915, açık/koyu tercih localStorage ile yenilemede korunarak kontrol edildi; doğru tema, Cihazda kayıtlı durumu, seans URL kimliği ve taşmasız ekran doğrulandı. Kaydedilmiş not ve dinlenme önceki tarayıcı kontrolünde de korundu, pageerror yoktu. İlk E2E turu not alanının reload etiket sorgusunu yakaladı; sabit ad düzeltmesi sonrası geçti. İlk genişletilmiş Axe koşusunda otomasyonun duraklatılmış seçiciyi devam etmeden değiştirmesi engellendi; uygulama kontrolü aşılmadı, senaryo sırası düzeltilerek 34 tarama tamamlandı.

Faz 4b görsel rehber çalışması bu sonuca dahil değildir. Fiziksel cihaz: NOT RUN. Yeni optional session/cancelledAt/swimStyle alanları aynı DB ve v1 yedek formatında korunur.

## Faz 4b · Teknik rehber ve süreli tutuş

Çekirdek 10 + goblet için ayrı kaynaklı özgün 2D şema, ortak oranlar/ekipman/yön/ipuçları; başlangıç/bitiş, karşılaştır, oynat/duraklat/başa al, hız ve büyük görünüm tamamlandı. 159 hareket/34 alet ve mevcut metinler korunur; 11 şema, 148 açık metin/kas rehberi fallback. Genel figür yanlış varyanta atanmaz. Kaynaklar, tercih edilen yaklaşım ve sınırlar `BERXFIT_EXERCISE_GUIDANCE.md` içinde. Kütüphaneye kas/ekipman yanında zorluk, hareket türü, ortam ve odak filtreleri/boş sonuç durumu eklendi.

Plank ve belirlenen statik tutuşlar saniye kaydeder; uydurma kg/tekrar yok. Geçmiş ve önceki seans doğru birimi gösterir. Ana/destek kas grupları ayrılır, ön kol etiketi anatomik olarak üst kol etiketlerinden ayrıldı. İç içe pencerelerde Escape yalnızca en üst pencereyi kapatır ve kaydırma kilidi son pencereye kadar kalır. Bir bileşen testi ve gerçek tarayıcı iki katmanlı Escape senaryosu bu hatayı doğrular.

Son kapı: **lint/typecheck/200 birim/build; sekiz ilgili E2E 8/8 iki motorda; 40 Axe görünümü sıfır ihlal.** On çekirdek hareketin iki pozu, oynat/duraklat/başa al/hız/büyüt, statik plank, azaltılmış hareket, 45 sn tutuşun geçmişe doğru kaydı, aparat fallback ve mevcut seans yaşam döngüsü testlendi. WebKit poz geçişi assertion’ı gerçek zamanlı yükte kararsız olduğundan resmi Playwright Clock API ile 1.201 ms kontrollü ilerletilir; geçiş assertion’ı kaldırılmadı.

MCP 19 çekirdek poz ve goblet kareleri görsel incelendi; 390×844/412×915 açık-koyu Goblet/Plank/Row, büyüt/iki Escape, taşma ve pageerror yok. Son göğüs hizası düzeltmesi iki temada ayrıca yeniden görüldü. Görseller ignored docs/qa altında. Şemalar uzman tarafından kişiye özel form doğrulaması veya kesintisiz video olarak sunulmaz. Fiziksel cihaz: NOT RUN. Tam birleşik E2E, kapsam ve yayın kapısı teslim aşamasında tekrar çalıştırılacak.

## Faz 5a · Su giriş defteri

Eski 250 ml bardak toplamı ilk yeni kayıtta ayrı bir taban olarak korunur. Yeni 100/250/500 ml ve özel miktar girişleri kimlik/saat taşır. Hedef ml ile düzenlenir; geçmişte tek giriş veya saati bilinmeyen eski toplam düzeltilebilir ve onayla silinebilir. Bir girişin değiştirilmesi diğer girişleri etkilemez. Tarih seçimi günleri ayırır. Anlık Store güncellemesi hızlı çift tıklamada iki gerçek giriş oluşturur; aynı kimliğin yeniden uygulanması tekildir.

210 birim, lint/typecheck/build geçti. ZIP round-trip yeni taban/giriş/saatleri ve diğer alanları birebir geri getirir. Tutarsız toplam ve yinelenen kimlik içeren ZIP, mevcut kayıtlara dokunmadan reddedilir. İlk 10 ilgili E2E'de 8 geçti; iki eski offline assertion bardak metnini aradığı için güncellendi. Son dört tekrarda offline + yeni su akışı iki motorda 4/4 geçti; yeni akış tarih ayrımını da doğrular. Önceki altı antrenman/tema/hikâye E2E aynı derlemede geçti.

Playwright MCP 390×844 ve 412×915 iki tema: ekle, geçmiş, düzenle, kaydet; taşma ve pageerror yok. Açık/koyu kart ve düzenleyici ekran görüntüleri ignored docs/qa altında incelendi. Genişletilmiş Axe sonucu bu aşamanın kapanışında kaydedilecek. Fiziksel cihaz NOT RUN; yeni yayın henüz yok.

Faz 5a kapanışı: iki temada **46 Axe görünümü, sıfır ihlal**. Son lint/typecheck tekrar yeşil. Toplam 210 birim; uygulama derlemesi aynı ve başarılı. Su/çevrimdışı 4/4 son tekrar + diğer altı ilgili E2E geçti.

## Faz 5b · Tartı ve gerçek ilerleme

Ortak tarihli tartı sayfası hızlı ekleme ve İlerleme bölümünden açılır. Bir tarihte tek manuel tartı tutulur; güncelleme yalnızca kilo alanını değiştirir. Silme ayrı onay ister, günlük not/su/ölçüler ve bağlı kaynak tartısı korunur. Manuel tartı önceliği açıkça belirtilir. Tarih değişince sayı taslağı sıfırlanır; geçersiz tarih/gelecek ve geçersiz sayılar reddedilir. Kaydetme kalıcı yazımı bekler; hata olduğunda pencere açık kalır. Not hızlı eklemesi de kalıcı yazımı bekler.

Dönem raporları gün, öğün ve antrenman tarihlerinin birleşimini kapsar; öğün olmayan günler beslenme ortalamasına sıfır katılmaz. Beslenme günü sayısı ayrı belirtilir, veri yokken arayüz — gösterir. Tartı farkı manuel/bağlı kaynak önceliğini korur. Su hedefi/koç/geçmiş grafiği/günlük ml birimiyle tutarlıdır, kayıtsız su günleri grafikte null kalır. Süreli hareketler saniye grafiği ve saniye rekoru gösterir; eski süresiz kayıttan süre tahmini yapılmaz. Mevcut ağırlık/tekrar/1RM özelliği diğer hareketlerde korunur.

İlk ve son lint/typecheck/215 birim/build geçti. Yeni domain regresyonları tarihli düzenleme/silmede diğer verilerin korunması, bağlı kaynak fallback, bir tarihte tek kayıt, geçersiz tarih/kilo ve yalnızca kayıtlı beslenme günlerinden ortalamayı doğrular. Tam ZIP testi manuel + sağlık tartısını birlikte korur. MCP iki telefon/iki temada tartı gir/düzenle akışı, taşmasız ekran, pageerror yok; dört ekran görüntüsü incelendi. E2E ve genişletilmiş Axe son kapısı henüz sürüyor; aşağıdaki kapanış sonucu olmadan tamamlandı sayılmaz.

Faz 5b kapanışı: son lint/typecheck/215 birim/build yeşil; iki motorda yeni tartı/süre grafiği/sayı/su **10/10**, mevcut plan/tema/doğrulama senaryosu **2/2**; **48 Axe görünümü sıfır ihlal**. Hareket seçicisinin sabit erişilebilir adı eksikti; ilk genişletilmiş test bu seçicide bekledi, düzeltilip tüm ilgili paket baştan geçti. MCP gerçek 45 sn tamamlanmış plank grafiğini iki telefon/iki temada ayrıca doğruladı; grafikte gerçek 45 sn noktası ve rekor var, 1RM kartı yok. Su hedefi Bugün 2500 → Planım 2500 → Planım 3000 → Bugün 3000 akışı geçti. Fiziksel cihaz NOT RUN. Tam birleşik teslim kapısı sırada.

## Faz 6 · Son yerel kapı ve yayın adayı

31 Ekim 2026: **lint/typecheck/217 birim/build yeşil; tam mobil E2E 32/32 (5,3 dk); iki temada 56 Axe görünümü sıfır ihlal.** Axe etiketleri WCAG 2.0 A/AA, 2.1 AA ve 2.2 AA; yeni dört kurulum adımı da dahil. Domain kapsamı satır %99,85; fonksiyon %100; dal %97,03; ifade %99,11. Bunlar otomatik kapsam ölçümleridir; eksiksiz manuel WCAG sertifikası olarak sunulmaz.

Güncelleme düğmesi artık pending yerel yazımların bitmesini bekler. İki yeni bileşen regresyonu yazım tamamlanmadan reload istenmediğini ve yazım hatasında güncellemenin devam etmediğini doğrular. Tamamlanan statik seansın özeti/rekoru saniye kullanır; eski süresiz kayda 0 sn uydurulmaz. Kaydedilmiş öğün tarihi için DayLog satırı yoksa beslenme trendi yine gerçek öğünden hesaplanır. Günlük PNG raporunda su ml ile gösterilir.

İlk 320 px kontrolde aylık takvimin 7×44 px sütunları sayfayı taşırdı. Takvimin kendi erişilebilir scroll bölgesi ve dar ekran açıklaması eklendi; günler 44×46 px kalır, sayfa taşmaz. Mevcut plan/tema E2E'ye 320 px gerçek Pazar seçimi ve hedef boyutu assertion'ları eklendi. Son MCP kontrolü **320/360/390/412/430/768/1024/1440 × iki tema × beş ana ekran = 80/80**, taşma/pageerror yok. İki telefon/iki tema su, tartı, gerçek 45 sn plank ve iç içe pencere akışları önceki kapılarda ayrıca doğrulandı. Ham görüntüler ignored docs/qa altında.

MCP tarayıcısında ortamın Kaspersky script enjeksiyonuna ait ağ istekleri görüldü; bunlar uygulama kodu veya dağıtılan HTML içinde bulunmaz. Bağımsız Chromium/WebKit offline E2E ağ denetimi iki motorda uygulamanın dış isteksiz akışını doğruladı. Güvenlik yazılımı ayarları değiştirilmedi.

Performans ilk BERxFIT ölçümünde 71, kaynak görsel ve kritik yük iyileştirmelerinden sonra yerel Windows'ta **95/100/100**. Ana giriş JS'i yaklaşık 494→383 KB (gzip 160→125 KB); original logo SHA aynı. Kayıpsız responsive WebP, PNG favicon, ihtiyaçta kamera/program/ZIP/Bugün kodu ve ortak medya modülü kullanılır. Kullanılmayan orijinal raster/SVG kaynakları dağıtımda korunur ama precache'e girmez; gereken offline görseller ve kodlar kalır. Offline paket yaklaşık 5,9→4,7 MiB. Mevcut Lighthouse script/CI 96/100/100 eşiği **düşürülmedi**; yerel 95 bu daha sıkı scripti geçirmez. Yayın becerisinin asgari 90/95/95 eşiği sağlanır; üretim CI sonucu doğrulanmadan canlı yayın tamamlandı sayılmaz.

28 kurgusal ekran, iki tema kolajları, 24 sn GIF, 1280×640 sosyal önizleme, iki kurulum düğmesi ve repo dışındaki yedi carousel/1200×1200 kapak üretildi ve incelendi. TR/EN metinleri 194/219 kelime; sunum ölçüleri ve README'nin 27 yerel bağlantısı geçti. Android kaynakları sürüm 3.0.0/code 3; eski appId ve debug cache anahtarı aynı. Yeni workflow v2 sertifikasıyla eşitliği, release etiketi/sürümü, beş READ/WRITE yokluğunu kontrol eder; aynı adlı varlığı clobber etmez. CI ve APK statik doğrulaması bu satır yazılırken henüz çalışmadı. Fiziksel cihaz NOT RUN. Güncel sonraki durum yayın kontrol dosyasına eklenecek.

Güvenlik son taraması: npm audit --omit=dev runtime 0/0/0/0; tam ağaç 2 düşük + 23 orta, 0 yüksek/kritik. Yüksek riskli force/downgrade uygulanmadı; bilinen sınırlar belgesinde dev araç zinciri ayrıldı. Metin kaynaklarında sahip dışında imza yok; binary sanat dosyasının rastlantısal grep eşleşmesi imza değildir, orijinal PNG metadata alanları boş ve SHA korunmuştur.
