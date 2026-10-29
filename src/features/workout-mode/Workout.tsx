import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Clock3, Pause, Play, Trophy } from 'lucide-react';
import { useStore, newId } from '../../app/Store';
import { Button, Card, Chip, Segmented, Stepper } from '../../ui';
import { planFor } from '../../domain/program';
import { epley, progression, volume } from '../../domain/progression';
import { emptyDay, type WorkoutLog, type WorkoutType, type SetLog } from '../../domain/types';
import { EXERCISES } from '../../data/seed/exercises';
import { ExerciseGuide } from './Library';
import { ChangeExercise } from '../plan/DailyAlternative';
import { replaceDayExercise } from '../../domain/program/programs';

function sound() {
  if (navigator.vibrate) navigator.vibrate([150, 70, 150]);
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    gain.gain.value = 0.08;
    oscillator.connect(gain).connect(audio.destination);
    oscillator.frequency.value = 660;
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.2);
    oscillator.onended = () => void audio.close();
  } catch {
    /* Vibration remains available when audio is blocked. */
  }
}
export function Workout() {
  const { data, date, mutate, updateDay, flush } = useStore();
  const plan = planFor(date, data.planSettings[0]);
  const existing = data.workoutLog.find((w) => w.date === date && !w.done);
  const [id] = useState(existing?.id || newId);
  const [startedAt] = useState(existing?.startedAt || Date.now);
  const [localType, setLocalType] = useState<WorkoutType>(
    existing?.type || (plan.type === 'rest' ? 'strength' : plan.type),
  );
  const [current, setCurrent] = useState(0);
  const [kg, setKg] = useState(10);
  const [reps, setReps] = useState(10);
  const [rpe, setRpe] = useState(7);
  const [confirmedSet, setConfirmedSet] = useState(0);
  const [restUntil, setRestUntil] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [guide, setGuide] = useState(false);
  const [finished, setFinished] = useState(false);
  const [intervalRunning, setIntervalRunning] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState<'warmup' | 'cooldown'>();
  const [phaseEnd, setPhaseEnd] = useState(0);
  const [lastAlarm, setLastAlarm] = useState(0);
  const [workoutNote, setWorkoutNote] = useState('');
  const alerted = useRef(false);
  const log = data.workoutLog.find((w) => w.id === id) || {
    id,
    date,
    type: localType,
    startedAt,
    done: false,
    sets: [],
  };
  const type = log.type;
  const list = plan.exercises.length ? plan.exercises : data.planSettings[0].templates.A;
  const planned = list[Math.min(current, list.length - 1)];
  const exercise = EXERCISES.find((e) => e.id === planned?.exerciseId) || EXERCISES[0];
  const sets = log.sets.filter((s) => s.exerciseId === exercise.id);
  const previous = data.workoutLog
    .filter(
      (w) =>
        w.id !== id && w.done && w.date <= date && w.sets.some((s) => s.exerciseId === exercise.id),
    )
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const previousSets = previous?.sets.filter((s) => s.exerciseId === exercise.id) || [];
  const day = data.dayLog.find((d) => d.date === date) || emptyDay(date);
  const rest = Math.max(0, Math.ceil((restUntil - now) / 1000));
  const save = (patch: Partial<WorkoutLog>) =>
    mutate((v) => ({
      workoutLog: [...v.workoutLog.filter((w) => w.id !== id), { ...log, ...patch }],
    }));
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (intervalRunning) setIntervalSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [intervalRunning]);
  useEffect(() => {
    if (restUntil > 0 && rest === 0 && !alerted.current) {
      sound();
      alerted.current = true;
    }
  }, [rest, restUntil]);
  useEffect(() => {
    if (phaseTimer && phaseEnd <= now && lastAlarm !== phaseEnd) {
      sound();
      setLastAlarm(phaseEnd);
    }
  }, [phaseEnd, phaseTimer, now, lastAlarm]);
  const completeSet = () => {
    const set: SetLog = {
      exerciseId: exercise.id,
      setNo: sets.length + 1,
      kg,
      reps,
      rpe,
      done: true,
    };
    save({ sets: [...log.sets, set] });
    setConfirmedSet((n) => n + 1);
    alerted.current = false;
    const timestamp = Date.now();
    setNow(timestamp);
    setRestUntil(timestamp + (planned?.restSec || exercise.defaultRestSec) * 1000);
  };
  const finish = async () => {
    save({ done: true, endedAt: Date.now(), note: workoutNote });
    updateDay({ boxes: { ...day.boxes, s: day.boxOverrides?.s ?? true } });
    setFinished(true);
    await flush().catch(() => {});
  };
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  if (finished) {
    const records = [...new Set(log.sets.map((s) => s.exerciseId))].map((exerciseId) => {
      const max = Math.max(
        0,
        ...log.sets
          .filter((s) => s.exerciseId === exerciseId)
          .map((s) => epley(s.kg || 0, s.reps || 0)),
      );
      const previousMax = Math.max(
        0,
        ...data.workoutLog
          .filter((w) => w.id !== id && w.done && w.date <= date)
          .flatMap((w) =>
            w.sets
              .filter((s) => s.exerciseId === exerciseId)
              .map((s) => epley(s.kg || 0, s.reps || 0)),
          ),
      );
      return { exerciseId, max, record: max > previousMax };
    });
    return (
      <div className="workout-mode">
        <div className="stack">
          <div className={`celebration ${records.some((r) => r.record) ? 'new-record' : ''}`}>
            <Trophy size={44} />
          </div>
          <p className="eyebrow">BİR ADIM DAHA</p>
          <h1>
            Bugünkü emeğin
            <br />
            burada kayıtlı.
          </h1>
          <Card className="stack">
            <div className="stats-grid">
              <div>
                <b>{Math.max(1, Math.round(seconds / 60))}</b>
                <small>dakika</small>
              </div>
              <div>
                <b>{volume(log.sets).toLocaleString('tr')}</b>
                <small>kg toplam hacim</small>
              </div>
              <div>
                <b>{log.sets.length}</b>
                <small>tamamlanan set</small>
              </div>
            </div>
            {records
              .filter((r) => r.max > 0)
              .map((record) => (
                <p className="notice" key={record.exerciseId}>
                  {EXERCISES.find((e) => e.id === record.exerciseId)?.name} · Tahmini 1RM{' '}
                  {record.max.toLocaleString('tr', { maximumFractionDigits: 1 })} kg (Epley)
                  {record.record ? ' · Yeni kişisel rekor!' : ''}
                </p>
              ))}
            {type === 'swim' && <p>{log.distanceM || 0} m yüzme</p>}
          </Card>
          <Link className="button secondary" to="/camera">
            Fotoğraf ekle
          </Link>
          <Link className="button secondary" to="/vlog">
            Vlog ekle
          </Link>
          <Link className="button primary" to="/">
            Bugün'e dön
            <Check size={17} />
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="workout-mode">
      <div className="stack">
        <header className="row between">
          <Link className="button quiet" aria-label="Bugün'e dön" to="/">
            <ArrowLeft size={20} />
          </Link>
          <Chip>
            ANTRENMAN · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </Chip>
          <Link className="button quiet" to="/library">
            Kütüphane
          </Link>
        </header>
        <label className="field">
          Seans türü
          <select
            value={type}
            onChange={(e) => {
              setLocalType(e.target.value as WorkoutType);
              save({ type: e.target.value as WorkoutType });
            }}
          >
            <option value="strength">Kuvvet</option>
            <option value="swim">Yüzme</option>
            <option value="cardio">Kardiyo / yürüyüş</option>
            <option value="recovery">Mobilite / toparlanma</option>
          </select>
        </label>
        <Card className="stack">
          <div className="row between">
            <h3>Isınma ve soğuma</h3>
            <Clock3 size={18} />
          </div>
          <div className="row">
            <Button
              variant="secondary"
              onClick={() => {
                setPhaseTimer('warmup');
                setPhaseEnd(Date.now() + 8 * 60000);
              }}
            >
              Isınma · 8 dk
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPhaseTimer('cooldown');
                setPhaseEnd(Date.now() + 5 * 60000);
              }}
            >
              Soğuma · 5 dk
            </Button>
          </div>
          {phaseTimer && (
            <>
              <p role="timer">
                {Math.max(0, Math.ceil((phaseEnd - now) / 60000))} dakika kaldı ·{' '}
                {phaseTimer === 'warmup'
                  ? 'Rahat yürüyüş, eklem hareketleri ve hafif deneme seti.'
                  : 'Tempoyu düşür, rahat nefes ve hafif esneme.'}
              </p>
              <Button
                variant="quiet"
                onClick={() => {
                  save(phaseTimer === 'warmup' ? { warmupDone: true } : { cooldownDone: true });
                  setPhaseTimer(undefined);
                }}
              >
                Tamamladım
              </Button>
            </>
          )}
        </Card>
        {type === 'strength' ? (
          <>
            <div>
              <p className="eyebrow">
                {current + 1} / {list.length} HAREKET
              </p>
              <h1>{exercise.name}</h1>
              <ChangeExercise
                exerciseId={exercise.id}
                onSelect={(exerciseId) =>
                  mutate(() => ({
                    planSettings: [
                      replaceDayExercise(data.planSettings[0], date, current, exerciseId),
                    ],
                  }))
                }
              />
              <p className="muted">
                {planned?.sets || 3} set · {planned?.minReps || 8}–{planned?.maxReps || 12} tekrar
              </p>
            </div>
            <Button variant="secondary" aria-expanded={guide} onClick={() => setGuide(!guide)}>
              Nasıl yapılır?
            </Button>
            {guide && <ExerciseGuide exercise={exercise} />}
            <Card className="stack">
              <p className="eyebrow">ÖNCEKİ SEANS</p>
              <p>
                {previousSets.length
                  ? `${previousSets.length} × ${previousSets[0].reps} · ${previousSets[0].kg} kg`
                  : 'İlk kaydın. Rahat ve kontrollü bir ağırlık seç.'}
              </p>
              <p className="notice">
                {progression(
                  previousSets,
                  planned?.maxReps || 12,
                  data.planSettings[0].progression,
                  Object.values(day.soreness || {}).some((n) => n > 1),
                  (day.sleepQuality ?? 5) <= 2,
                )}
              </p>
            </Card>
            <Card className="stack">
              <h2>{sets.length + 1}. set</h2>
              <div className="set-inputs">
                <label className="field">
                  Ağırlık (kg)
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    step={0.5}
                    value={kg}
                    onChange={(e) => setKg(+e.target.value)}
                  />
                </label>
                <label className="field">
                  Tekrar
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={reps}
                    onChange={(e) => setReps(+e.target.value)}
                  />
                </label>
                <label className="field">
                  RPE
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rpe}
                    onChange={(e) => setRpe(+e.target.value)}
                  />
                </label>
              </div>
              {confirmedSet > 0 && (
                <p key={confirmedSet} className="set-confirmation" role="status">
                  <Check size={18} /> Set tamamlandı. Nefeslen.
                </p>
              )}
              <Button onClick={completeSet} disabled={kg < 0 || reps < 1 || rpe < 1 || rpe > 10}>
                Seti bitir
                <Check size={18} />
              </Button>
              <p className="muted small">RPE: 1 çok kolay, 10 yapabildiğin en zor tekrar.</p>
              {sets.map((s) => (
                <div key={s.setNo} className="row between completed">
                  <span>{s.setNo}. set</span>
                  <span>
                    {s.kg} kg × {s.reps} · RPE {s.rpe}
                  </span>
                  <Check size={16} />
                </div>
              ))}
            </Card>
            {restUntil > 0 && (
              <Card className="rest-timer">
                <p className="eyebrow">DİNLENME</p>
                <b role="timer" aria-label="Dinlenme sayacı">
                  {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}
                </b>
                <div className="row">
                  <Button
                    variant="secondary"
                    onClick={() => setRestUntil(Math.max(Date.now(), restUntil - 15000))}
                  >
                    −15 sn
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      alerted.current = false;
                      setRestUntil(restUntil + 15000);
                    }}
                  >
                    +15 sn
                  </Button>
                  <Button variant="quiet" onClick={() => setRestUntil(0)}>
                    Bitir
                  </Button>
                </div>
              </Card>
            )}
            <div className="row">
              <Button
                variant="secondary"
                disabled={current === 0}
                onClick={() => {
                  setCurrent(current - 1);
                  setGuide(false);
                }}
              >
                Önceki
              </Button>
              <Button
                variant="secondary"
                className="grow"
                disabled={current >= list.length - 1}
                onClick={() => {
                  setCurrent(current + 1);
                  setGuide(false);
                }}
              >
                Sıradaki hareket
                <ChevronRight size={18} />
              </Button>
            </div>
          </>
        ) : (
          <Card className="stack">
            <h1>{type === 'swim' ? 'Her uzunluk bir adım.' : 'Kendi temponda.'}</h1>
            {type === 'swim' && (
              <Stepper
                label="Yüzme mesafesi (m)"
                value={log.distanceM || 0}
                step={25}
                max={50000}
                onChange={(distanceM) => save({ distanceM })}
              />
            )}
            <div className="rest-timer">
              <p className="eyebrow">ARALIK SAYACI</p>
              <b role="timer">
                {Math.floor(intervalSeconds / 60)}:{String(intervalSeconds % 60).padStart(2, '0')}
              </b>
              <div className="row">
                <Button onClick={() => setIntervalRunning(!intervalRunning)}>
                  {intervalRunning ? <Pause size={18} /> : <Play size={18} />}{' '}
                  {intervalRunning ? 'Duraklat' : 'Başlat'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIntervalSeconds(0);
                    setIntervalRunning(false);
                  }}
                >
                  Sıfırla
                </Button>
              </div>
            </div>
            {type !== 'swim' && (
              <label className="field">
                Mesafe (m, isteğe bağlı)
                <input
                  type="number"
                  min={0}
                  value={log.distanceM || ''}
                  onChange={(e) => save({ distanceM: Math.max(0, +e.target.value) })}
                />
              </label>
            )}
            <label className="field">
              Algılanan zorluk (1–10)
              <input
                type="number"
                min={1}
                max={10}
                value={log.rpe || 5}
                onChange={(e) =>
                  save({ rpe: Math.max(0, Math.min(10, +e.target.value)) || undefined })
                }
              />
            </label>
            <Segmented
              label="Yüzme stili"
              value={workoutNote}
              onChange={setWorkoutNote}
              options={[
                { value: 'Serbest', label: 'Serbest' },
                { value: 'Sırtüstü', label: 'Sırtüstü' },
                { value: 'Tahtayla ayak', label: 'Tahtayla ayak' },
              ]}
            />
          </Card>
        )}
        <label className="field">
          Seans notu
          <textarea
            value={workoutNote}
            onChange={(e) => setWorkoutNote(e.target.value)}
            placeholder="Bugün nasıl hissettin?"
          />
        </label>
        <Button onClick={() => void finish()}>
          Antrenmanı tamamla
          <Check size={18} />
        </Button>
        <p className="safety-note">Göğüs ağrısı, bayılma, olağan dışı nefes darlığı → dur, 112.</p>
      </div>
    </div>
  );
}
