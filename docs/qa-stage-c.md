# Formda v2 · Aşama C

- Beş hazır program ve Benim planım seçeneği karşılama/Planım ekranında. PPL 3/6, kuvvet-kardiyo 4/5 ve ev 3/4 gün destekleniyor. Salon/ev/havuz ve deneyim tercihleriyle yeniden kurulabilir.
- Kişisel haftanın anlık görüntüsü ve özel hareket şablonları korunur; kayıtlı seanslara dokunulmaz.
- Her günün kartında üç alternatif; seçim yalnızca tarihe bağlı override olarak saklanır. Evde yüzme alternatifi aynı kasları çalıştıran kara desteğidir. Kısa alternatif iki set ve kısa dinlenmeyle yaklaşık 20–25 dakika hedefler.
- Hareket değiştir aynı ana kas/hareket örüntüsü ve ekipman filtresi kullanır. Tamamlanmış setler değişmez.
- 125 birim testi, lint/typecheck/build ve iki mobil program E2E testi geçti. Domain: satır %99,79, dal %97,18. Tüm programlarda hafif hafta, değerlendirme ve 5. yıl; güne özel alternatif, kişisel plana dönüş ve tam yedek doğrulandı.
- Playwright MCP iki telefon boyutu/iki temada Planım ve alternatif sheet görüntüleri: taşma yok. Axe 18 görünümde sıfır ihlal.

- Tam mobil regresyon: 12/12 geçti. Aynı ana kasla farklı hareket seçimi, ev alternatifinde istemsiz yinelenmeleri engeller; son hedefli iki mobil E2E ve 29 domain testi geçti.
