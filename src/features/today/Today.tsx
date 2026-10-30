import { WaterTracker } from './WaterTracker';
import { workoutElapsedMs } from '../../domain/workout/session';
import { MealEditor } from './MealEditor';
import { WeeklySnapshot } from './WeeklySnapshot';
import type { MealEntry } from '../../domain/types';
import { DailyOverview } from './DailyOverview';
import { useEffect, useState } from 'react';
import { DailyAlternative } from '../plan/DailyAlternative';
import { dailyEnergy, adjustedTarget } from '../../domain/energy';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { liveQuery } from 'dexie';
import { db, newId, useStore } from '../../app/Store';
import { Button, Card, Chip, Ring } from '../../ui';
import { total, calculate } from '../../domain/calories';
import { dateDiff, dateLabel, monday, shiftDate, todayKey, weekday } from '../../domain/dates';
import { assistantMessages, assistantContext, remainingSuggestions } from '../../domain/assistant';
import { planFor } from '../../domain/program';
import { score, scoreHistory, streaks, xpInfo, bedtimeMet } from '../../domain/score';
import { volume } from '../../domain/progression';
import { EXERCISES } from '../../data/seed/exercises';
import { MacroBreakdown } from '../../ui/MacroBreakdown';
import { selectQuote } from '../../domain/quotes';
import { emptyDay, MEALS, type MediaRecord, type MealId } from '../../domain/types';

