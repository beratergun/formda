# Eski ad denetimi · Formda v2

`git grep -niE "\byol\b"` yayın öncesinde tekrar çalıştırılır. Kalan kullanımlar aşağıdaki bilinçli gruplardadır:

| Kullanım                                                             | Koruma nedeni                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `yol-local` IndexedDB, `yol-media` OPFS                              | Aynı origin üzerindeki mevcut kişisel verinin bulunduğu alanlar; ad değiştirmek boş veritabanı/klasör açardı. |
| `yol-theme`, `yol-errors`, `yol-install-dismissed`, `yol-reminder-*` | Mevcut tema, hata ve kurulum/hatırlatma tercihleri korunur.                                                   |
| `yol-backup`                                                         | Eski ZIP yedeklerinin biçim imzası; yeni sürüm aynı v1 biçimini ek alanlarla okuyabilir.                      |
| ICS UID `yol-*`                                                      | Önceden eklenmiş takvim etkinlikleri yeniden içe aktarılınca kopya oluşmaması.                                |
| Testlerde aynı anahtarlar                                            | Geriye uyumluluğun gerçekten doğrulandığını gösterir.                                                         |
| Eski APK ve `/yol/` adresi açıklamaları                              | Kullanıcıya yedek/geri yükleme ve yönlendirmeyi anlatmak için gereken tarihsel ad.                            |
| Önceki kilometre taşı belgeleri                                      | O aşamadaki ölçüm ve teslim yollarının tarihsel kaydı; güncel sürüm belgesi olarak sunulmaz.                  |
| “yol haritası”, “yol açmak”, “Yol aldığın her yer” ve sözler         | Türkçedeki genel sözcük; uygulama markası değildir.                                                           |

Uygulama adı, paket, Android namespace/appId, manifest, başlıklar, ikon, yayın dosyaları, repo, canlı URL ve güncel tanıtım paketi Formda'dır. Bilinçli veri adları otomatik silinmez veya yeniden oluşturulmaz.
