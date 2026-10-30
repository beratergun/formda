import { useState } from 'react';
import { useStore, newId } from '../../app/Store';
import { Button, NumericInput } from '../../ui';
import type { Food, FoodState } from '../../domain/types';
import { customFood } from '../../domain/meals';

export function CustomFood({ onCreated }: { onCreated: (food: Food) => void }) {
  const { mutate, flush } = useStore();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Food['unit']>('g');
  const [per, setPer] = useState(100);
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carb, setCarb] = useState<number>();
  const [fat, setFat] = useState<number>();
  const [state, setState] = useState<FoodState>('na');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [id] = useState(newId);
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const food = customFood(
        { name, unit, per, kcalPer: kcal, proteinPer: protein, carbPer: carb, fatPer: fat, state },
        id,
      );
      mutate((v) => ({ food: [...v.food.filter((f) => f.id !== id), food] }));
      await flush();
      onCreated(food);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Besin kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div data-validation-scope className="stack">
      <h3>Kendi besinini oluştur</h3>
      <p className="small muted">
        Etiketteki veya kendi ölçtüğün değerleri gir. Bu kayıt kullanıcı beyanı olarak işaretlenir.
        Öğüne eklemeden önce porsiyonu onaylayacaksın.
      </p>
      <label className="field">
        Besin adı
        <input value={name} maxLength={120} required onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid2">
        <label className="field">
          Referans miktarı
          <NumericInput
            aria-label="Referans miktarı"
            value={per}
            min={0.01}
            max={100000}
            onValueChange={(t) => setPer(+t)}
          />
        </label>
        <label className="field">
          Birim
          <select value={unit} onChange={(e) => setUnit(e.target.value as Food['unit'])}>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="adet">adet</option>
          </select>
        </label>
      </div>
      <label className="field">
        Besinin hâli
        <select value={state} onChange={(e) => setState(e.target.value as FoodState)}>
          <option value="na">Hazır / uygulanamaz</option>
          <option value="raw">Çiğ</option>
          <option value="cooked">Pişmiş</option>
        </select>
      </label>
      <div className="grid2">
        <label className="field">
          Kalori (kcal)
          <NumericInput
            aria-label="Özel besin kalorisi"
            value={kcal}
            min={0}
            max={20000}
            onValueChange={(t) => setKcal(+t)}
          />
        </label>
        <label className="field">
          Protein (g)
          <NumericInput
            aria-label="Özel besin proteini"
            value={protein}
            min={0}
            max={10000}
            onValueChange={(t) => setProtein(+t)}
          />
        </label>
        <label className="field">
          Karbonhidrat (g, isteğe bağlı)
          <NumericInput
            aria-label="Özel besin karbonhidratı"
            value={carb ?? ''}
            allowEmpty
            min={0}
            max={10000}
            onValueChange={(t) => setCarb(t === '' ? undefined : +t)}
          />
        </label>
        <label className="field">
          Yağ (g, isteğe bağlı)
          <NumericInput
            aria-label="Özel besin yağı"
            value={fat ?? ''}
            allowEmpty
            min={0}
            max={10000}
            onValueChange={(t) => setFat(t === '' ? undefined : +t)}
          />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy || !name.trim()} onClick={() => void save()}>
        {busy ? 'Kaydediliyor…' : 'Besini kaydet ve porsiyonu seç'}
      </Button>
    </div>
  );
}
