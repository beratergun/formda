# Formda v2 · Aşama A

- Marka, tek renk F/onay vektör ikonu, maskable ikonlar, iOS/Android açılış ekranları, 16 demo ekranı ve sosyal önizleme yenilendi.
- PWA /formda/, Android io.github.beratergun.formda. Native derleme ve cap sync geçti.
- Veri adları ve v1 yedek biçimi korundu. Yeniden açma testi günlük/profil/favorileri doğruluyor. Tam yedek testi medya baytlarını karşılaştırıyor.
- lint, typecheck, 96 birim testi, build ve 8 mobil E2E geçti.
- Playwright MCP: 390×844 ve 412×915, iki tema ve beş sekmede taşma yok. Öğün 219 kcal; yenileme sonrası kalıcı. Konsolda hata/uyarı yok. E2E antrenman, fotoğraf, plan, çevrimdışı ve yedek akışları geçti.
- Axe: 18 görünümde sıfır ihlal. Mobil Lighthouse 99/100/100.
- Android workflow apk job'unda if yok; push/release/workflow_dispatch her zaman kalite ve debug APK üretir. İmzalama yalnızca step düzeyinde koşullu.

## Yayın doğrulaması

- Commit: 28a4b09 (Seyid Berat Ergün). Pages CI 40970612790 ve Android CI 40970612749 başarılı.
- Canlı https://beratergun.github.io/formda/ HTTP 200; gerçek canlı testte 219 kcal kayıt, çevrimdışı su kaydı, sıfır dış istek/yazma/hata ve kurulabilir manifest doğrulandı.
- https://beratergun.github.io/yol/ yönlendirme deposu f40c9ef commit'iyle yayında. index/404 ve eski SW güncellemesi veriyi silmeden /formda/ adresine yönlendirir.
- APK artifact indirildi: io.github.beratergun.formda, Formda, uzak server.url yok, manifest doğrulandı. SHA-256: 5e4fc3006e01d241a922d6d764e48923bef7e3891d85bffe55308454c6edb247. v2 release APK'sı F aşamasında üretilecek.
