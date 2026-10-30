import { useState } from 'react';
import { Droplets, Pencil } from 'lucide-react';
import { useStore, newId } from '../../app/Store';
import { emptyDay, type DayLog } from '../../domain/types';
import {
  addWater,
  editWater,
  removeWater,
  editWaterBase,
  waterMl,
  GLASS_ML,
} from '../../domain/water';
import { Button, Card, NumericInput, Sheet } from '../../ui';

export function WaterTracker() {
  const { data, date, mutate, flush, setError } = useStore();
  const day = data.dayLog.find((d) => d.date === date) ?? emptyDay(date);
  const total = waterMl(day),
    target = data.targets[0].water * GLASS_ML;
  const [custom, setCustom] = useState(250),
    [goal, setGoal] = useState(target);
  const [editing, setEditing] = useState<{ id: string; ml: number }>();
  const [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false),
    [limit, setLimit] = useState(8);
  const change = async (operation: (current: DayLog) => DayLog, close = false) => {
    try {
      mutate((v) => {
        const previous = v.dayLog.find((d) => d.date === date) ?? emptyDay(date);
        const next = operation(previous);
        return next === previous
          ? {}
          : { dayLog: [...v.dayLog.filter((d) => d.date !== date), next] };
      });
      await flush();
      if (close) setEditing(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Su kaydı tamamlanamadı.');
    }
  };
  const add = (ml: number) => {
    const entry = { id: newId(), ml, createdAt: Date.now() };
    void change((day) => addWater(day, entry));
  };
  const entries = [...(day.waterEntries ?? [])].sort((a, b) => b.createdAt - a.createdAt);
  const fmt = (ml: number) => ml.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const open = (id: string, ml: number) => {
    setEditing({ id, ml });
    setDeleting(false);
  };
  const saveEdit = async (remove = false) => {
    if (!editing || busy) return;
    setBusy(true);
    await change(
      (day) =>
        editing.id === 'base'
          ? editWaterBase(day, remove ? 0 : editing.ml, Date.now())
          : remove
            ? removeWater(day, editing.id, Date.now())
            : editWater(day, editing.id, editing.ml, Date.now()),
      true,
    );
    setBusy(false);
  };
  return (
    <Card className="stack water-tracker">
      <div className="row between">
        <div className="row">
          <Droplets size={22} className="accent" />
          <div>
            <p className="eyebrow">GÜNLÜK SU</p>
            <h2>Su takibin</h2>
          </div>
        </div>
        <span className="small muted">≈ {fmt(total / GLASS_ML)} bardak</span>
      </div>
      <p className="water-total">
        <b>{fmt(total)}</b>
        <span> / {fmt(target)} ml</span>
      </p>
      <progress aria-label="Günlük su hedefine ilerleme" value={total} max={target} />
      <div className="water-presets">
        {[100, 250, 500].map((ml) => (
          <Button
            key={ml}
            variant="secondary"
            aria-label={ml === 250 ? 'Su artır' : `${ml} ml su ekle`}
            onClick={() => add(ml)}
          >
            +{ml} ml
          </Button>
        ))}
      </div>
      <div data-validation-scope className="row">
        <label className="field grow">
          Özel miktar (ml)
          <NumericInput
            aria-label="Su miktarı (ml)"
            value={custom}
            min={1}
            max={5000}
            precision={0}
            onValueChange={(text) => setCustom(+text)}
          />
        </label>
        <Button className="water-custom-add" onClick={() => add(custom)}>
          Miktarı ekle
        </Button>
      </div>
      <details className="stack">
        <summary>Su hedefini düzenle</summary>
        <div data-validation-scope className="stack">
          <label className="field">
            Kişisel günlük hedef (ml)
            <NumericInput
              aria-label="Su hedefi (ml)"
              value={goal}
              min={1}
              max={10000}
              precision={0}
              onValueChange={(text) => setGoal(+text)}
            />
          </label>
          <Button
            onClick={() => {
              mutate((v) => ({ targets: [{ ...v.targets[0], water: goal / GLASS_ML }] }));
              void flush().catch(() => {});
            }}
          >
            Su hedefini kaydet
          </Button>
          <p className="small muted">
            Hedefini kendi ihtiyacına göre düzenleyebilirsin. 1 bardak karşılığı 250 ml olarak
            hesaplanır.
          </p>
        </div>
      </details>
      <details className="stack">
        <summary>Su kayıt geçmişi · {entries.length} giriş</summary>
        <div className="stack">
          {(day.waterBaseMl ?? total) > 0 && (
            <div className="water-entry">
              <div>
                <b>{fmt(day.waterBaseMl ?? total)} ml</b>
                <small>Önceki günlük toplam · saati bilinmiyor</small>
              </div>
              <Button
                variant="quiet"
                aria-label="Önceki su toplamını düzenle"
                onClick={() => open('base', day.waterBaseMl ?? total)}
              >
                <Pencil size={16} />
              </Button>
            </div>
          )}
          {entries.slice(0, limit).map((entry) => (
            <div className="water-entry" key={entry.id}>
              <div>
                <b>{fmt(entry.ml)} ml</b>
                <small>
                  Kayıt saati{' '}
                  {new Intl.DateTimeFormat('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Istanbul',
                  }).format(new Date(entry.createdAt))}
                </small>
              </div>
              <Button
                variant="quiet"
                aria-label={`${entry.ml} ml su kaydını düzenle`}
                onClick={() => open(entry.id, entry.ml)}
              >
                <Pencil size={16} />
              </Button>
            </div>
          ))}
          {!entries.length && total === 0 && (
            <p className="small muted">
              Henüz su girişi yok. Bir miktar eklediğinde bu güne kaydedilir.
            </p>
          )}
          {entries.length > limit && (
            <Button variant="quiet" onClick={() => setLimit(limit + 8)}>
              Daha fazla kayıt göster
            </Button>
          )}
        </div>
      </details>
      {editing && (
        <Sheet title="Su kaydını düzenle" onClose={() => setEditing(undefined)}>
          <label className="field">
            Miktar (ml)
            <NumericInput
              aria-label="Kayıtlı su miktarı (ml)"
              value={editing.ml}
              min={editing.id === 'base' ? 0 : 1}
              max={editing.id === 'base' ? 50000 : 5000}
              precision={editing.id === 'base' ? 2 : 0}
              onValueChange={(text) => setEditing({ ...editing, ml: +text })}
            />
          </label>
          <Button disabled={busy} onClick={() => void saveEdit()}>
            Su kaydını güncelle
          </Button>
          {deleting ? (
            <>
              <p>Bu su girişi silinsin mi?</p>
              <Button variant="secondary" onClick={() => setDeleting(false)}>
                Vazgeç
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => void saveEdit(true)}>
                Evet, su kaydını sil
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setDeleting(true)}>
              Su kaydını sil
            </Button>
          )}
        </Sheet>
      )}
    </Card>
  );
}
