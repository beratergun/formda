# Formda v2 · Aşama A

- Marka, tek renk F/onay vektör ikonu, maskable ikonlar, iOS/Android açılış ekranları, 16 demo ekranı ve sosyal önizleme yenilendi.
- PWA /formda/, Android io.github.beratergun.formda. Native derleme ve cap sync geçti.
- Veri adları ve v1 yedek biçimi korundu. Yeniden açma testi günlük/profil/favorileri doğruluyor. Tam yedek testi medya baytlarını karşılaştırıyor.
- lint, typecheck, 96 birim testi, build ve 8 mobil E2E geçti.
- Playwright MCP: 390×844 ve 412×915, iki tema ve beş sekmede taşma yok. Öğün 219 kcal; yenileme sonrası kalıcı. Konsolda hata/uyarı yok. E2E antrenman, fotoğraf, plan, çevrimdışı ve yedek akışları geçti.
- Axe: 18 görünümde sıfır ihlal. Mobil Lighthouse 99/100/100.
- Android workflow apk job'unda if yok; push/release/workflow_dispatch her zaman kalite ve debug APK üretir. İmzalama yalnızca step düzeyinde koşullu.
