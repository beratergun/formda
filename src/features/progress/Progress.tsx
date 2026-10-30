import { useState } from 'react';
import { Motivation } from './Motivation';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, TrendingUp } from 'lucide-react';
import { useStore } from '../../app/Store';
import { NumericInput, Card, Chip, Segmented } from '../../ui';
import { Chart, type ChartPoint } from '../../ui/Chart';
import { MUSCLES } from '../../ui/BodyMap';
import { PhotoTimeline } from '../camera/Camera';
import { dailyReport, periodReport } from '../../domain/report';
import { dateDiff, dateLabel, monday, shiftDate } from '../../domain/dates';
import { total } from '../../domain/calories';
import { average, adaptiveTdee, mifflin } from '../../domain/tdee';
import { project } from '../../domain/projection';
import { planFor } from '../../domain/program';
import { epley, volume } from '../../domain/progression';
import { streaks } from '../../domain/score';
import { scoreHistory } from '../../domain/score';
import { MacroBreakdown } from '../../ui/MacroBreakdown';
import { MEALS, type Horizon } from '../../domain/types';
import { EXERCISES } from '../../data/seed/exercises';
const segments = [
  { value: 'general', label: 'Genel' },
  { value: 'body', label: 'Kilo ve vücut' },
  { value: 'nutrition', label: 'Beslenme' },
  { value: 'training', label: 'Antrenman' },
  { value: 'habits', label: 'Alışkanlık' },
];
export function Progress() {
  const { data, date, updateDay } = useStore();
  const [tab, setTab] = useState('general');
  const [heatWeeks, setHeatWeeks] = useState(26);
  const [desiredRate, setDesiredRate] = useState(0.5);
  const [range, setRange] = useState(28);
  const [horizon, setHorizon] = useState<Horizon>('6m');
  const [exercise, setExercise] = useState('leg-press');
  const reduced = useReducedMotion();
  const target = data.targets[0];
  const profile = data.profile[0];
  const period = periodReport(data, date, 28);
  const day = dailyReport(data, date);
  const recentDates = Array.from({ length: range }, (_, i) => shiftDate(date, i - range + 1));
  const recent = recentDates.map((d) => dailyReport(data, d));
  const allPoints = scoreHistory(data.dayLog, data.mealEntry, data.workoutLog, target);
  const streak = streaks(allPoints, date);
  const weights = data.dayLog
    .map((d) => ({ ...d, weight: d.weight ?? d.health?.weight }))
    .filter((d) => d.weight !== undefined && d.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = weights.at(-1)?.weight || profile.startWeight;
  const initial = mifflin(
    startWeight,
    profile.heightCm,
    profile.age || 30,
    profile.sex || 'unspecified',
    profile.activityFactor,
  );
  const intake = data.dayLog
    .filter((d) => d.date <= date && data.mealEntry.some((m) => m.date === d.date))
    .map((d) => total(data.mealEntry.filter((m) => m.date === d.date)).kcal);
  const observedDays = weights.length >= 2 ? dateDiff(weights.at(-1)!.date, weights[0].date) : 0;
  const adapted = adaptiveTdee(
    initial,
    intake,
    weights.slice(0, Math.max(1, Math.floor(weights.length / 3))).map((d) => d.weight!),
    weights.slice(-Math.max(1, Math.floor(weights.length / 3))).map((d) => d.weight!),
    observedDays,
  );
  const weeks = { '6m': 26, '1y': 52, '3y': 156, '5y': 260, forever: 260 }[horizon];
  const projection = project({
    startDate: date,
    weight: startWeight,
    goal: target.goalWeight,
    height: profile.heightCm,
    age: profile.age || 30,
    sex: profile.sex || 'unspecified',
    activity: profile.activityFactor,
    kcal: target.kcal,
    weeks,
    adjustment: adapted.value - initial,
  });
  const nutrition = recent.map((r) => ({
    label: dateLabel(r.date, 'd MMM'),
    kcal: r.meals.length ? r.macros.kcal : null,
    protein: r.meals.length ? r.macros.protein : null,
    average:
      average(
        data.dayLog
          .filter(
            (d) =>
              d.date <= r.date &&
              dateDiff(r.date, d.date) < 7 &&
              data.mealEntry.some((m) => m.date === d.date),
          )
          .map((d) => total(data.mealEntry.filter((m) => m.date === d.date)).kcal),
      ) || null,
  }));
  const movement = data.workoutLog
    .filter((w) => w.done && w.date <= date && w.sets.some((s) => s.exerciseId === exercise))
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((w) => {
      const sets = w.sets.filter((s) => s.exerciseId === exercise && s.done);
      return {
        label: dateLabel(w.date, 'd MMM'),
        kg: Math.max(0, ...sets.map((s) => s.kg || 0)),
        reps: Math.max(0, ...sets.map((s) => s.reps || 0)),
        rm: Math.max(0, ...sets.map((s) => epley(s.kg || 0, s.reps || 0))),
        volume: volume(sets),
      };
    });
  const habitPoints = recent.map((r) => {
    const clock = r.day.sleepAt?.split(':').map(Number);
    return {
      label: dateLabel(r.date, 'd MMM'),
      water: r.day.water,
      energy: r.day.energy ?? null,
      mood: r.day.mood ?? null,
      sleepQuality: r.day.sleepQuality ?? null,
      bedtime: clock ? (clock[0] < 12 ? clock[0] + 24 : clock[0]) + clock[1] / 60 : null,
    };
  });
  const goodSleep = data.dayLog
    .filter((d) => (d.sleepQuality || 0) >= 4 && d.energy !== undefined)
    .map((d) => d.energy!);
  const otherSleep = data.dayLog
    .filter((d) => d.sleepQuality !== undefined && d.sleepQuality < 4 && d.energy !== undefined)
    .map((d) => d.energy!);
  return (
    <motion.div
      className="stack"
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <p className="eyebrow">BİRİKEN EMEĞİN GÖRÜNSÜN</p>
        <h1>Yol aldığın her yer.</h1>
        <p className="muted">Kendi geçmişinle, kendi ritminde.</p>
      </div>
      <Segmented label="İlerleme bölümü" value={tab} onChange={setTab} options={segments} />
      {tab === 'general' && (
        <>
          <Card className="stack">
            <div className="row between">
              <h2>İstikrarın izleri</h2>
              <Chip>{streak.current} gün seri</Chip>
            </div>
            <Segmented
              label="Isı haritası aralığı"
              value={String(heatWeeks)}
              onChange={(v) => setHeatWeeks(+v)}
              options={[
                { value: '26', label: '26 hafta' },
                { value: '52', label: '52 hafta' },
                { value: '53', label: 'Bu yıl' },
              ]}
            />
            <div className="heatmap" role="img" aria-label="Gün puanları ısı haritası">
              {Array.from(
                {
                  length:
                    heatWeeks === 53
                      ? dateDiff(date, `${date.slice(0, 4)}-01-01`) + 1
                      : heatWeeks * 7,
                },
                (_, i) =>
                  heatWeeks === 53
                    ? shiftDate(`${date.slice(0, 4)}-01-01`, i)
                    : shiftDate(date, i - heatWeeks * 7 + 1),
              ).map((d) => {
                const value = allPoints.find((p) => p.date === d)?.score || 0;
                return (
                  <span
                    key={d}
                    title={`${dateLabel(d)} · ${value} puan`}
                    style={{
                      background: value ? 'var(--accent)' : 'var(--line)',
                      opacity: value ? 0.25 + value / 140 : 1,
                    }}
                  />
                );
              })}
            </div>
            <p className="muted small">
              Her kare bir gün. Koyu kareler daha çok kayıt ve tamamlanan alışkanlık demek.
            </p>
          </Card>
          <Card>
            <h2>Son 14 günün</h2>
            <Chart
              label="14 günlük gün puanı grafiği"
              data={Array.from({ length: 14 }, (_, i) => {
                const d = shiftDate(date, i - 13);
                return {
                  label: dateLabel(d, 'd MMM'),
                  score: allPoints.find((p) => p.date === d)?.score ?? null,
                };
              })}
              series={[{ key: 'score', name: 'Gün puanı' }]}
            />
          </Card>
          <Card className="stack">
            <h2>Bugünkü puanın</h2>
            {day.points.parts.map((part) => (
              <div className="breakdown-row" key={part.label}>
                <span>{part.label}</span>
                <meter min={0} max={part.max || 1} value={part.value} />
                <b>
                  {Math.round(part.value)} / {Math.round(part.max)}
                </b>
              </div>
            ))}
          </Card>
          <Motivation />
        </>
      )}
      {tab === 'body' && (
        <>
          <Card className="stack">
            <h2>Kendi ölçün, kendi yolun.</h2>
            <div className="stats-grid">
              <div>
                <b>{startWeight}</b>
                <small>son kilo / başlangıç</small>
              </div>
              <div>
                <b>{target.goalWeight}</b>
                <small>hedef kg</small>
              </div>
              <div>
                <b>{weights.length}</b>
                <small>tartı kaydı</small>
              </div>
            </div>
            <label className="field">
              Bugünkü kilo (kg)
              <NumericInput
                min={30}
                max={400}
                step={0.1}
                value={day.day.weight || ''}
                onValueChange={(text) => updateDay({ weight: Math.max(0, +text) || undefined })}
                allowEmpty
                aria-label={'Bugünkü kilo (kg)'}
              />
            </label>
            <div className="grid2">
              {(['waist', 'chest', 'hip', 'arm'] as const).map((key, i) => (
                <label className="field" key={key}>
                  {['Bel', 'Göğüs', 'Kalça', 'Kol'][i]} (cm)
                  <NumericInput
                    min={1}
                    max={key === 'arm' ? 150 : 400}
                    step={0.1}
                    value={day.day.measurements?.[key] || ''}
                    onValueChange={(text) =>
                      updateDay({
                        measurements: {
                          ...day.day.measurements,
                          [key]: Math.max(0, +text) || undefined,
                        },
                      })
                    }
                    allowEmpty
                    aria-label={('' + ['Bel', 'Göğüs', 'Kalça', 'Kol'][i] + ' (cm) ').trim()}
                  />
                </label>
              ))}
            </div>
          </Card>
          <Card className="stack">
            <div className="row between">
              <h2>Önündeki yol · tahmin</h2>
              <TrendingUp size={19} className="accent" />
            </div>
            <Segmented
              label="Projeksiyon ufku"
              value={horizon}
              onChange={setHorizon}
              options={[
                { value: '6m', label: '6 ay' },
                { value: '1y', label: '1 yıl' },
                { value: '3y', label: '3 yıl' },
                { value: '5y', label: '5 yıl' },
              ]}
            />
            <Chart
              label="Kilo ve tahmini projeksiyon"
              rangeKey="scenarioBand"
              data={
                [
                  ...weights.map((w) => ({
                    label: dateLabel(w.date, 'd MMM yy'),
                    weight: w.weight,
                    average: average(
                      weights
                        .filter((x) => x.date <= w.date && dateDiff(w.date, x.date) < 7)
                        .map((x) => x.weight!),
                    ),
                  })),
                  ...projection.map((p, i) => ({
                    label: dateLabel(p.date, 'd MMM yy'),
                    estimate: p.weight,
                    desired: Math.max(target.goalWeight, startWeight - i * desiredRate),
                    scenarioBand: [
                      Math.max(target.goalWeight, startWeight - i),
                      Math.max(target.goalWeight, startWeight - i * 0.5),
                    ] as [number, number],
                  })),
                ] as ChartPoint[]
              }
              series={[
                { key: 'weight', name: 'Tartı' },
                { key: 'average', name: '7 gün ort.' },
                { key: 'estimate', name: 'Tahmin' },
                { key: 'desired', name: 'Seçtiğin örnek hız' },
              ]}
              goal={target.goalWeight}
              milestones={target.milestones.filter(
                (n) => n <= startWeight && n > target.goalWeight,
              )}
            />
            <label className="field">
              Karşılaştırmak istediğin haftalık hız (kg)
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={desiredRate}
                onChange={(e) => setDesiredRate(+e.target.value)}
              />
              <span>
                {desiredRate.toLocaleString('tr')} kg/hafta · yalnızca karşılaştırma senaryosu
              </span>
            </label>
            <p className="muted small">
              {adapted.adaptive ? 'Uyarlanabilir' : 'Başlangıç'} harcama tahmini:{' '}
              {Math.round(adapted.value)} kcal/gün. Kilo değiştikçe hesap yenilenir; hedefte koruma
              başlar.
            </p>
            <p className="notice">Bu bir tahmindir; bir kilo hızı sözü değildir.</p>
            <div className="milestone-table">
              {[...target.milestones, target.goalWeight]
                .filter(
                  (n, i, a) => a.indexOf(n) === i && n <= startWeight && n >= target.goalWeight,
                )
                .sort((a, b) => b - a)
                .map((value) => {
                  const point = projection.find((p) => p.weight <= value);
                  return (
                    <div className="row between" key={value}>
                      <b>{value} kg</b>
                      <span>
                        {point ? dateLabel(point.date, 'd MMM yyyy') : 'Seçili ufkun dışında'} ·
                        tahmin
                      </span>
                    </div>
                  );
                })}
            </div>
          </Card>
          <Card className="stack">
            <h2>Vücut ölçülerinin yolu</h2>
            <Chart
              label="Bel, göğüs, kalça ve kol ölçüleri"
              data={data.dayLog
                .filter((d) => d.date <= date && d.measurements)
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((d) => ({ label: dateLabel(d.date, 'd MMM'), ...d.measurements }))}
              series={[
                { key: 'waist', name: 'Bel (cm)' },
                { key: 'chest', name: 'Göğüs (cm)' },
                { key: 'hip', name: 'Kalça (cm)' },
                { key: 'arm', name: 'Kol (cm)' },
              ]}
            />
          </Card>
          <Link className="button secondary" to="/camera">
            <Camera size={17} />
            Fotoğraf ekle
            <ChevronRight size={17} />
          </Link>
          <PhotoTimeline />
        </>
      )}
      {tab === 'nutrition' && (
        <>
          <label className="field">
            Beslenme aralığı
            <select value={range} onChange={(e) => setRange(+e.target.value)}>
              {[7, 28, 90, 365].map((n) => (
                <option key={n} value={n}>
                  Son {n} gün
                </option>
              ))}
            </select>
          </label>
          <Card>
            <h2>Kalori ve denge</h2>
            <Chart
              label="Kalori ve 7 günlük ortalama"
              data={nutrition}
              series={[
                { key: 'kcal', name: 'Kalori' },
                { key: 'average', name: '7 gün ort.' },
              ]}
              goal={target.kcal}
              band={[target.kcal - 250, target.kcal + 250]}
            />
          </Card>
          <Card>
            <h2>Protein</h2>
            <Chart
              label="Protein hedefi grafiği"
              data={nutrition}
              series={[{ key: 'protein', name: 'Protein (g)' }]}
              goal={target.protein}
            />
            <p className="muted small">
              Kayıt olan günlerde hedefe ulaşma: %
              {Math.round(
                (recent.filter((r) => r.meals.length && r.macros.protein >= target.protein).length /
                  Math.max(1, recent.filter((r) => r.meals.length).length)) *
                  100,
              )}
            </p>
          </Card>
          <Card className="stack">
            <h2>Öğünlerinin ritmi</h2>
            {MEALS.map((meal) => {
              const entries = data.mealEntry.filter(
                (m) => recentDates.includes(m.date) && m.mealId === meal.id,
              );
              const days = new Set(entries.map((e) => e.date)).size;
              return (
                <div key={meal.id} className="row between">
                  <span>{meal.name}</span>
                  <b>{Math.round(total(entries).kcal / Math.max(1, days))} kcal ort.</b>
                </div>
              );
            })}
            <p className="muted small">
              Çiğ kayıt: %
              {Math.round(
                (data.mealEntry.filter((m) => recentDates.includes(m.date) && m.state === 'raw')
                  .length /
                  Math.max(1, data.mealEntry.filter((m) => recentDates.includes(m.date)).length)) *
                  100,
              )}{' '}
              · Pişmiş kayıt: %
              {Math.round(
                (data.mealEntry.filter((m) => recentDates.includes(m.date) && m.state === 'cooked')
                  .length /
                  Math.max(1, data.mealEntry.filter((m) => recentDates.includes(m.date)).length)) *
                  100,
              )}
            </p>
          </Card>
          <Card className="stack">
            <h2>En sık yediklerin</h2>
            {data.food
              .filter((f) => f.useCount > 0)
              .sort((a, b) => b.useCount - a.useCount)
              .slice(0, 8)
              .map((food) => (
                <div className="row between small" key={food.id}>
                  <span>{food.name}</span>
                  <Chip>{food.useCount} kayıt</Chip>
                </div>
              ))}
            {!data.food.some((f) => f.useCount > 0) && (
              <p className="muted small">İlk öğünlerinle burada bir liste oluşacak.</p>
            )}
          </Card>
          <Card className="stack">
            <h2>Makro dağılımın</h2>
            <MacroBreakdown macros={total(recent.flatMap((r) => r.meals))} />
          </Card>
        </>
      )}
      {tab === 'training' && (
        <>
          <Link className="button secondary" to="/library">
            Hareket kütüphanesini aç
          </Link>
          <Card>
            <h2>Plan ve yaptıkların</h2>
            <Chart
              label="Haftalık planlanan ve yapılan seanslar"
              bar
              data={Array.from({ length: 8 }, (_, i) => {
                const start = shiftDate(monday(date), (i - 7) * 7);
                return {
                  label: dateLabel(start, 'd MMM'),
                  planned: Array.from({ length: 7 }, (_, n) =>
                    planFor(shiftDate(start, n), data.planSettings[0]),
                  ).filter((p) => !['rest', 'recovery'].includes(p.type)).length,
                  done: data.workoutLog.filter(
                    (w) =>
                      w.done &&
                      !['rest', 'recovery'].includes(w.type) &&
                      dateDiff(w.date, start) >= 0 &&
                      dateDiff(w.date, start) < 7,
                  ).length,
                };
              })}
              series={[
                { key: 'planned', name: 'Planlanan' },
                { key: 'done', name: 'Tamamlanan' },
              ]}
            />
          </Card>
          <label className="field">
            Hareket
            <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
              {EXERCISES.filter((e) => e.equipment !== 'havuz').map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <Card>
            <h2>Ağırlık ve tahmini 1RM</h2>
            <Chart
              label="Hareket ağırlığı ve Epley 1RM grafiği"
              data={movement}
              series={[
                { key: 'kg', name: 'Ağırlık (kg)' },
                { key: 'rm', name: 'Tahmini 1RM (kg)' },
              ]}
            />
          </Card>
          <Card>
            <h2>Tekrar ve toplam hacim</h2>
            <Chart
              label="Hareket tekrar grafiği"
              data={movement}
              series={[{ key: 'reps', name: 'En yüksek tekrar' }]}
            />
            <p className="muted small">
              Son 28 gün toplam hacim: {period.volume.toLocaleString('tr')} kg · Yüzme:{' '}
              {period.swimM} m
            </p>
          </Card>
          <Card className="stack">
            <h2>Kişisel rekorların</h2>
            {EXERCISES.filter((e) =>
              data.workoutLog.some((w) => w.done && w.sets.some((s) => s.exerciseId === e.id)),
            ).map((e) => {
              const sets = data.workoutLog
                .filter((w) => w.done)
                .flatMap((w) => w.sets.filter((s) => s.exerciseId === e.id && s.done));
              return (
                <div className="row between small" key={e.id}>
                  <span>{e.name}</span>
                  <b>
                    {Math.max(0, ...sets.map((s) => s.kg || 0))} kg ·{' '}
                    {Math.max(0, ...sets.map((s) => epley(s.kg || 0, s.reps || 0))).toFixed(1)}{' '}
                    tahmini 1RM
                  </b>
                </div>
              );
            })}
          </Card>
          <Card>
            <h2>Kas grupları · son 7 gün</h2>
            <Chart
              label="Kas gruplarına göre set sayısı"
              bar
              data={Object.entries(MUSCLES).map(([id, label]) => ({
                label,
                sets: data.workoutLog
                  .filter(
                    (w) => w.done && dateDiff(date, w.date) >= 0 && dateDiff(date, w.date) < 7,
                  )
                  .flatMap((w) => w.sets)
                  .filter(
                    (s) =>
                      s.done && EXERCISES.find((e) => e.id === s.exerciseId)?.muscles.includes(id),
                  ).length,
              }))}
              series={[{ key: 'sets', name: 'Set' }]}
            />
          </Card>
          <Card>
            <h2>Biriken yüzme mesafesi</h2>
            <Chart
              label="Kümülatif yüzme mesafesi"
              data={data.workoutLog
                .filter((w) => w.done && w.type === 'swim')
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((w, i, all) => ({
                  label: dateLabel(w.date, 'd MMM'),
                  distance: all.slice(0, i + 1).reduce((a, x) => a + (x.distanceM || 0), 0),
                }))}
              series={[{ key: 'distance', name: 'Toplam metre' }]}
            />
          </Card>
        </>
      )}
      {tab === 'habits' && (
        <>
          <Card>
            <h2>Günün enerjisi</h2>
            <Chart
              label="Enerji ruh hali ve uyku kalitesi"
              data={habitPoints}
              series={[
                { key: 'energy', name: 'Enerji' },
                { key: 'mood', name: 'Ruh hâli' },
                { key: 'sleepQuality', name: 'Uyku kalitesi' },
              ]}
            />
          </Card>
          <Card>
            <h2>Su</h2>
            <Chart
              label="Su tüketimi"
              data={habitPoints}
              series={[{ key: 'water', name: 'Bardak' }]}
              goal={target.water}
            />
          </Card>
          <Card>
            <h2>Yatış ritmin</h2>
            <Chart
              label="Yatış saati"
              data={habitPoints}
              series={[{ key: 'bedtime', name: 'Saat (gece yarısı sonrası 24+)' }]}
              goal={
                Number(target.bedtime.slice(0, 2)) +
                (Number(target.bedtime.slice(0, 2)) < 12 ? 24 : 0) +
                Number(target.bedtime.slice(3)) / 60
              }
            />
          </Card>
          <Card className="stack">
            <h2>Verinin küçük ipuçları</h2>
            {goodSleep.length >= 2 && otherSleep.length >= 2 ? (
              <p>
                Uyku kaliteni yüksek kaydettiğin günlerde enerjin ortalama{' '}
                {(average(goodSleep) - average(otherSleep)).toFixed(1)} puan{' '}
                {average(goodSleep) >= average(otherSleep) ? 'yüksek' : 'düşük'}. Bu bir ilişki;
                neden sonuç göstermez.
              </p>
            ) : (
              <p className="muted">
                Uyku ve enerji kayıtların biriktikçe aralarındaki ilişkiye bakabiliriz.
              </p>
            )}
          </Card>
        </>
      )}
    </motion.div>
  );
}
