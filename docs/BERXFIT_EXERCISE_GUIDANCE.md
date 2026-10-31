# berXfit · Teknik hareket rehberi

Durum: Faz 4b tamamlandı; kalite ve görsel doğrulama kanıtları BERXFIT_TEST_REPORT.md içinde.

Özgün, uygulama içinde çizilen 2D teknik şemalar kullanılır. Aynı gövde ve uzuv oranları korunur; ekipman, başlangıç/bitiş, hareket yönü ve kısa teknik ipucu her harekete ayrıdır. Bunlar kesintisiz bir video veya kişiye özel form analizi değildir. Oynat düğmesi iki öğretici pozu sırayla gösterir. Azaltılmış hareket tercihinde otomatik geçiş kapalıdır. Plank tek statik duruştur ve saniye olarak kaydedilir; kg/tekrar uydurulmaz.

## Seçilen yaklaşım

- Özgün 2D: cihazda çalışır, dış medya isteği yoktur; kaynaklara göre gözden geçirilebilir, küçük ve bakımı açıktır. Tercih edildi.
- Lisanslı hazır animasyon: bu proje için lisansı doğrulanmış bir set sağlanmadı; varmış gibi eklenmedi.
- 3D: güvenilir rig, her harekete uygun eklem davranışı ve cihaz performansı doğrulanmadan ağır motor eklemek yerine 2D seçildi.
- Video: dışarıdan telifli klip/resim alınmadı. Mevcut kamera/vlog kayıtları kullanıcıya aittir ve rehber varlığı olarak kullanılmaz.

## Teknik referanslar

Kaynaklardaki görsel veya video dosyaları indirilip uygulamaya konmaz. Türkçe metinler ve şemalar özgündür; aşağıdaki kaynaklar teknik gözden geçirme içindir.

| Hareket              | Referans ve uygulama sınırı                                                                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vücut ağırlığı squat | [ACE](https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/): dengeli ayak, diz yönü ve kontrollü derinlik                                                                                                                               |
| Goblet squat         | [ACE](https://www.acefitness.org/resources/everyone/exercise-library/362/goblet-squat/): dambıl göğse yakın, kontrollü squat; ek 11. şema                                                                                                                               |
| Şınav                | [NASM](https://www.nasm.org/resource-center/exercise-library/push-up): gövde bir bütün, kontrollü dirsek büküşü                                                                                                                                                         |
| Barbell bench press  | [NASM](https://www.nasm.org/resource-center/exercise-library/barbell-bench-press): sabit ayak/kürek kemikleri, kontrollü bar yolu ve güvenlik desteği                                                                                                                   |
| Lat pulldown         | [ACE](https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/): diz pedi, göğüs önüne çekiş, gövdeyi savurmama                                                                                                                          |
| Dumbbell curl        | [ACE](https://www.acefitness.org/resources/everyone/exercise-library/44/seated-biceps-curl/): oturarak gösterim; üst kol ve bilek kontrolü                                                                                                                              |
| Omuz press           | [ACE](https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/): oturarak dumbbell görünümü; destekli gövde ve düz bilek                                                                                                                |
| Kablo çekiş          | [ACE kablo hareketleri](https://contentcdn.eacefitness.com/cp/pdfs/CertifiedNews/AugSept09Cert.pdf) ve [ACE seated row](https://www.acefitness.org/resources/everyone/exercise-library/168/seated-row/): oturarak kabloya uyarlanan özgün şema, gövdeye kontrollü çekiş |
| Plank                | [ACE](https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/): dirsek omuz altında, nötr gövde ve sürekli nefes; yapay tekrar yok                                                                                                               |
| Yürüyen hamle        | [ACE forward lunge](https://www.acefitness.org/resources/everyone/exercise-library/94/forward-lunge/): öne adımın iki aşaması gösterilir; dumbbell yükü şemaya uyarlanmıştır, kesintisiz yürüme animasyonu iddiası yok                                                  |
| RDL                  | [NASM](https://www.nasm.org/resource-center/exercise-library/romanian-deadlift-barbell): kalça menteşesi, yakın bar, hafif bükülü diz ve nötr omurga                                                                                                                    |

## Kapsam ve sınırlar

159 hareket ve 34 aletin mevcut metin/kurulum/alternatif içeriği korunur. 11 harekette ayrı teknik şema vardır; kalan 148 harekette, varyantı yanlış temsil eden genel figür yerine açıkça metin ve kas rehberi sunulur. Örneğin hack squat'a serbest squat animasyonu, yüzmeye genel gövde hareketi veya incline press'e düz bench görseli atanmaz. Rehber çizimleri tıbbi değerlendirme, uzman onayı veya doğru form garantisi olarak sunulmaz.

Büyük görünüm, başlangıç/bitiş seçimi, iki pozu karşılaştırma, oynat/duraklat/başa al ve 0,5×/1×/1,5× geçiş hızı yalnızca uygun şemalarda bulunur. Kas haritası yaklaşık bölgesel bir rehberdir; ayrıntılı anatomik ölçüm değildir.
