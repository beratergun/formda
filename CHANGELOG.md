# Değişiklikler

## [2.0.0] - 2026-10-30

- Formda markası, yeni ikon/logo, `/formda/` PWA adresi ve `io.github.beratergun.formda` Android kimliği. Eski web adresi veriyi silmeden yeni adrese yönlenir.
- Koç kartı, dört günlük halka, tutarlı açık/koyu tema, haftalık hedefler, rozet/rekor duvarı ve paylaşılabilir aylık hikâyeler.
- Beş hazır program ve korunan kişisel plan; ekipmana uyarlama, güne özel salon/ev/kısa alternatifleri ve hareket değiştirme.
- 159 hareket, 34 salon aleti, başlangıç/bitiş vektör pozları, kas haritaları ve ayrıntılı güvenli kullanım rehberleri.
- İlk 619 kaydın resmi kaynak denetimi; kaynak kimlikleriyle 797 yiyecek ve malzemeleri/porsiyonları görülebilen 160 örnek tarif. Geçmiş öğün kalori anlık görüntüleri korunur.
- MET/set/RPE ve adım bazlı tahmini enerji; günlük hedefe ekleme varsayılan kapalı, yüzde ayarı kullanıcıya ait.
- Android Health Connect: açık izinle adım, aktif kalori, egzersiz, kilo ve uyku için yalnızca okuma. PWA elle adım/aktif kalori kaydı. Android 8+ gerektirir.
- İsteğe bağlı, Apache-2.0 Food101 modeliyle cihazda üç yemek önerisi. İlk indirme açık onayla, sonra çevrimdışı; yiyecek ve porsiyon kullanıcı onayıyla kaydedilir. 101 sınıf Türk mutfağının tamamını kapsamaz.
- 140 birim testi, iki mobil tarayıcıda 18 E2E ve iki temada 26 erişilebilirlik görünümü. Tam yedek eski/yeni alanlar ve medya baytlarını korur.

Eski Yol APK'sındaki veriyi Profil → Tam yedek ile alıp Formda'ya geri yükle. Yedeği doğrulamadan eski uygulamayı kaldırma. PWA aynı origin üzerindeki veri adlarını korur. APK, release Secrets yoksa Android geliştirme sertifikalı debug varyantıdır.

[2.0.0]: https://github.com/beratergun/formda/releases/tag/v2.0.0

## [1.0.0] - 2026-10-30

Formda'nın telefona kurulabilen ilk sürümü.

- Standalone PWA, Android/iPhone kurulum rehberi, çevrimdışı kullanım, açık/koyu tema ve yerel fontlar.
- Aynı React kaynak kodundan Capacitor Android paketi; otomatik debug ve isteğe bağlı imzalı release APK derlemesi.
- 619 yiyecek, Türkçe öğün ayrıştırma, çiğ/pişmiş gramaj, tarif/porsiyon hesabı ve açık Open Food Facts sorgusu.
- 84 hareket, tam ekran set kaydı, dinlenme sayacı, ilerleme, rekor, yüzme ve kardiyo kontrolleri.
- Altı aydan beş yıla ve süresiz bakıma uzanan düzenlenebilir plan; hafif haftalar ve değerlendirme döngüleri.
- Hayalet hizalamalı fotoğraf, önce/sonra karşılaştırması, seçili karelerden dönüşüm videosu; vlog kaydı, kırpma ve bir saniye anıları.
- Günlük/haftalık/aylık rapor, PNG kartı, yazdırma, grafikler, yerel asistan, puan/XP/seri ve 153 özgün söz.
- PIN kilidi, yerel medya, tam ZIP yedek/geri yükleme, CSV/ICS ve eski JSON aktarımı.
- 95 birim testi, 8 mobil E2E; tam yedekte kayıt ve medya baytlarının eşitliği; erişilebilirlik ve performans kontrolleri.

APK, release imza sırları yoksa Android geliştirme sertifikalı debug varyantıdır. İmza ve SHA-256 doğrulaması yayın artifact'larıyla birlikte sağlanır.

[1.0.0]: https://github.com/beratergun/formda/releases/tag/v1.0.0