export function useMedia(date?: string) {
  const [media, setMedia] = useState<MediaRecord[]>([]);
  useEffect(() => {
    const sub = liveQuery(() =>
      date ? db.media.where('date').equals(date).toArray() : db.media.toArray(),
    ).subscribe({ next: setMedia });
    return () => sub.unsubscribe();
  }, [date]);
  return media;
}
export function useBlobUrl(blob?: Blob) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
export function MediaThumb({ record, onClick }: { record: MediaRecord; onClick?: () => void }) {
  const url = useBlobUrl(record.thumb);
  const hidden = useStore().data.profile[0].hidePhotos;
  return (
    <button
      type="button"
      className="media-thumb"
      onClick={onClick}
      aria-label={`${record.kind === 'vlog' ? 'Vlog' : 'Fotoğraf'} · ${dateLabel(record.date)}`}
    >
      {hidden ? (
        <LockKeyhole size={25} aria-label="Anı küçük resmi gizli" />
      ) : (
        <img
          src={url || undefined}
          alt={record.title || `${record.pose || 'Anı'} · ${dateLabel(record.date)}`}
          loading="lazy"
        />
      )}
      {record.kind === 'vlog' && <span>▶</span>}
    </button>
  );
}
export function Today({ onFood }: { onFood: (meal?: MealId) => void }) {
  const { data, date, setDate, updateDay, mutate, addMeals } = useStore();
  const [editing, setEditing] = useState<MealEntry>();
  const [deleted, setDeleted] = useState<MealEntry>();
  const day = data.dayLog.find((d) => d.date === date) || emptyDay(date);
  const expenditure = dailyEnergy(day, data.workoutLog, data.profile[0]);
  const targets = {
    ...data.targets[0],
    kcal: adjustedTarget(
      data.targets[0].kcal,
      expenditure.active,
      data.profile[0].addBurnedToTarget,
      data.profile[0].burnedTargetPercent,
    ),
  };
  const plan = planFor(date, data.planSettings[0]);
  const entries = data.mealEntry.filter((e) => e.date === date);
  const macros = total(entries);
  const workouts = data.workoutLog.filter((w) => w.date === date);
  const done = workouts.some((w) => w.done);
  const points = score(day, macros, new Set(entries.map((e) => e.mealId)).size, done, targets);
  const allPoints = scoreHistory(data.dayLog, data.mealEntry, data.workoutLog, targets);
  const xp = xpInfo(allPoints.map((d) => d.score));
  const streak = streaks(allPoints, todayKey());
  const savedBest = Number(data.meta.find((m) => m.key === 'bestStreak')?.value || 0);
  useEffect(() => {
    if (streak.best > savedBest)
      mutate((v) => ({
        meta: [
          ...v.meta.filter((m) => m.key !== 'bestStreak'),
          { key: 'bestStreak', value: String(streak.best) },
        ],
      }));
  }, [streak.best, savedBest, mutate]);
  const messages = assistantMessages({
    ...assistantContext(data, date, Object.fromEntries(EXERCISES.map((e) => [e.id, e.name]))),
    day,
    macros,
    targets,
  });
  const [quoteOffset, setQuoteOffset] = useState(0);
  const quote = selectQuote(
    date,
    data.quote,
    plan.type === 'strength'
      ? 'kuvvet'
      : plan.type === 'swim'
        ? 'yüzme'
        : plan.type === 'rest'
          ? 'dinlenme'
          : plan.type === 'recovery'
            ? 'toparlanma'
            : 'genel',
    quoteOffset,
  );
  const suggestions = remainingSuggestions(
    data.food,
    targets.kcal - macros.kcal,
    targets.protein - macros.protein,
  );
  const allMedia = useMedia();
  const media = allMedia.filter((m) => m.date === date);
  const lastPhoto =
    allMedia
      .filter((m) => m.kind === 'progress' && m.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.date || data.planSettings[0].startDate;
  const nowHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      timeZone: 'Europe/Istanbul',
      hourCycle: 'h23',
    }).format(new Date()),
  );
  const greeting = nowHour < 12 ? 'Günaydın' : nowHour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const plannedMeal = (meal: MealId) => {
    const menu = data.menuPlan[0].days[weekday(date)][meal];
    addMeals(
      menu.items.map((item) => {
        const food = data.food.find((f) => f.id === item.foodId)!;
        return {
          id: newId(),
          date,
          mealId: meal,
          foodId: food.id,
          name: food.name,
          qty: item.qty,
          unit: food.unit,
          state: item.state,
          ...calculate(food, item.qty),
          photoIds: [],
          createdAt: Date.now(),
        };
      }),
    );
  };
  return (
    <div className="stack page-enter today-page">
      <div>
        <p className="eyebrow">
          {greeting.toLocaleUpperCase('tr')}
          {data.profile[0].name ? `, ${data.profile[0].name.toLocaleUpperCase('tr')}` : ''}
        </p>
        <div className="row between">
          <h1>
            Bugün, kendin için<span className="accent">.</span>
          </h1>
        </div>
        <div className="row between">
          <p className="muted small">{dateLabel(date)}</p>
          <Chip>
            {plan.phase} · {plan.week}. hafta
          </Chip>
        </div>
      </div>
      <div className="date-strip">
        <Button
          variant="quiet"
          aria-label="Önceki hafta"
          onClick={() => setDate(shiftDate(date, -7))}
        >
          <ChevronLeft size={17} />
        </Button>
        {Array.from({ length: 7 }, (_, i) => shiftDate(monday(date), i)).map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            aria-pressed={d === date}
            aria-label={dateLabel(d)}
          >
            <small>{dateLabel(d, 'EEEEE')}</small>
            <b>{dateLabel(d, 'd')}</b>
            <i className={data.dayLog.some((l) => l.date === d) ? 'recorded' : ''} />
          </button>
        ))}
        <Button
          variant="quiet"
          aria-label="Sonraki hafta"
          onClick={() => setDate(shiftDate(date, 7))}
        >
          <ChevronRight size={17} />
        </Button>
      </div>
      {date !== todayKey() && (
        <Button variant="quiet" onClick={() => setDate(todayKey())}>
          Bugüne dön
        </Button>
      )}
      <Card className="coach-card stack">
        <div className="row between">
          <p className="eyebrow">BUGÜN KOÇUNLA</p>
          <Chip>
            {plan.deload ? 'Hafif hafta' : plan.assessment ? 'Değerlendirme' : 'Hazırsın'}
          </Chip>
        </div>
        <h2>{done ? 'Bugünün emeği kayıtta.' : plan.title}</h2>
        <p>
          {done
            ? 'Harika iş. Şimdi toparlanmaya ve öğünlerine yer aç.'
            : plan.type === 'strength'
              ? 'Isınmayı atlama. İlk set hafif, her tekrar kontrollü.'
              : plan.type === 'swim'
                ? 'İlk uzunlukları rahat yüz. Nefesini bul, sonra ritmini koru.'
                : 'Bugün bedenini dinle. Küçük bir kayıt da ilerlemenin parçası.'}
        </p>
        {!done && plan.type !== 'rest' ? (
          <Link className="button primary" to="/workout">
            Antrenmanı başlat <ArrowUpRight size={18} />
          </Link>
        ) : (
          <Button onClick={() => onFood()}>
            Öğün ekle <Plus size={18} />
          </Button>
        )}
      </Card>
      <DailyOverview
        macros={macros}
        targets={targets}
        active={expenditure.active}
        source={expenditure.source}
        steps={day.steps ?? day.health?.steps}
        onFood={() => onFood()}
      />
      <WaterTracker key={date} />
      {macros.carb !== undefined && entries.length > 0 && (
        <details className="card">
          <summary>Makro enerji dağılımı</summary>
          <MacroBreakdown macros={macros} />
        </details>
      )}
      <Card className={`workout-card tone-${plan.type}`}>
        <DailyAlternative />
        <div className="row between">
          <span className="type-icon">
            <Dumbbell size={21} />
          </span>
          <Chip>
            {plan.deload ? 'Hafif hafta' : plan.assessment ? 'Değerlendirme' : 'GÜNÜN HAREKETİ'}
          </Chip>
        </div>
        <h2>{plan.title}</h2>
        <p className="muted">
          {plan.type === 'strength'
            ? `${plan.exercises.length} hareket · kontrollü tekrarlar`
            : plan.type === 'swim'
              ? `${plan.swimM} m · kendi hızında`
              : plan.type === 'rest'
                ? 'Bugün kendine dinlenme alanı aç.'
                : '15–30 dakika rahat hareket'}
          {plan.note ? ` · ${plan.note}` : ''}
        </p>
        {done ? (
          <div className="row completed">
            <Check size={18} />
            <span>
              Tamamlandı · {Math.floor(workoutElapsedMs(workouts.find((w) => w.done)!) / 60000)} dk{' '}
              {Math.floor(workoutElapsedMs(workouts.find((w) => w.done)!) / 1000) % 60} sn
              {workouts.some((w) => w.done && w.sets.length > 0) &&
                ` · ${volume(workouts.filter((w) => w.done).flatMap((w) => w.sets)).toLocaleString('tr')} kg hacim`}
            </span>
          </div>
        ) : plan.type === 'rest' ? (
          <Button
            variant="secondary"
            onClick={() => {
              const log = {
                id: newId(),
                date,
                type: 'rest' as const,
                startedAt: Date.now(),
                endedAt: Date.now(),
                done: true,
                sets: [],
              };
              mutate((v) => ({ workoutLog: [...v.workoutLog, log] }));
              updateDay({ boxes: { ...day.boxes, s: day.boxOverrides?.s ?? true } });
            }}
          >
            Dinlenme günümü tamamladım
          </Button>
        ) : (
          <Link className="button primary" to="/workout">
            Antrenmanı başlat
            <ArrowUpRight size={17} />
          </Link>
        )}
      </Card>
      <div className="row between section-title">
        <h2>Öğünlerin</h2>
        <Button variant="quiet" onClick={() => onFood()}>
          <Plus size={16} />
          Ekle
        </Button>
      </div>
      <div className="stack meal-grid">
        {MEALS.map((meal) => {
          const items = entries.filter((e) => e.mealId === meal.id);
          const sum = total(items);
          return (
            <Card key={meal.id} className="meal-card">
              <div className="row between">
                <div>
                  <p className="eyebrow">{meal.time}</p>
                  <h3>{meal.name}</h3>
                </div>
                <div className="row">
                  <b className="small">{Math.round(sum.kcal)} kcal</b>
                  <Button
                    variant="secondary"
                    aria-label={`${meal.name} ekle`}
                    onClick={() => onFood(meal.id)}
                  >
                    <Plus size={17} />
                  </Button>
                </div>
              </div>
              {items.length ? (
                <ul className="meal-items">
                  {items.map((entry) => (
                    <li key={entry.id}>
                      <div>
                        <span>{entry.name}</span>
                        <small>
                          {entry.qty} {entry.unit} ·{' '}
                          {entry.state === 'raw'
                            ? 'Çiğ'
                            : entry.state === 'cooked'
                              ? 'Pişmiş'
                              : 'Hazır'}{' '}
                          · {entry.protein.toFixed(1)} g protein
                        </small>
                      </div>
                      <Button
                        variant="quiet"
                        aria-label={`${entry.name} düzenle`}
                        onClick={() => setEditing(entry)}
                      >
                        <Pencil size={16} />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small meal-empty">
                  Henüz kayıt yok. Küçük bir başlangıç yapabilirsin.
                </p>
              )}
              <Button variant="quiet" className="planned-copy" onClick={() => plannedMeal(meal.id)}>
                Plandaki gibi yedim <Check size={14} />
              </Button>
              {allMedia
                .filter((m) => items.some((e) => e.photoIds.includes(m.id)))
                .map((record) => (
                  <MediaThumb key={record.id} record={record} onClick={() => onFood(meal.id)} />
                ))}
            </Card>
          );
        })}
      </div>
      {suggestions.length > 0 && (
        <Card className="stack">
          <p className="eyebrow">KALANI NASIL TAMAMLARIM?</p>
          {suggestions.map((s) => (
            <button
              className="suggestion"
              key={s.items.map((i) => i.food.id).join('+')}
              onClick={() =>
                addMeals(
                  s.items.map(({ food, qty }) => ({
                    id: newId(),
                    date,
                    mealId: 'ara',
                    foodId: food.id,
                    name: food.name,
                    qty,
                    unit: food.unit,
                    state: food.state,
                    ...calculate(food, qty),
                    photoIds: [],
                    createdAt: Date.now(),
                  })),
                )
              }
            >
              <span>
                {s.items
                  .map((item) => `${item.qty} ${item.food.unit} ${item.food.name}`)
                  .join(' + ')}
              </span>
              <b>
                {Math.round(s.kcal)} kcal
                <br />
                {Math.round(s.protein)} g protein
              </b>
            </button>
          ))}
        </Card>
      )}
      <WeeklySnapshot />
      <Card className="hero">
        <div className="row between">
          <Chip>HER ADIMIN KIYMETLİ</Chip>
          <ArrowUpRight size={23} />
        </div>
        <div className="row hero-score">
          <Ring value={points.total} label="Gün puanı" />
          <div>
            <p className="eyebrow">SENİN YOLCULUĞUN</p>
            <h2>{xp.name}</h2>
            <p>
              Biriken küçük adımlar.
              <br />
              Sana ait bir ilerleme.
            </p>
            <div className="xp-track">
              <i style={{ width: `${xp.into / 6}%` }} />
            </div>
            <small>
              {xp.into} / 600 XP · Seviye {xp.level}
            </small>
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            <Flame size={17} />
            {streak.current} gün seri
          </span>
          <span>En iyi seri · {Math.max(streak.best, savedBest)} gün</span>
        </div>
      </Card>
      <div className="row section-heading">
        <span className="avatar">
          <Leaf size={20} />
        </span>
        <div>
          <p className="eyebrow">KİŞİSEL KOÇUN</p>
          <h2>Bugünün küçük notları</h2>
        </div>
      </div>
      <Card className="stack assistant-card">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </Card>
      {quote && (
        <Card className="quote-card">
          <span className="quote-mark">“</span>
          <blockquote>{quote.text}</blockquote>
          <div className="row between">
            <p>GÜNÜN SÖZÜ</p>
            <Button
              variant="quiet"
              aria-label="Başka söz"
              onClick={() => setQuoteOffset(quoteOffset + 1)}
            >
              <RefreshCw size={15} />
            </Button>
          </div>
        </Card>
      )}
      {date === todayKey() && dateDiff(date, lastPhoto) >= data.profile[0].photoReminderDays && (
        <Card className="stack">
          <h3>Bugünden bir kare saklamak ister misin?</h3>
          <p className="muted small">
            İlerleme fotoğrafı günün geldi. İstersen aynı açıdan bir anı ekle.
          </p>
          <Link className="button secondary" to="/camera">
            Fotoğrafımı ekle
          </Link>
        </Card>
      )}
      <Card className="stack">
        <div className="row between">
          <h2>Günün kutuları</h2>
          <Chip>{Object.values(day.boxes).filter(Boolean).length} / 4</Chip>
        </div>
        <div className="boxes-grid">
          {(
            [
              ['h', 'H', 'Hazırlık'],
              ['s', 'S', 'Seans'],
              ['k', 'K', 'Kayıt'],
              ['u', 'U', 'Uyku'],
            ] as const
          ).map(([key, letter, label]) => (
            <button
              key={key}
              aria-pressed={day.boxes[key]}
              onClick={() =>
                updateDay({
                  boxes: { ...day.boxes, [key]: !day.boxes[key] },
                  boxOverrides: { ...day.boxOverrides, [key]: !day.boxes[key] },
                })
              }
            >
              <b>{day.boxes[key] ? <Check size={20} /> : letter}</b>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {!streak.guardUsedThisWeek && points.total < 40 && (
          <Button variant="quiet" onClick={() => updateDay({ guard: true })} disabled={day.guard}>
            {day.guard ? 'Seri koruyucu kullanıldı' : 'Bu haftanın seri koruyucusunu kullan'}
          </Button>
        )}
      </Card>
      <Card className="stack">
        <div className="row">
          <Moon size={19} className="accent" />
          <h2>Günün sana nasıl geldi?</h2>
        </div>
        <label className="field">
          Yatış saati
          <input
            type="time"
            value={day.sleepAt || ''}
            onChange={(e) =>
              updateDay({
                sleepAt: e.target.value || undefined,
                boxes: {
                  ...day.boxes,
                  u: day.boxOverrides?.u ?? bedtimeMet(e.target.value, targets.bedtime),
                },
              })
            }
          />
        </label>
        <fieldset>
          <legend>Enerjin</legend>
          <div className="scale-buttons">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Enerji ${n}`}
                aria-pressed={day.energy === n}
                onClick={() => updateDay({ energy: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          Kendine bir not
          <textarea
            placeholder="Bugünden aklında kalan…"
            value={day.note || ''}
            rows={2}
            onChange={(e) => updateDay({ note: e.target.value })}
          />
        </label>
      </Card>
      <Card>
        <div className="row between">
          <h2>Günün anısı</h2>
          <Link className="button quiet" to="/camera">
            <Plus size={17} />
            Ekle
          </Link>
        </div>
        {media.length ? (
          <div className="media-grid">
            {media.map((m) => (
              <MediaThumb key={m.id} record={m} />
            ))}
          </div>
        ) : (
          <p className="muted small meal-empty">Bugünden sana kalan bir kare, bir cümle, bir an.</p>
        )}
      </Card>
      {editing && (
        <MealEditor
          key={editing.id}
          entry={editing}
          onClose={() => setEditing(undefined)}
          onDeleted={setDeleted}
        />
      )}
      {deleted && (
        <div role="status" className="undo-notice row between">
          <span>{deleted.name} silindi.</span>
          <Button
            variant="secondary"
            onClick={() => {
              mutate((v) => ({
                mealEntry: v.mealEntry.some((e) => e.id === deleted.id)
                  ? v.mealEntry
                  : [...v.mealEntry, deleted],
              }));
              setDeleted(undefined);
            }}
          >
            Geri al
          </Button>
        </div>
      )}
      <p className="safety-note">Göğüs ağrısı, bayılma, olağan dışı nefes darlığı → dur, 112.</p>
    </div>
  );
}
