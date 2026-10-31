# BERxFIT v3 yayın kontrolü

Durum: son doğrulamalar sürüyor; bu kayıt yayın kanıtı değildir.

| Kapı            | Gereken kanıt                                                                |
| --------------- | ---------------------------------------------------------------------------- |
| Kimlik          | Yalnızca Seyid Berat Ergün; boş commit trailer                               |
| Gizlilik        | Şartname/reference/gerçek sağlık ve medya tracked değil                      |
| Kaynak          | Lint, typecheck, birim/kapsam ve üretim build yeşil                          |
| Tarayıcı        | Tam Chromium + WebKit E2E, offline/medya/ZIP/eski veri                       |
| Arayüz          | İki tema; 320–desktop, klavye, azaltılmış hareket, console/taşma             |
| Erişilebilirlik | WCAG 2.0/2.1/2.2 AA etiketleriyle Axe; manuel sınırlar belirtilir            |
| Performans      | Mevcut Lighthouse kapısı düşürülmeden geçer                                  |
| Native          | CI build/lint/apksigner, appName BERxFIT, eski appId, beş READ/WRITE yok     |
| Güncelleme      | Yeni APK sertifikası v2.0.0 ile eşleşir; aynı sürüm kaynağı                  |
| Sunum           | Güncel iki dil README, orijinal logo, kurgusal ekranlar, 24 sn demo, linkler |
| Yayın           | Pages/Android CI başarılı, canlı HTTP 200 ve offline; yeni v3 etiketi/ekleri |
| Dosyalar        | İndirilen APK ve PWA ZIP, yayımlanan SHA-256 ile eşleşir                     |

Eski release üzerine yazılmaz. APK yüklemesinde clobber kaldırılmıştır. Release etiketi package sürümüyle eşleşmezse CI durur. Canlı adres ve yeni release bağlantıları ancak yayın sonrası doğrulanmış olarak işaretlenecek.

Fiziksel Android/iPhone, Health Connect sağlayıcı ve OS izin deneyleri **NOT RUN**; otomatik tarayıcı ve APK statik kontrollerinden ayrı raporlanır. Repo/Pages yolu korunur; bu teslim hesap düzeyinde repo rename işlemi yapmaz.
