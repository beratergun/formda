# BERxFIT v3 veri geçişi

BERxFIT, yayınlanmış Formda v2 kodunun devamıdır. Mevcut uygulama kaydı korunur; veri temizleyen veya yeni boş veritabanına taşıyan bir geçiş yoktur.

| Kimlik                   | v3 kararı                                       |
| ------------------------ | ----------------------------------------------- |
| Pages başlangıç ve scope | `https://beratergun.github.io/formda/` korunur  |
| IndexedDB                | `yol-local` korunur                             |
| OPFS medya               | `yol-media` korunur; Blob fallback aynı         |
| Tema                     | `yol-theme` korunur                             |
| ZIP                      | `yol-backup`, version 1; yeni alanlar opsiyonel |
| Android appId            | `io.github.beratergun.formda` korunur           |
| Android imza             | v2 APK sertifikasıyla eşitlik CI kapısı         |
| Eski sürümler            | v1.0.0 / v2.0.0 etiketleri ve ekleri korunur    |

Yeni su defteri ilk girişte mevcut `water × 250` miktarını `waterBaseMl` olarak korur. Eski saat bilgisi yoksa üretilmez. `waterEntries` yalnızca yeni kimlikli ml girişleridir. Eski toplam ve yeni girişler tek kez toplanır; eski `water` alanı bardak karşılığıyla uyumlu tutulur. Tutarsız toplam veya yinelenen kimlik içeren yeni ZIP reddedilir.

Antrenman `session`, `cancelledAt`, sayaç ve stil alanları opsiyoneldir. Eski setler değişmez. Süre kaydı olmayan eski statik setlerden saniye tahmin edilmez. Öğün düzenlemesi kaydedilmiş makroları orantılar; katalog güncellemesi geçmişi yeniden hesaplamaz. `sourceKind: user` özel besinleri yedekte korunur.

Manuel tartıyı silmek gün satırını, notu, suyu, ölçüleri veya bağlı sağlık tartısını silmez. Aynı tarihte manuel tartı önceliklidir; kaldırıldığında varsa bağlı kaynağın değeri görünür.

## Doğrulama

Orijinal veritabanını tekrar açma, seed tekrarında eski kayıtların korunması ve ZIP encode/decode/sil/restore eşitliği otomatik testlidir. Son ZIP fikstürü manuel/sağlık tartısı, su defteri, kalıcı seans ve gerçek ikili medya baytlarını birlikte içerir. Silme denemeleri yalnızca izole kurgusal test veritabanında yapılır. Kullanıcının kurulu cihazına bu oturumda erişilmedi; fiziksel APK yerinde güncellemesi **NOT RUN**.

## Kullanıcı geçişi

Formda v2 PWA aynı adreste güncelleme alır. Formda v2 APK için yalnızca aynı applicationId ve sertifikalı v3 APK yerinde güncellenebilir; CI iki sertifikayı karşılaştırmadan paketi yayınlamaz. Her durumda Profil → Tam yedek ile doğrulanabilir bir kopya saklanabilir. Uygulama verisini veya eski kurulumu silmek bu güncellemenin adımı değildir.

Eski **Yol v1 APK** farklı applicationId taşır. Onun verisi tam ZIP ile BERxFIT'e aktarılır; yedek ve medya doğrulanmadan eski kurulum kaldırılmaz. PWA ve APK da ayrı uygulama alanlarıdır; aralarında ZIP kullanılır.

## Repo adı

Ürün, dosyalar ve yeni release BERxFIT'tir. `beratergun/formda` ve `/formda/` yolu kurulu PWA başlangıçlarını ve mevcut release bağlantılarını korumak için bu teslimde tutulur. `beratergun/berxfit` hazır veya yayınlanmış adres olarak sunulmaz. Hesap düzeyinde isim değiştirme ayrı yetkili işlemdir; gerekli olursa önce manifest kimliği/eski scope güncellemesi, Pages köprüsü, `yol` yönlendirmesi, README/release bağlantıları ve kurulu PWA yükseltmesi birlikte test edilmelidir. Mevcut repo silinerek yeni repo açılmaz.
