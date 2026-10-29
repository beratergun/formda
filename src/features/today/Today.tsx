import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { liveQuery } from 'dexie';
import { db, newId, useStore } from '../../app/Store';
import { Button, Card, Chip, Ring, Stepper } from '../../ui';
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
  const day = data.dayLog.find((d) => d.date === date) || emptyDay(date);
  const targets = data.targets[0];
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
    <div className="stack page-enter">
      <div>
        <p className="eyebrow">
          {greeting.toLocaleUpperCase('tr')}
          {data.profile[0].name ? `, ${data.profile[0].name.toLocaleUpperCase('tr')}` : ''}
        </p>
        <div className="row between">
          <h1>
            Bugün, kendin için<span className="accent">.</span>
          </h1>
          <span className="day-flower">✳</span>
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
          <p className="eyebrow">YOL ARKADAŞIN</p>
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
      <div className="row between section-title">
        <h2>Günün dengesi</h2>
        <span className="eyebrow">KENDİ RİTMİNDE</span>
      </div>
      <Card className="stack">
        <div className="nutrition-grid">
          <div>
            <Ring value={macros.kcal} max={targets.kcal} label="Kalori" unit="kcal" size={108} />
            <h3>Kalori</h3>
            <small className="muted">/ {targets.kcal.toLocaleString('tr')} kcal</small>
            <p className="remaining">
              {Math.max(0, Math.round(targets.kcal - macros.kcal))} kcal kaldı
            </p>
          </div>
          <div>
            <Ring
              value={macros.protein}
              max={targets.protein}
              label="Protein"
              unit="g"
              size={108}
            />
            <h3>Protein</h3>
            <small className="muted">/ {targets.protein} g</small>
            <p className="remaining">
              {Math.max(0, Math.ceil(targets.protein - macros.protein))} g kaldı
            </p>
          </div>
        </div>
        {macros.carb !== undefined && entries.length > 0 && <MacroBreakdown macros={macros} />}
        <div className="divider" />
        <div className="row between">
          <div className="row">
            <Droplets size={20} className="accent" />
            <div>
              <h3>Bir bardak iyi gelir.</h3>
              <p className="small muted">
                {day.water} / {targets.water} bardak · 1 bardak ≈ 250 ml
              </p>
            </div>
          </div>
        </div>
        <Stepper value={day.water} onChange={(water) => updateDay({ water })} label="Su" max={40} />
      </Card>
      <Card className={`workout-card tone-${plan.type}`}>
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
              Tamamlandı ·{' '}
              {Math.round(
                ((workouts.find((w) => w.done)?.endedAt || 0) -
                  (workouts.find((w) => w.done)?.startedAt || 0)) /
                  60000,
              )}{' '}
              dk
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
      <div className="stack">
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
                        aria-label={`${entry.name} sil`}
                        onClick={() =>
                          mutate((v) => ({
                            mealEntry: v.mealEntry.filter((e) => e.id !== entry.id),
                          }))
                        }
                      >
                        <Trash2 size={15} />
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
      <p className="safety-note">Göğüs ağrısı, bayılma, olağan dışı nefes darlığı → dur, 112.</p>
    </div>
  );
}
