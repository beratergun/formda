# Kilometre taşı 7 kontrolü

- Vlog: uygulama içi 720p hedefli kayıt (varsayılan 60 sn / 1,5 Mbps), galeri yükleme, başlangıç/bitiş ile gerçek kırpma, kapak, başlık, ruh hâli ve etiketler.
- Günlük: kayıtlardan otomatik rapor, öğün ve set ayrıntıları, ruh hâli/uyku/adım/kas hassasiyeti/not/etiket, anılar, arama ve vlog/fotoğraf işaretli takvim.
- Kayıtlı günler üzerinden haftalık/aylık istatistikler, ölçüm değişimi, öne çıkanlar, PDF yazdırma görünümü.
- 1080×1350 PNG rapor kartı worker'da çizilir. Fotoğraf varsayılan kapalı. Web Share varsa paylaşım; destek yoksa indirme.
- Seçili aralıktaki her günün ilk vlogundan 1 saniyelik sessiz montaj; iptal ve destek kontrolü.
- Playwright MCP: video yükle → kaydet → Günlük oynatıcı; yapay kamera ile vlog kaydı; PNG indirme fallback'i; 1 saniye montajı; dönem raporları geçti.
- İki telefon / iki tema: taşma ve konsol hatası yok. 76 test, lint, typecheck ve build geçti.
