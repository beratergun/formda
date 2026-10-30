import { useEffect, useRef, useState } from 'react';
import { Button, Card } from '../../ui';
export interface FoodPrediction {
  label: string;
  score: number;
}
const LABELS =
  'Elmalı turta|Kaburga|Baklava|Dana carpaccio|Çiğ dana tartar|Pancar salatası|Şekerli hamur kızartması|Bibimbap|Ekmek tatlısı|Kahvaltılık burrito|Bruschetta|Sezar salata|Cannoli|Domates mozzarella salatası|Havuçlu kek|Limonlu çiğ balık|Cheesecake|Peynir tabağı|Körili tavuk|Tavuklu quesadilla|Tavuk kanadı|Çikolatalı kek|Çikolatalı mus|Churros|Midye çorbası|Kulüp sandviç|Yengeç köftesi|Krem brüle|Yumurtalı peynirli tost|Küçük kek|Dolgulu yumurta|Donut|Dolgulu hamur|Edamame|Benedict yumurta|Salyangoz yemeği|Falafel|Dana bonfile|Balık ve patates|Kaz ciğeri|Patates kızartması|Soğan çorbası|Yumurtalı ekmek|Kalamar kızartması|Kızarmış pilav|Dondurulmuş yoğurt|Sarımsaklı ekmek|Gnocchi|Yunan salatası|Peynirli tost|Izgara somon|Avokado ezmesi|Gyoza|Hamburger|Acılı ekşi çorba|Sosisli sandviç|Meksika usulü yumurta|Humus|Dondurma|Lazanya|Istakoz çorbası|Istakozlu sandviç|Peynirli makarna|Makaron|Miso çorbası|Midye|Nachos|Omlet|Soğan halkası|İstiridye|Pad Thai|Paella|Pankek|Panna cotta|Pekin ördeği|Pho çorbası|Pizza|Domuz pirzolası|Soslu peynirli patates|Kaburga rosto|Domuz etli sandviç|Ramen|Ravioli|Kırmızı kadife kek|Risotto|Samosa|Çiğ balık dilimleri|Deniz tarağı|Deniz yosunu salatası|Karides ve mısır lapası|Bolonez spagetti|Karbonara spagetti|Bahar rulosu|Biftek|Çilekli kek|Suşi|Tako|Takoyaki|Tiramisu|Ton balığı tartar|Waffle'.split(
    '|',
  );
const KEYS =
  'apple_pie baby_back_ribs baklava beef_carpaccio beef_tartare beet_salad beignets bibimbap bread_pudding breakfast_burrito bruschetta caesar_salad cannoli caprese_salad carrot_cake ceviche cheesecake cheese_plate chicken_curry chicken_quesadilla chicken_wings chocolate_cake chocolate_mousse churros clam_chowder club_sandwich crab_cakes creme_brulee croque_madame cup_cakes deviled_eggs donuts dumplings edamame eggs_benedict escargots falafel filet_mignon fish_and_chips foie_gras french_fries french_onion_soup french_toast fried_calamari fried_rice frozen_yogurt garlic_bread gnocchi greek_salad grilled_cheese_sandwich grilled_salmon guacamole gyoza hamburger hot_and_sour_soup hot_dog huevos_rancheros hummus ice_cream lasagna lobster_bisque lobster_roll_sandwich macaroni_and_cheese macarons miso_soup mussels nachos omelette onion_rings oysters pad_thai paella pancakes panna_cotta peking_duck pho pizza pork_chop poutine prime_rib pulled_pork_sandwich ramen ravioli red_velvet_cake risotto samosa sashimi scallops seaweed_salad shrimp_and_grits spaghetti_bolognese spaghetti_carbonara spring_rolls steak strawberry_shortcake sushi tacos takoyaki tiramisu tuna_tartare waffles'.split(
    ' ',
  );
export function predictionLabel(label: string) {
  return LABELS[KEYS.indexOf(label)] || 'Yemek önerisi';
}
export const FOOD_MATCHES: Record<string, string> = {
  baklava: 'tr-recipe-cevizli-baklava',
  carrot_cake: 'tr-recipe-havuclu-kek',
  chocolate_cake: 'tr-recipe-kakaolu-kek',
  french_fries: 'kizartma',
  french_toast: 'tr-recipe-yumurtali-ekmek',
  grilled_cheese_sandwich: 'tr-recipe-peynirli-tost',
  hamburger: 'hamburger',
  omelette: 'tr-recipe-sade-omlet',
  pizza: 'pizza',
  macaroni_and_cheese: 'tr-recipe-firinda-makarna',
};
export function Recognition({
  image,
  onChoose,
}: {
  image?: Blob;
  onChoose: (prediction: FoodPrediction, label: string) => void;
}) {
  const [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [predictions, setPredictions] = useState<FoodPrediction[]>([]),
    [error, setError] = useState('');
  const worker = useRef<Worker>();
  useEffect(() => {
    setPredictions([]);
    setError('');
    setBusy(false);
    return () => {
      worker.current?.terminate();
      worker.current = undefined;
    };
  }, [image]);
  const recognize = () => {
    if (!image) return;
    setBusy(true);
    setError('');
    setPredictions([]);
    worker.current ||= new Worker(new URL('./recognition.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.current.onmessage = (
      event: MessageEvent<{ progress?: number; predictions?: FoodPrediction[]; error?: string }>,
    ) => {
      if (event.data.progress !== undefined) setProgress(event.data.progress);
      if (event.data.predictions) {
        setPredictions(event.data.predictions.slice(0, 3));
        setBusy(false);
      }
      if (event.data.error) {
        setError(event.data.error);
        setBusy(false);
      }
    };
    worker.current.onerror = () => {
      setError('Bu cihazda öneri üretilemedi. Yazarak veya arayarak ekleyebilirsin.');
      setBusy(false);
      worker.current?.terminate();
      worker.current = undefined;
    };
    worker.current.postMessage({ image });
  };
  return (
    <Card className="stack">
      <h3>Fotoğraftan yemek önerisi</h3>
      <p className="muted small">
        İsteğe bağlıdır. İlk kullanımda yaklaşık 100 MB model ve çalıştırma dosyası indirilir,
        cihazda önbelleğe alınır. Fotoğrafın cihazdan çıkmaz. Model 101 yemek türünü tanır; Türk
        yemeklerini karıştırabilir.
      </p>
      <label className="check-field">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Model dosyalarının indirilmesini kabul ediyorum
      </label>
      <Button variant="secondary" disabled={!consent || !image || busy} onClick={recognize}>
        {busy ? `Cihazda hazırlanıyor · %${progress}` : 'İlk 3 yemek önerisini göster'}
      </Button>
      {!image && <p className="small muted">Önce bir fotoğraf çek veya seç.</p>}
      {predictions.map((p) => (
        <Button
          key={p.label}
          variant="secondary"
          onClick={() => onChoose(p, predictionLabel(p.label))}
        >
          {predictionLabel(p.label)} · %{Math.round(p.score * 100)} tahmin
        </Button>
      ))}
      {predictions.length > 0 && (
        <p className="small muted">
          Öneriyi seç, doğru yiyeceği kontrol et ve porsiyonunu ayarla. Sen onaylamadan öğün kaydı
          oluşmaz.
        </p>
      )}
      {error && (
        <p role="status" className="notice">
          {error}
        </p>
      )}
    </Card>
  );
}
