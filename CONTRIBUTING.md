# Katkı rehberi

Katkılar küçük ve gözden geçirilebilir olsun. Arayüz metinlerini Türkçe, kodu ve Conventional Commit mesajlarını İngilizce yaz.

1. Node 22.12+ ile `npm ci` çalıştır; `npm run dev` adresinin `/formda/` yolunu aç.
2. Hesaplama ve karar kurallarını React'ten bağımsız `src/domain/` içinde tut.
3. Fotoğraf, video ve günlükleri bir sunucuya gönderme. Yeni ağ bağlantısını varsayılan davranışa ekleme.
4. Gerçek kişi fotoğrafı, sağlık kaydı, ZIP yedeği, anahtar veya ortam sırrı ekleme. Demo için yalnızca kurgusal veriler kullan.
5. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` ve ilgili E2E testlerini çalıştır.
6. Ekran değişikliğinde iki telefon boyutu ve iki temayı kontrol et. Klavye, ≥44 px dokunma alanı, okunur kontrast ve azaltılmış hareketi koru.

PR açıklamasında sorun, yeni davranış ve doğrulama sonucunu yaz. Ekran görüntülerinin kurgusal veri içerdiğini belirt. Domain test kapsamı %90 altına düşmemeli. Ayrıntılı test akışı [docs/quality.md](docs/quality.md) içinde.
