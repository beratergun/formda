# berXfit · Başlangıç denetimi

30 Ekim 2026, başlangıç commit `6b3dcd8`. Önceki Formda A–F aşamaları tamamlanmış; yeni istek bunların üzerine ek geliştirmedir. Yapıştırılan iki metin baştan sona okundu. Yeni marka ve logo talimatı önceki marka tercihini günceller. Yerel AGENTS iş akışı main üzerinde küçük owner commit'leri öngördüğünden ayrı branch yerine mevcut akış korunur.

## Envanter ve başlangıç

- React 18 / strict TypeScript / Vite / Tailwind; HashRouter, feature modülleri ve ortak UI.
- Yerel Store, yaklaşık 700 ms debounce; Dexie IndexedDB ve OPFS/Blob medya. DB `yol-local`, medya `yol-media`, eski yedek imzası ve tercih anahtarları korunmalıdır.
- 797 kaynaklı besin, 160 örnek tarif, 159 hareket, 34 alet; altı program, tarih istisnaları, fotoğraf/vlog, rapor, yedek, Health Connect ve isteğe bağlı yerel model mevcut.
- Capacitor 8, Android `io.github.beratergun.formda`, versionCode 2. Yeni isim için appId değiştirmek ayrı sandbox oluşturacağından korunacaktır.
- Pages ve Android Actions mevcut. Aktif repo `beratergun/formda`; eski `yol` yalnızca yönlendirmedir. Tarihsel URL'ler mevcut durum sanılmaz. v2.0.0 etiketi yeniden kullanılmayacak; berXfit için sonraki majör sürüm 3.0.0 adayıdır.
- Mevcut bağımlılıklar `npm ls --depth=0` ile doğrulandı. Hazır çalışma kurulumu gereksiz yeniden yüklenmedi. Lint/typecheck/140 birim/build başlangıçta yeşil. Önceki E2E 18 ve Axe 26 sonucu yeni kod için otomatik geçerli sayılmayacak; tekrar çalıştırılacak.
- `npm audit`: 4 düşük, 0 orta/yüksek/kritik. Ayrıntılar ignored `docs/qa/berxfit-baseline/audit.json`; zorla veya ilgisiz toplu paket güncellemesi yapılmadı.

## Doğrulanmış sorunlar

| Öncelik | Bulgu / kanıt                                                                                                                              | Değişiklik yönü                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| P0      | Gerçek Playwright tarayıcısında antrenman ağırlığı 0 iken silince alan yeniden `0` oluyor. Beklenen geçici boş metin.                      | Ortak ham metin/parse/doğrulama ayrımı; Türkçe ondalık, sınırlar ve kaydetme regresyonu      |
| P0      | 40'a yakın sayı alanında her tuşta `+value`/Number, Stepper'da anında clamp. min/max HTML özelliği doğrudan state yazımını engellemiyor.   | Tüm sayı alanlarının ortak bileşene taşınması, geçersiz taslağın kayda dönüşmesini engelleme |
| P1      | Öğün listesinde silme var, mevcut kalemi miktar/makrolarla düzenleme akışı eksik.                                                          | Yerel snapshot üzerinden düzenle/kopyala/sil ve toplam/regresyon testleri                    |
| P1      | Tam seans duraklat/devam/iptal ve kaydedilmiş dinlenme durumu eksik; bazı timer bilgileri yalnızca component state'inde.                   | Kesintiye dayanıklı seans modeli ve kontrollü iptal                                          |
| P1      | Hareket pozları birçok farklı hareketi ortak şematik figürle temsil ediyor. Bu, anatomik doğruluk veya birebir demonstrasyon kanıtı değil. | Çekirdek 10 harekette özgün teknik çizimler; desteklenmeyende açık statik/metin rehberi      |
| P1      | Uzun dikey dashboard, teal tema ve Formda markası yeni yönle uyuşmuyor.                                                                    | Sahip logosunu koruyan dark-first navy/blue/cyan tasarım, daha yoğun bilgi düzeni            |
| P1      | Su tek günlük bardak toplamı; ayrı ekleme geçmişi/düzenleme yok.                                                                           | Eski toplamı koruyan eklemeli kayıt modeli                                                   |

Başlangıç görselleri ve sayı hatası kanıtı `docs/qa/berxfit-baseline/` altında, repoya alınmaz. Fiziksel telefon testi bu oturumda yapılmış sayılmaz. Kişisel cihaz verisi okunmaz veya silinmez; sentetik ve izole tarayıcı bağlamları kullanılır.
