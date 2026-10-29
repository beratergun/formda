# Güvenlik

Desteklenen sürüm: 1.x. Güvenlik sorunu bildirirken herkese açık issue'ya kişisel günlük, fotoğraf, video, yedek veya anahtar ekleme. [GitHub profilimdeki](https://github.com/beratergun) iletişim kanalını kullanarak önce özel olarak paylaş; yeniden üretim için kurgusal veri yeterlidir.

Uygulamanın hesap veya uygulama sunucusu yoktur. IndexedDB/OPFS kayıtları cihazın ve tarayıcının güvenlik sınırına bağlıdır. PIN uygulama içi erişim kilididir; medya ve yedekler için cihaz şifrelemesi iddiası taşımaz. Tarayıcı alanını temizlemek yerel verileri silebilir.

Kullanıcı açıkça ürün sorgulamadıkça Open Food Facts'e istek yapılmaz. Otomatik analitik, hata yükleme, bulut yedekleme veya uzaktan medya işleme bulunmaz. Android'in otomatik bulut veri yedeği kapalıdır. Paylaşım ve dosya dışa aktarımının alıcısını kullanıcı seçer.

Yayın APK'sının SHA-256 dosyası ve derleme iş akışı release'ten doğrulanabilir. Release keystore'u yalnızca GitHub Secrets'ta tutulur; repoya veya build loglarına yazılmaz. Debug APK, geliştirme sertifikası kullanır ve mağaza imzası olarak sunulmaz.
