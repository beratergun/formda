import { useEffect, useState } from 'react';
import { useStore } from '../../app/Store';
import { NumericInput, Button, Card, Sheet } from '../../ui';
import {
  healthAvailability,
  readHealthDay,
  mergeHealthDay,
  openHealthSettings,
  type HealthSnapshot,
} from './health';
export function ConnectedSources() {
  const { data, date, mutate, updateDay, setError } = useStore();
  const [available, setAvailable] = useState(false),
    [reason, setReason] = useState('Kontrol ediliyor…'),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [snapshot, setSnapshot] = useState<HealthSnapshot>();
  useEffect(() => {
    void healthAvailability().then((state) => {
      setAvailable(state.available);
      setReason(
        state.available
          ? 'Yalnızca izin verdiğin kayıtlar okunur.'
          : state.reason || 'Health Connect kurulmamış veya kullanılamıyor.',
      );
    });
  }, []);
  const day = data.dayLog.find((d) => d.date === date);
  const action = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaynak okunamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="stack">
      <h2>Bağlı kaynaklar</h2>
      <p className="muted small">{reason}</p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Kaynakları ve izinleri yönet
      </Button>
      <label className="field">
        Elle aktif kalori (kcal)
        <NumericInput
          min={0}
          max={20000}
          value={day?.activeKcal ?? ''}
          onValueChange={(text) =>
            updateDay({
              activeKcal: text === '' ? undefined : Math.max(0, +text),
            })
          }
          allowEmpty
          aria-label={'Elle aktif kalori (kcal)'}
        />
      </label>
      <p className="small muted">
        Günlük toplamı gir. Boş bırakırsan bağlı kaynak veya yerel tahmin kullanılır.
      </p>
      {open && (
        <Sheet title="Bağlı kaynaklar" onClose={() => setOpen(false)}>
          <p>
            Adım, aktif kalori, egzersiz, kilo ve uyku yalnızca cihazda okunur. Kaynağa hiçbir kayıt
            yazılmaz.
          </p>
          <p className="muted">{reason}</p>
          {available && (
            <>
              <Button
                disabled={busy}
                onClick={() => void action(async () => setSnapshot(await readHealthDay(date)))}
              >
                İzin ver ve seçili günü oku
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void action(openHealthSettings)}
              >
                Health Connect izinlerini aç
              </Button>
            </>
          )}
          {day?.health && (
            <Card className="stack">
              <h3>Cihazda kayıtlı kaynak özeti</h3>
              <p>
                {day.health.steps ?? '—'} adım · {day.health.activeKcal ?? '—'} kcal
              </p>
              <p>
                {day.health.weight ?? '—'} kg · {day.health.sleepMinutes ?? '—'} dk uyku
              </p>
              <p className="small muted">{day.health.sources.join(' · ') || 'Health Connect'}</p>
            </Card>
          )}
          {snapshot && (
            <Card className="stack">
              <h3>{snapshot.date} · Okuma önizlemesi</h3>
              <p>
                {snapshot.health.steps ?? '—'} adım · {snapshot.health.activeKcal ?? '—'} kcal
              </p>
              <p>
                {snapshot.health.weight ?? '—'} kg · {snapshot.health.sleepMinutes ?? '—'} dk uyku
              </p>
              <p>{snapshot.workouts.length} egzersiz oturumu</p>
              {snapshot.warnings.map((warning) => (
                <p key={warning} className="small muted">
                  {warning}
                </p>
              ))}
              <Button
                onClick={() => {
                  mutate((value) => mergeHealthDay(value, snapshot));
                  setSnapshot(undefined);
                }}
              >
                Bu günün kaynak kaydını sakla
              </Button>
            </Card>
          )}
          {!available && (
            <p>Adımı Günlük ekranından, aktif kaloriyi Profil’den elle ekleyebilirsin.</p>
          )}
        </Sheet>
      )}
    </Card>
  );
}
