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

Uyumluluk yönü eski v1/v2 yedeğinin v3'e aktarılmasıdır. v3'ün yeni su defteri, seans ve özel besin alanlarını eski uygulamaya geri yükleme garanti edilmez; aynı ZIP sürüm numarası iki yönlü uygulama uyumluluğu anlamına gelmez. Geçiş öncesi özgün yedek ayrı saklanır.

Manuel tartıyı silmek gün satırını, notu, suyu, ölçüleri veya bağlı sağlık tartısını silmez. Aynı tarihte manuel tartı önceliklidir; kaldırıldığında varsa bağlı kaynağın değeri görünür.

## Doğrulama

Orijinal veritabanını tekrar açma, seed tekrarında eski kayıtların korunması ve ZIP encode/decode/sil/restore eşitliği otomatik testlidir. Son ZIP fikstürü manuel/sağlık tartısı, su defteri, kalıcı seans ve gerçek ikili medya baytlarını birlikte içerir. Silme denemeleri yalnızca izole kurgusal test veritabanında yapılır. Kullanıcının kurulu cihazına bu oturumda erişilmedi; fiziksel APK yerinde güncellemesi **NOT RUN**.

31 Ekim'de yayımlanmış gerçek v2 PWA ZIP'i (SHA-256 `14846382680ea4748709f84e895d9ed177461070c0ae25880881a8ba4d7c0767`) aynı izole localhost origin/scope üzerinde açıldı. Chromium ve WebKit'te kurgusal öğün, su, not ve fotoğraf kaydedilip mevcut uygulamanın **Güncelle** düğmesiyle 3bd4748 kaynağının v3 build'ine geçildi. Tüm object store satırları, fotoğraf/thumbnail/OPFS baytları ve tema güncelleme öncesiyle birebir eşleşti. Offline yenilemede öğün 220 kcal kaldı; eski bir bardak 250 ml gösterildi, üzerine yeni 100 ml giriş eklenerek 350 ml kalıcı doğrulandı. Harici istek/yazım/pageerror yoktu. Bu gerçek service worker geçiş testi fiziksel telefon veya APK imza testi değildir.

## Kullanıcı geçişi

Formda v2 PWA aynı adreste güncelleme alır. Formda v2 APK için yalnızca aynı applicationId ve sertifikalı v3 APK yerinde güncellenebilir; CI iki sertifikayı karşılaştırmadan paketi yayınlamaz. Her durumda Profil → Tam yedek ile doğrulanabilir bir kopya saklanabilir. Uygulama verisini veya eski kurulumu silmek bu güncellemenin adımı değildir.

31 Ekim ilk v3 Android CI sertifika kapısında durdu; sonraki tanılamada eski metin ayrıştırıcısının iki SHA alanını boş okuduğu görüldü. Bu ilk sonuçlar tek başına sertifika farkı kanıtı değildir. PEM/X509 karşılaştırmasına geçildi ve [CI 41194362584](https://github.com/beratergun/formda/actions/runs/41194362584) iki gerçek sertifikayı farklı buldu:

- Yayımlanmış v2 sertifikası: `c5b094d15c64f2d649bff19b3dad65376a9e1a974c328288d9ff942e2fa9c0d9`.
- O CI adayının sertifikası: `6312c8c504f2198a3e40d762bb4f7475440bea418400390cb143821af9496398`.

Gradle signingReport gerçek debug yolunu `~/.config/.android/debug.keystore` olarak gösterdi; eski cache `~/.android/debug.keystore` yolunu izlediğinden v2 job dosyayı saklamamış. Güncel cache yolu düzeltildi; yalnızca sertifika kapısını geçen eşleşen debug anahtarı saklanabilir. Yanlış yeni anahtar veya release anahtarı cache'e kaydedilmez. Erişilebilir yerel/cache yedeklerinde eski anahtar bulunamadı; yayımlanmış APK özel anahtar yedeği değildir. Eski sertifikaya ait keystore yedeği veya kullanıcı tarafından seçilmiş ayrı kimlikle yan yana kurulum beklenir. PWA yayını bağımsız olarak tamamlandı. Eski uygulama/veri silinmez.

Eski **Yol v1 APK** farklı applicationId taşır. Onun verisi tam ZIP ile BERxFIT'e aktarılır; yedek ve medya doğrulanmadan eski kurulum kaldırılmaz. PWA ve APK da ayrı uygulama alanlarıdır; aralarında ZIP kullanılır.

## Repo adı

Ürün, dosyalar ve yeni release BERxFIT'tir. `beratergun/formda` ve `/formda/` yolu kurulu PWA başlangıçlarını ve mevcut release bağlantılarını korumak için bu teslimde tutulur. `beratergun/berxfit` hazır veya yayınlanmış adres olarak sunulmaz. Hesap düzeyinde isim değiştirme ayrı yetkili işlemdir; gerekli olursa önce manifest kimliği/eski scope güncellemesi, Pages köprüsü, `yol` yönlendirmesi, README/release bağlantıları ve kurulu PWA yükseltmesi birlikte test edilmelidir. Mevcut repo silinerek yeni repo açılmaz.
