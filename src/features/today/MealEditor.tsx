import { useState } from 'react';
import { useStore, newId } from '../../app/Store';
import { Button, NumericInput, Sheet } from '../../ui';
import { MEALS, type MealEntry, type MealId } from '../../domain/types';
import { copyMeal, resizeMeal } from '../../domain/meals';

export function MealEditor({
  entry,
  onClose,
  onDeleted,
}: {
  entry: MealEntry;
  onClose: () => void;
  onDeleted: (entry: MealEntry) => void;
}) {
  const { mutate, flush, setError } = useStore();
  const [qty, setQty] = useState(entry.qty);
  const [mealId, setMealId] = useState(entry.mealId);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [copyId] = useState(newId);
  let preview: MealEntry | undefined,
    problem = '';
  try {
    preview = resizeMeal(entry, qty);
  } catch (e) {
    problem = (e as Error).message;
  }
  const run = async (action: () => void, success?: () => void) => {
    setBusy(true);
    try {
      action();
      await flush();
      success?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Öğün kaydını düzenle" onClose={onClose}>
      <h3>{entry.name}</h3>
      <p className="small muted">Hesap, bu öğünü kaydettiğin andaki besin değerlerini kullanır.</p>
      <label className="field">
        Öğün
        <select value={mealId} onChange={(e) => setMealId(e.target.value as MealId)}>
          {MEALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Miktar ({entry.unit})
        <NumericInput
          aria-label="Yeni miktar"
          value={qty}
          min={0.01}
          max={100000}
          onValueChange={(text) => setQty(+text)}
        />
      </label>
      {preview ? (
        <p className="notice" aria-live="polite">
          {Math.round(preview.kcal)} kcal ·{' '}
          {preview.protein.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} g protein
          {preview.carb !== undefined
            ? ` · ${preview.carb.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} g karbonhidrat`
            : ''}
          {preview.fat !== undefined
            ? ` · ${preview.fat.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} g yağ`
            : ''}
        </p>
      ) : (
        <p role="alert">{problem}</p>
      )}
      <Button
        disabled={!preview || busy}
        onClick={() =>
          void run(() =>
            mutate((v) => ({
              mealEntry: v.mealEntry.map((e) => (e.id === entry.id ? { ...preview!, mealId } : e)),
            })),
          )
        }
      >
        Değişiklikleri kaydet
      </Button>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() =>
          void run(() =>
            mutate((v) => ({
              mealEntry: [
                ...v.mealEntry.filter((e) => e.id !== copyId),
                copyMeal(entry, copyId, entry.date, Date.now()),
              ],
            })),
          )
        }
      >
        Aynı kaydı tekrar ekle
      </Button>
      {confirm ? (
        <div className="stack">
          <p>Bu öğün kalemi silinsin mi? Fotoğraf dosyaların korunur.</p>
          <div className="row">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Vazgeç
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                void run(
                  () => {
                    mutate((v) => ({ mealEntry: v.mealEntry.filter((e) => e.id !== entry.id) }));
                  },
                  () => onDeleted(entry),
                )
              }
            >
              Evet, kalemi sil
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Kalemi sil
        </Button>
      )}
    </Sheet>
  );
}
