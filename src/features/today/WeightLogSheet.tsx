import { useState } from 'react';
import { useStore } from '../../app/Store';
import { todayKey, dateLabel } from '../../domain/dates';
import { writeWeight, validWeightDate } from '../../domain/weight';
import { Button, NumericInput, Sheet } from '../../ui';

export function WeightLogSheet({ onClose }: { onClose: () => void }) {
  const { data, date, mutate, flush, setError } = useStore();
  const [selected, setSelected] = useState(date);
  const [weight, setWeight] = useState(
    data.dayLog.find((d) => d.date === date)?.weight?.toString() ?? '',
  );
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [limit, setLimit] = useState(12);
  const day = data.dayLog.find((d) => d.date === selected);
  const records = data.dayLog
    .filter((d) => d.weight !== undefined || d.health?.weight !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));
  const choose = (value: string) => {
    setSelected(value);
    setWeight(data.dayLog.find((d) => d.date === value)?.weight?.toString() ?? '');
    setDeleting(false);
  };
  const save = async (remove = false) => {
    if (busy) return;
    setBusy(true);
    try {
      mutate((v) => ({
        dayLog: writeWeight(
          v.dayLog,
          selected,
          remove ? undefined : +weight,
          Date.now(),
          todayKey(),
        ),
      }));
      await flush();
      setDeleting(false);
      if (remove) setWeight('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tartı kaydı tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Tartı kaydı" onClose={onClose}>
      <div className="stack" data-validation-scope>
        <label className="field">
          Kayıt tarihi
          <input
            aria-label="Tartı tarihi"
            type="date"
            value={selected}
            max={todayKey()}
            required
            onChange={(e) => choose(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="field">
          Kilo (kg)
          <NumericInput
            key={selected}
            aria-label="Kilo (kg)"
            min={30}
            max={400}
            precision={2}
            value={weight}
            onValueChange={setWeight}
            disabled={busy}
          />
        </label>
        {day?.weight !== undefined && (
          <p className="small muted">
            Bu tarihteki manuel kayıt güncellenecek. Diğer günlük kayıtların korunur.
          </p>
        )}
        {day?.health?.weight !== undefined && (
          <p className="notice">
            Bağlı kaynaktan {day.health.weight.toLocaleString('tr-TR')} kg var. Manuel kayıt
            öncelikli gösterilir; onu silmek bağlı kaynak kaydını silmez.
          </p>
        )}
        <Button
          disabled={busy || !validWeightDate(selected) || selected > todayKey()}
          onClick={() => void save()}
        >
          Tartıyı kaydet
        </Button>
      </div>
      {day?.weight !== undefined &&
        (deleting ? (
          <div className="stack">
            <p>{dateLabel(selected)} tarihindeki manuel tartı silinsin mi?</p>
            <Button variant="secondary" disabled={busy} onClick={() => setDeleting(false)}>
              Vazgeç
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void save(true)}>
              Evet, tartıyı sil
            </Button>
          </div>
        ) : (
          <Button variant="danger" disabled={busy} onClick={() => setDeleting(true)}>
            Tartıyı sil
          </Button>
        ))}
      <div className="stack">
        <h3>Tartı geçmişin</h3>
        <p className="small muted">
          Her tarih için bir manuel tartı tutulur. Düzenlemek için tarih seç.
        </p>
        {!records.length && (
          <p className="muted">
            Henüz tartı kaydın yok. İlk kaydını eklediğinde grafiğin oluşacak.
          </p>
        )}
        {records.slice(0, limit).map((d) => (
          <Button
            key={d.date}
            variant="secondary"
            disabled={busy}
            className="row between"
            onClick={() => choose(d.date)}
          >
            <span>{dateLabel(d.date, 'd MMM yyyy')}</span>
            <span>
              {(d.weight ?? d.health?.weight)?.toLocaleString('tr-TR')} kg ·{' '}
              {d.weight !== undefined ? 'Manuel' : 'Bağlı kaynak'}
            </span>
          </Button>
        ))}
        {records.length > limit && (
          <Button variant="quiet" onClick={() => setLimit(limit + 12)}>
            Daha fazla tartı göster
          </Button>
        )}
      </div>
    </Sheet>
  );
}
