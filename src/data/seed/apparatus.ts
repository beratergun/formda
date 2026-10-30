export const APPARATUS = [
  ['leg-press', 'Leg press', 'Otururken diz ve kalçadan itiş; ön bacak ve kalça.'],
  ['hack-squat', 'Hack squat', 'Sırt destekli çömelme; platform ve omuz pedleri ayarlanır.'],
  [
    'smith',
    'Smith machine',
    'Sabit rayda bar; squat, lunge ve press için emniyet duraklarını ayarla.',
  ],
  [
    'chest-press',
    'Göğüs press',
    'Göğüs hizasındaki tutacakları öne it; koltuk yüksekliğini ayarla.',
  ],
  [
    'pec-deck',
    'Pec deck / ters açış',
    'Göğüs açışı veya ters yönde arka omuz; başlangıç açısını rahat seç.',
  ],
  ['lat-pulldown', 'Lat pulldown', 'Üstten çekiş; sırt ve ön kol. Diz pedini sabitle.'],
  ['seated-row', 'Oturarak çekiş', 'Yatay çekişle sırt; gövde ve ayak desteğini ayarla.'],
  ['machine-high-row', 'Yüksek row makinesi', 'Göğüs destekli çapraz çekiş; sırt kasları.'],
  ['shoulder-press', 'Omuz press', 'Omuz hizasından yukarıya itiş; sırt destekli oturuş.'],
  ['leg-extension', 'Leg extension', 'Diz açışıyla ön bacak; diz eksenini ve alt pedi ayarla.'],
  ['leg-curl', 'Leg curl', 'Diz bükme ile arka bacak; diz ekseni ve ped hizası önemlidir.'],
  ['lying-leg-curl', 'Yatarak leg curl', 'Yüzüstü arka bacak çalışması; kalça pedde kalır.'],
  [
    'seated-leg-curl',
    'Oturarak leg curl',
    'Uyluk sabitlenerek arka bacak; üst ve alt ped ayarlanır.',
  ],
  [
    'hip-machine',
    'Kalça iç / dış bacak',
    'Otururken bacakları açma veya kapama; rahat başlangıç açısı.',
  ],
  [
    'assisted-pull-up',
    'Destekli barfiks / dip',
    'Destek ağırlığı hareketi kolaylaştırır; platformdan kontrollü in.',
  ],
  ['machine-biceps', 'Biceps makinesi', 'Dirsek destekli ön kol bükme; ekseni dirsekle hizala.'],
  [
    'machine-triceps',
    'Triceps makinesi',
    'Dirsek açışıyla arka kol; üst kol destek üzerinde kalır.',
  ],
  [
    'machine-glute-kickback',
    'Kalça itiş makinesi',
    'Kalçadan geriye itiş; gövde pedle sabitlenir.',
  ],
  ['machine-calf', 'Baldır makinesi', 'Ayak bileğinden yükselme; omuz veya diz pedi ayarlanır.'],
  ['machine-crunch', 'Karın makinesi', 'Kontrollü gövde bükme; boynu çekmeden karınla çalış.'],
  [
    'machine-back-extension',
    'Sırt ekstansiyon makinesi',
    'Gövdeyi nötr hizaya getirme; belden aşırı geriye yaylanma.',
  ],
  [
    'machine-hip-thrust',
    'Hip thrust makinesi',
    'Kalçadan itiş; kemer/ped ve ayak platformu ayarlanır.',
  ],
  [
    'cable',
    'Kablo istasyonu',
    'Makara yüksekliği ve tutacak değişerek farklı çekiş/itişler yapılır.',
  ],
  [
    'dumbbells',
    'Dambıllar ve sehpa',
    'Serbest ağırlık; dengeli kavrayış, sabit sehpa ve açık çalışma alanı.',
  ],
  [
    'barbell',
    'Bar ve ağırlıklar',
    'İki elle serbest ağırlık; kelepçe, emniyet ve gerekiyorsa destekçi.',
  ],
  [
    'bodyweight',
    'Vücut ağırlığı / mat',
    'Mat, sabit destek veya güvenle sabitlenmiş barla çalışılır.',
  ],
  ['band', 'Direnç bandı', 'Çekmeden önce bant ve bağlantıyı kontrol et; yüz hizasına doğrultma.'],
  ['treadmill', 'Koşu bandı', 'Yürüyüş ve koşu; kolay hızla başla, acil durdurmayı tanı.'],
  ['elliptical', 'Eliptik', 'Düşük darbeli kol/bacak ritmi; kontrollü bin ve in.'],
  ['bike', 'Kondisyon bisikleti', 'Diz hafif bükülü kalacak sele ayarı; kolay dirençle başla.'],
  ['rowing', 'Kürek ergometresi', 'Bacak–gövde–kol sırasıyla çekiş; dönüş sırası tersidir.'],
  ['stepper', 'Stepper', 'Basamak ritmiyle ön bacak, kalça ve baldır; kollara asılma.'],
  [
    'arm-ergometer',
    'Kol ergometresi',
    'Kol çevirmeyle üst gövde kardiyosu; krank mesafesini ayarla.',
  ],
  ['pool', 'Havuz', 'Yüzme ve su içi hareket; gözetimli alan ve rahat nefes.'],
].map(([id, name, description]) => ({ id, name, description }));

export function apparatusIdFor(id: string, equipment: string) {
  if (id.startsWith('smith-')) return 'smith';
  if (['single-leg-press', 'leg-press'].includes(id)) return 'leg-press';
  if (['pec-deck', 'reverse-pec-deck'].includes(id)) return 'pec-deck';
  if (['machine-shoulder', 'shoulder-press'].includes(id) && equipment === 'makine')
    return 'shoulder-press';
  if (['hip-abduction', 'hip-adduction'].includes(id)) return 'hip-machine';
  if (['assisted-pull-up', 'assisted-dip'].includes(id)) return 'assisted-pull-up';
  if (['seated-calf', 'machine-calf'].includes(id)) return 'machine-calf';
  if (id === 'lat-pulldown') return 'lat-pulldown';
  if (id === 'seated-row' || id === 'cable-row') return 'seated-row';
  if (APPARATUS.some((a) => a.id === id) && ['makine', 'kardiyo aleti'].includes(equipment))
    return id;
  if (equipment === 'havuz') return 'pool';
  if (equipment === 'kablo') return 'cable';
  if (equipment === 'dumbbell') return 'dumbbells';
  if (equipment === 'barbell') return 'barbell';
  if (equipment === 'bant') return 'band';
  if (equipment === 'kardiyo aleti') return id.includes('bike') ? 'bike' : 'treadmill';
  return 'bodyweight';
}
