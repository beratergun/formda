# Kararlar ve varsayımlar

- Başlangıçta depoda yalnızca özel şartname ve salt okunur prototip vardı. Uygulama temiz bir React 18 + strict TypeScript projesi olarak kuruluyor.
- Yayın hedefi kullanıcının seçtiği `beratergun/yol` GitHub Pages adresidir. Hash tabanlı yönlendirme, statik sunucuda sayfa yenilemelerini güvenilir kılar.
- Prototipteki kişisel isim, ölçüler ve sabit tarih yeni kullanıcı için varsayılan yapılmaz. Tanıtım materyallerinde yalnızca kurgusal veriler kullanılır.
- İlk kilometre taşında yalnızca o aşamada uygulanmış akışlar UI QA kapsamına alınır; sonraki ekranlar ilgili kilometre taşlarında eklenip test edilir.
- Gün anahtarları Europe/Istanbul takvimine göre hesaplanır; UTC gece yarısı farkı kayıt gününü değiştirmez.
- Puanın kalori bileşeni şartnameye göre yalnızca üç ayrı öğün kaydı ve hedef ±250 kcal ile verilir; prototipteki aralık dışı yarım puan taşınmaz.
- Uyarlanabilir TDEE hesabında kilo değişimi son ortalama eksi ilk ortalamadır; enerji dengesi için bu fark alımdan çıkarılır. Kilo kaybı böylece harcamayı artıran kanıt olur.
- Şartnamedeki 4 haftalık blok (3 yüklenme + 1 hafif hafta) prototipin tek 13. hafta molasının yerine geçer. Her 12. haftada değerlendirme vardır.
- Besinler için uydurma veri yerine resmi USDA dağıtımı kullanıldı. Referans kayıtlar yaklaşık kaynak etiketiyle korundu; tür ve marka farklarını gizlemek için eksik makrolar tamamlanmadı.
