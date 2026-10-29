# Formda v2 · Aşama B

- Ortak tipografi, tabular rakamlar, 8 px boşluk tokenları, kartlar ve tek aile ikonlarla iki tema yenilendi.
- Bugün üstünde koç kartı ve tek ana eylem; altında alınan/protein/harcanan/adım halkaları. Harcanan değerin hesap ve kaynak entegrasyonu E aşamasında tamamlanacak; kalori yakma kotası yok.
- Haftalık plan halkası, seri/koruyucu durumu, kilitli rozet galerisi, rekor duvarı, iki 30 günlük dönem karşılaştırması ve üç paylaşılabilir aylık hikâye kartı eklendi.
- Set onayı ve kişisel rekor animasyonu eklendi. reduced-motion tüm animasyonları kapatıyor.
- Playwright MCP: 390×844 ve 412×915, iki tema ve beş sekmede taşma yok; hikâye PNG çıktısı 1080×1920, cihazda üretildi.
- Windows WebKit OffscreenCanvas worker desteği eksikliği gerçek testte yakalandı; aynı çizimi HTML canvas'ta üreten uyumluluk yolu düzeltildi. İki tarayıcıda hikâye indirme E2E testi geçti.
- lint/typecheck, 96 birim, build yeşil; mobil Lighthouse 100/100/100.

- Son tam E2E: 10/10 geçti (medya, yedek ve çevrimdışı dahil). Axe: 18 görünüm, sıfır ihlal.
