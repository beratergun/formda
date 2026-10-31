import { useState } from 'react';
import { storyFallback } from './story-render';
import { Award, LockKeyhole, Share2, Trophy } from 'lucide-react';
import { useStore } from '../../app/Store';
import { Button, Card, Chip, Ring, Sheet } from '../../ui';
import { monday, shiftDate, dateLabel } from '../../domain/dates';
import { periodReport } from '../../domain/report';
import { planFor } from '../../domain/program';
import { epley } from '../../domain/progression';
import { scoreHistory, streaks } from '../../domain/score';
import { isTimedExercise } from '../../domain/exercises/technique';
import { EXERCISES } from '../../data/seed/exercises';
import { shareBlob } from '../../data/media/export';

export function Motivation() {
  const { data, date, setError } = useStore();
  const [story, setStory] = useState(false);
  const [busy, setBusy] = useState(false);
  const start = monday(date);
  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  const planned = dates.filter(
    (d) => !['rest', 'recovery'].includes(planFor(d, data.planSettings[0]).type),
  ).length;
  const sessions = new Set(
    data.workoutLog
      .filter(
        (w) =>
          w.done &&
          w.type !== 'rest' &&
          w.type !== 'recovery' &&
          w.date <= date &&
          dates.includes(w.date),
      )
      .map((w) => w.date),
  ).size;
  const history = scoreHistory(
    data.dayLog.filter((d) => d.date <= date),
    data.mealEntry,
    data.workoutLog,
    data.targets[0],
  );
  const streak = streaks(history, date);
  const month = periodReport(data, date, Number(date.slice(-2)));
  const current = periodReport(data, date, 30);
  const before = periodReport(data, shiftDate(date, -30), 30);
  const records = EXERCISES.flatMap((exercise) => {
    const sets = data.workoutLog
      .filter((w) => w.done && w.date <= date)
      .flatMap((w) => w.sets)
      .filter(
        (s) =>
          s.done &&
          s.exerciseId === exercise.id &&
          (isTimedExercise(exercise.id)
            ? (s.seconds ?? 0) > 0
            : (s.kg || 0) > 0 && (s.reps || 0) > 0),
      );
    return sets.length
      ? [
          {
            exercise,
            seconds: isTimedExercise(exercise.id)
              ? Math.max(...sets.map((s) => s.seconds ?? 0))
              : undefined,
            kg: Math.max(...sets.map((s) => s.kg || 0)),
            rm: Math.max(...sets.map((s) => epley(s.kg || 0, s.reps || 0))),
          },
        ]
      : [];
  });
  const slides = [
    {
      title: 'Kendine ayırdığın zaman',
      value: String(month.sessions),
      unit: 'tamamlanan seans',
      detail: `${month.loggedDays} gün kayıt · ${Math.round(month.averageScore)} ortalama puan`,
    },
    {
      title: 'Gücün birikiyor',
      value: month.volume.toLocaleString('tr'),
      unit: 'kg toplam hacim',
      detail: `${month.swimM.toLocaleString('tr')} m yüzme · Her tekrarın burada.`,
    },
    {
      title: 'Kendi ritminde devam',
      value: String(streak.current),
      unit: 'gün seri',
      detail: `${Math.round(month.averageProtein)} g ortalama protein · ${month.mealDays} beslenme günü`,
    },
  ];
  const share = async (index: number) => {
    setBusy(true);
    try {
      const worker = new Worker(new URL('./story.worker.ts', import.meta.url), { type: 'module' });
      const blob = await new Promise<Blob>((resolve, reject) => {
        const timer = setTimeout(() => {
          worker.terminate();
          reject(new Error('Hikâye hazırlanamadı.'));
        }, 15000);
        worker.onmessage = (event) => {
          clearTimeout(timer);
          worker.terminate();
          if (event.data.blob) resolve(event.data.blob);
          else reject(new Error(event.data.error));
        };
        worker.onerror = () => {
          clearTimeout(timer);
          worker.terminate();
          reject(new Error('Bu cihazda hikâye görseli hazırlanamadı.'));
        };
        worker.postMessage({
          ...slides[index],
          date: dateLabel(date, 'MMMM yyyy'),
          index: index + 1,
        });
      }).catch(() =>
        storyFallback({ ...slides[index], date: dateLabel(date, 'MMMM yyyy'), index: index + 1 }),
      );
      await shareBlob(blob, `berxfit-${date.slice(0, 7)}-hikaye-${index + 1}.png`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Hikâye paylaşılamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Card className="stack weekly-goal">
        <div className="row between">
          <div>
            <p className="eyebrow">HAFTANIN ODAĞI</p>
            <h2>Her seans bir adım.</h2>
            <p className="muted small">
              {sessions} / {planned} planlı gün tamamlandı
            </p>
          </div>
          <Ring size={88} value={sessions} max={planned || 1} label="Haftalık seans" />
        </div>
        <div className="row between small">
          <span>{streak.current} gün seri</span>
          <Chip>{streak.guardUsedThisWeek ? 'Koruyucu kullanıldı' : '1 seri koruyucu hazır'}</Chip>
        </div>
      </Card>
      <Card className="stack">
        <h2>Rozet galerisi</h2>
        <div className="badge-gallery">
          {[
            { label: 'İlk öğün', done: data.mealEntry.some((m) => m.date <= date) },
            {
              label: 'İlk seans',
              done: data.workoutLog.some((w) => w.done && w.type !== 'rest' && w.date <= date),
            },
            ...[7, 30, 100, 365].map((n) => ({ label: `${n} gün seri`, done: streak.best >= n })),
          ].map((badge) => (
            <div key={badge.label} className={`badge-tile ${badge.done ? 'earned' : 'locked'}`}>
              <Award size={28} />
              <b>{badge.label}</b>
              <small>
                {badge.done ? (
                  'Kazanıldı'
                ) : (
                  <>
                    <LockKeyhole size={12} /> Henüz açılmadı
                  </>
                )}
              </small>
            </div>
          ))}
        </div>
      </Card>
      <Card className="stack">
        <div className="row">
          <Trophy size={20} className="accent" />
          <h2>Kişisel rekor duvarı</h2>
        </div>
        {records.length ? (
          records.map(({ exercise, kg, rm, seconds }) => (
            <div className="record-tile" key={exercise.id}>
              <span>
                {exercise.name}
                <small className="muted">
                  {seconds !== undefined ? (
                    'En uzun kayıtlı tutuş'
                  ) : (
                    <>Tahmini 1RM · {rm.toLocaleString('tr', { maximumFractionDigits: 1 })} kg</>
                  )}
                </small>
              </span>
              <b>
                {seconds ?? kg} <small>{seconds !== undefined ? 'sn' : 'kg'}</small>
              </b>
            </div>
          ))
        ) : (
          <p className="muted">İlk ağırlık seansından sonra rekorların burada.</p>
        )}
      </Card>
      <Card className="stack">
        <p className="eyebrow">1 AY ÖNCE SEN</p>
        <h2>Geçmişinle yan yana.</h2>
        {before.loggedDays && current.loggedDays ? (
          <div className="comparison-grid">
            <div>
              <small>Önceki 30 gün</small>
              <b>{before.sessions} seans</b>
              <span>{Math.round(before.averageScore)} ort. puan</span>
            </div>
            <div>
              <small>Son 30 gün</small>
              <b>{current.sessions} seans</b>
              <span>{Math.round(current.averageScore)} ort. puan</span>
            </div>
          </div>
        ) : (
          <p className="muted">
            İki dönemde de kayıt biriktiğinde son 30 gününü önceki 30 günle karşılaştıracağız.
          </p>
        )}
      </Card>
      <Button variant="secondary" onClick={() => setStory(true)}>
        <Share2 size={18} /> Aylık özet hikâyem
      </Button>
      {story && (
        <Sheet title="Aylık özet hikâyem" onClose={() => setStory(false)}>
          {slides.map((slide, i) => (
            <article className="story-card" key={slide.title}>
              <p className="eyebrow">
                berXfit · {dateLabel(date, 'MMMM yyyy')} · {i + 1}/3
              </p>
              <h3>{slide.title}</h3>
              <b className="story-value">{slide.value}</b>
              <p>{slide.unit}</p>
              <p>{slide.detail}</p>
              <Button variant="secondary" disabled={busy} onClick={() => void share(i)}>
                <Share2 size={18} /> Kartı paylaş / indir
              </Button>
            </article>
          ))}
        </Sheet>
      )}
    </>
  );
}
