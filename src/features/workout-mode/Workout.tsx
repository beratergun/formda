import { isTimedExercise } from '../../domain/exercises/technique';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Clock3, Pause, Play, Trophy } from 'lucide-react';
import { useStore, newId } from '../../app/Store';
import { NumericInput, Button, Card, Chip, Segmented, Stepper, Sheet } from '../../ui';
import { planFor } from '../../domain/program';
import { epley, progression, volume } from '../../domain/progression';
import { emptyDay, type WorkoutLog, type WorkoutType, type SetLog } from '../../domain/types';
import { EXERCISES } from '../../data/seed/exercises';
import { ExerciseGuide } from './Library';
import { workoutEnergy } from '../../domain/energy';
import { ChangeExercise } from '../plan/DailyAlternative';
import {
  newSession,
  workoutElapsedMs,
  intervalElapsedMs,
  pauseSession,
  resumeSession,
  finishSession,
} from '../../domain/workout/session';
import type { WorkoutSession } from '../../domain/types';
import { SessionExercises } from './SessionExercises';
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
  const { data, date, mutate, updateDay, flush, setError, status } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const plan = planFor(date, data.planSettings[0]);
  const [initial] = useState<WorkoutLog>(() => {
    const requested = new URLSearchParams(location.search).get('session');
    const existing =
      data.workoutLog.find(
        (w) => w.id === requested && w.date === date && w.cancelledAt === undefined,
      ) ?? data.workoutLog.find((w) => w.date === date && !w.done && w.cancelledAt === undefined);
    return {
      ...(existing ?? {
        id: newId(),
        date,
        type: plan.type === 'rest' ? 'strength' : plan.type,
        startedAt: Date.now(),
        done: false,
        sets: [],
      }),
      session:
        existing?.session ??
        newSession(plan.exercises.length ? plan.exercises : data.planSettings[0].templates.A),
    };
  });
  const id = initial.id;
  const [kg, setKg] = useState(10);
  const [holdSeconds, setHoldSeconds] = useState(30);
  const [reps, setReps] = useState(10);
  const [rpe, setRpe] = useState(7);
  const [confirmedSet, setConfirmedSet] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [guide, setGuide] = useState(false);
  const [finished, setFinished] = useState(initial.done);
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [lastAlarm, setLastAlarm] = useState(0);
  const alerted = useRef(false);
  const log = data.workoutLog.find((w) => w.id === id) ?? initial;
  const session = log.session ?? initial.session!;
  const type = log.type;
  const list = session.exercises;
  const current = Math.min(session.current, Math.max(0, list.length - 1));
  const paused = session.pausedAt !== undefined;
  const restUntil = session.restUntil ?? 0;
  const phaseTimer = session.phase;
  const phaseEnd = session.phaseUntil ?? 0;
  const intervalRunning = session.intervalStartedAt !== undefined;
  const intervalSeconds = Math.floor(intervalElapsedMs(session, now) / 1000);
  const workoutNote = log.note ?? '';
  const planned = list[current];
  const exercise = EXERCISES.find((e) => e.id === planned?.exerciseId) ?? EXERCISES[0];
  const timed = isTimedExercise(exercise.id);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('session') !== initial.id)
      navigate(`/workout?session=${encodeURIComponent(initial.id)}`, { replace: true });
  }, [initial.id, location.search, navigate]);
  useEffect(() => {
    mutate((v) => {
      const stored = v.workoutLog.find((w) => w.id === initial.id);
      if (stored?.session) return {};
      return {
        workoutLog: [
          ...v.workoutLog.filter((w) => w.id !== initial.id),
          stored ? { ...stored, session: initial.session } : initial,
        ],
      };
    });
  }, [initial, mutate]);
  const sets = log.sets.filter((s) => s.exerciseId === exercise.id);
  const previous = data.workoutLog
    .filter(
      (w) =>
        w.id !== id && w.done && w.date <= date && w.sets.some((s) => s.exerciseId === exercise.id),
    )
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const previousSets = previous?.sets.filter((s) => s.exerciseId === exercise.id) || [];
  const day = data.dayLog.find((d) => d.date === date) || emptyDay(date);
  const rest = Math.max(
    0,
    Math.ceil((paused ? (session.restRemainingMs ?? 0) : restUntil - now) / 1000),
  );
  const save = (patch: Partial<WorkoutLog>) =>
    mutate((v) => ({
      workoutLog: [
        ...v.workoutLog.filter((w) => w.id !== id),
        { ...(v.workoutLog.find((w) => w.id === id) ?? initial), ...patch },
      ],
    }));
  const saveSession = (change: (previous: WorkoutSession) => WorkoutSession) =>
    mutate((v) => {
      const latest = v.workoutLog.find((w) => w.id === id) ?? initial;
      return {
        workoutLog: [
          ...v.workoutLog.filter((w) => w.id !== id),
          { ...latest, session: change(latest.session ?? initial.session!) },
        ],
      };
    });
  const setCurrent = (current: number) => saveSession((previous) => ({ ...previous, current }));
  const setRestUntil = (restUntil: number) =>
    saveSession((previous) => ({ ...previous, restUntil: restUntil || undefined }));
  const setWorkoutNote = (note: string) => save({ note });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!paused && restUntil > 0 && rest === 0 && !alerted.current) {
      sound();
      alerted.current = true;
    }
  }, [rest, restUntil, paused]);
  useEffect(() => {
    if (!paused && phaseTimer && phaseEnd <= now && lastAlarm !== phaseEnd) {
      sound();
      setLastAlarm(phaseEnd);
    }
  }, [phaseEnd, phaseTimer, now, lastAlarm, paused]);
  const completeSet = () => {
    if (paused || busy) return;
    const set: SetLog = {
      exerciseId: exercise.id,
      setNo: sets.length + 1,
      ...(timed ? { kg: 0, seconds: holdSeconds } : { kg, reps }),
      rpe,
      done: true,
    };
    const timestamp = Date.now();
    mutate((value) => {
      const latest = value.workoutLog.find((w) => w.id === id) ?? initial;
      const nextSet = {
        ...set,
        setNo: latest.sets.filter((s) => s.exerciseId === exercise.id).length + 1,
      };
      return {
        workoutLog: [
          ...value.workoutLog.filter((w) => w.id !== id),
          {
            ...latest,
            sets: [...latest.sets, nextSet],
            session: {
              ...(latest.session ?? initial.session!),
              restUntil: timestamp + (planned?.restSec || exercise.defaultRestSec) * 1000,
            },
          },
        ],
      };
    });
    setConfirmedSet((n) => n + 1);
    alerted.current = false;
    setNow(timestamp);
    void flush().catch(() => {});
  };
  const finish = async () => {
    if (busy) return;
    setBusy(true);
    const completed = finishSession(log, Date.now());
    save(completed);
    updateDay({ boxes: { ...day.boxes, s: day.boxOverrides?.s ?? true } });
    try {
      await flush();
      setFinished(true);
    } catch (e) {
      save({ done: false, endedAt: undefined, session: log.session });
      updateDay({ boxes: day.boxes });
      setError(e instanceof Error ? e.message : 'Seans kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  };
  const cancelWorkout = async () => {
    if (busy) return;
    setBusy(true);
    const ended = finishSession(log, Date.now());
    save({ ...ended, done: false, endedAt: undefined, cancelledAt: ended.endedAt });
    try {
      await flush();
      navigate('/');
    } catch (e) {
      save({ done: false, endedAt: undefined, cancelledAt: undefined, session: log.session });
      setError(e instanceof Error ? e.message : 'Seans kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  };
  const seconds = Math.floor(workoutElapsedMs(log, now) / 1000);
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
                <b>
                  {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
                </b>
                <small>süre · dk:sn</small>
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
            <p className="notice">
              {Math.round(
                workoutEnergy(log, day.weight || day.health?.weight || data.profile[0].startWeight)
                  .gross,
              )}{' '}
              kcal · Tahmini seans harcaması
            </p>
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
    <div data-validation-scope className="workout-mode">
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
        <p className="local-status" role="status" aria-live="polite">
          {status}
        </p>
        <div className="row between">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setNow(Date.now());
              saveSession((previous) =>
                paused ? resumeSession(previous, Date.now()) : pauseSession(previous, Date.now()),
              );
              void flush().catch(() => {});
            }}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}{' '}
            {paused ? 'Seansa devam et' : 'Seansı duraklat'}
          </Button>
          <Button variant="quiet" disabled={busy} onClick={() => setCancel(true)}>
            Seansı iptal et
          </Button>
        </div>
        {paused && (
          <p role="status" className="notice">
            Seans duraklatıldı. Süre ve sayaçlar bekliyor.
          </p>
        )}
        <label className="field">
          Seans türü
          <select
            value={type}
            disabled={paused || busy}
            onChange={(e) => {
              save({ type: e.target.value as WorkoutType });
            }}
          >
            <option value="strength">Kuvvet</option>
            <option value="swim">Yüzme</option>
            <option value="cardio">Kardiyo / yürüyüş</option>
            <option value="recovery">Mobilite / toparlanma</option>
          </select>
        </label>
        <fieldset className="session-controls stack" disabled={paused || busy}>
          <legend className="sr-only">Seans kayıtları</legend>
          <Card className="stack">
            <div className="row between">
              <h3>Isınma ve soğuma</h3>
              <Clock3 size={18} />
            </div>
            <div className="row">
              <Button
                variant="secondary"
                onClick={() => {
                  saveSession((previous) => ({
                    ...previous,
                    phase: 'warmup',
                    phaseUntil: Date.now() + 8 * 60000,
                  }));
                }}
              >
                Isınma · 8 dk
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  saveSession((previous) => ({
                    ...previous,
                    phase: 'cooldown',
                    phaseUntil: Date.now() + 5 * 60000,
                  }));
                }}
              >
                Soğuma · 5 dk
              </Button>
            </div>
            {phaseTimer && (
              <>
                <p role="timer">
                  {Math.max(
                    0,
                    Math.ceil((paused ? (session.phaseRemainingMs ?? 0) : phaseEnd - now) / 60000),
                  )}{' '}
                  dakika kaldı ·{' '}
                  {phaseTimer === 'warmup'
                    ? 'Rahat yürüyüş, eklem hareketleri ve hafif deneme seti.'
                    : 'Tempoyu düşür, rahat nefes ve hafif esneme.'}
                </p>
                <Button
                  variant="quiet"
                  onClick={() => {
                    save(phaseTimer === 'warmup' ? { warmupDone: true } : { cooldownDone: true });
                    saveSession((previous) => ({
                      ...previous,
                      phase: undefined,
                      phaseUntil: undefined,
                    }));
                  }}
                >
                  Tamamladım
                </Button>
              </>
            )}
          </Card>
          {type === 'strength' && list.length === 0 ? (
            <Card>
              <h2>İlk hareketini seç</h2>
              <p>Seans hareketleri bölümünden bir hareket ekleyerek başlayabilirsin.</p>
            </Card>
          ) : type === 'strength' ? (
            <>
              <div>
                <p className="eyebrow">
                  {current + 1} / {list.length} HAREKET
                </p>
                <h1>{exercise.name}</h1>
                <ChangeExercise
                  exerciseId={exercise.id}
                  onSelect={(exerciseId) => {
                    if (
                      list.some(
                        (item, index) => index !== current && item.exerciseId === exerciseId,
                      )
                    ) {
                      setError('Bu hareket zaten seansında. Başka bir alternatif seçebilirsin.');
                      return;
                    }
                    saveSession((previous) => ({
                      ...previous,
                      exercises: previous.exercises.map((e, i) =>
                        i === current ? { ...e, exerciseId } : e,
                      ),
                    }));
                  }}
                />
                <p className="muted">
                  {planned?.sets || 3} set ·{' '}
                  {timed
                    ? '15–30 sn kontrollü tutuş'
                    : `${planned?.minReps || 8}–${planned?.maxReps || 12} tekrar`}
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
                    ? timed
                      ? `${previousSets.length} set · ${previousSets[0].seconds ?? 0} sn tutuş`
                      : `${previousSets.length} × ${previousSets[0].reps} · ${previousSets[0].kg} kg`
                    : 'İlk kaydın. Rahat ve kontrollü bir ağırlık seç.'}
                </p>
                <p className="notice">
                  {timed
                    ? 'Önce tutuşunu koru. Formun bozulmadan birkaç saniye ekleyebilirsin.'
                    : progression(
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
                <div className={`set-inputs ${timed ? 'timed-inputs' : ''}`}>
                  {timed ? (
                    <label className="field">
                      Süre (sn)
                      <NumericInput
                        aria-label="Tutuş süresi (sn)"
                        value={holdSeconds}
                        min={1}
                        max={3600}
                        precision={0}
                        onValueChange={(text) => setHoldSeconds(+text)}
                      />
                    </label>
                  ) : (
                    <>
                      {' '}
                      <label className="field">
                        Ağırlık (kg)
                        <NumericInput
                          min={0}
                          max={1000}
                          step={0.5}
                          value={kg}
                          onValueChange={(text) => setKg(+text)}
                          aria-label={'Ağırlık (kg)'}
                        />
                      </label>
                      <label className="field">
                        Tekrar
                        <NumericInput
                          min={1}
                          max={100}
                          precision={0}
                          value={reps}
                          onValueChange={(text) => setReps(+text)}
                          aria-label={'Tekrar'}
                        />
                      </label>
                    </>
                  )}
                  <label className="field">
                    RPE
                    <NumericInput
                      min={1}
                      max={10}
                      value={rpe}
                      onValueChange={(text) => setRpe(+text)}
                      aria-label={'RPE'}
                    />
                  </label>
                </div>
                {confirmedSet > 0 && (
                  <p key={confirmedSet} className="set-confirmation" role="status">
                    <Check size={18} /> Set tamamlandı. Nefeslen.
                  </p>
                )}
                <Button
                  onClick={completeSet}
                  disabled={
                    paused ||
                    busy ||
                    (timed ? holdSeconds < 1 : kg < 0 || reps < 1) ||
                    rpe < 1 ||
                    rpe > 10
                  }
                >
                  Seti bitir
                  <Check size={18} />
                </Button>
                <p className="muted small">RPE: 1 çok kolay, 10 yapabildiğin en zor tekrar.</p>
                {sets.map((s) => (
                  <div key={s.setNo} className="row between completed">
                    <span>{s.setNo}. set</span>
                    <span>
                      {s.seconds !== undefined ? `${s.seconds} sn` : `${s.kg} kg × ${s.reps}`} · RPE{' '}
                      {s.rpe}
                    </span>
                    <Check size={16} />
                  </div>
                ))}
              </Card>
              {(restUntil > 0 || session.restRemainingMs !== undefined) && (
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
                  <Button
                    onClick={() =>
                      saveSession((previous) => ({
                        ...previous,
                        intervalElapsedMs: intervalElapsedMs(previous, Date.now()),
                        intervalStartedAt: intervalRunning ? undefined : Date.now(),
                      }))
                    }
                  >
                    {intervalRunning ? <Pause size={18} /> : <Play size={18} />}{' '}
                    {intervalRunning ? 'Duraklat' : 'Başlat'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      saveSession((previous) => ({
                        ...previous,
                        intervalElapsedMs: 0,
                        intervalStartedAt: undefined,
                      }));
                    }}
                  >
                    Sıfırla
                  </Button>
                </div>
              </div>
              {type !== 'swim' && (
                <label className="field">
                  Mesafe (m, isteğe bağlı)
                  <NumericInput
                    min={0}
                    value={log.distanceM || ''}
                    onValueChange={(text) => save({ distanceM: Math.max(0, +text) })}
                    allowEmpty
                    aria-label={'Mesafe (m, isteğe bağlı)'}
                  />
                </label>
              )}
              <label className="field">
                Algılanan zorluk (1–10)
                <NumericInput
                  min={1}
                  max={10}
                  value={log.rpe || 5}
                  onValueChange={(text) =>
                    save({ rpe: Math.max(0, Math.min(10, +text)) || undefined })
                  }
                  aria-label={'Algılanan zorluk (1–10)'}
                />
              </label>
              {type === 'swim' && (
                <Segmented
                  label="Yüzme stili"
                  value={log.swimStyle ?? 'Serbest'}
                  onChange={(swimStyle) => save({ swimStyle })}
                  options={[
                    { value: 'Serbest', label: 'Serbest' },
                    { value: 'Sırtüstü', label: 'Sırtüstü' },
                    { value: 'Tahtayla ayak', label: 'Tahtayla ayak' },
                  ]}
                />
              )}
            </Card>
          )}
          {type === 'strength' && (
            <SessionExercises
              exercises={list}
              current={current}
              onChange={(exercises, current) =>
                saveSession((previous) => ({ ...previous, exercises, current }))
              }
            />
          )}
        </fieldset>
        <label className="field">
          Seans notu
          <textarea
            aria-label="Seans notu"
            value={workoutNote}
            onChange={(e) => setWorkoutNote(e.target.value)}
            placeholder="Bugün nasıl hissettin?"
          />
        </label>
        <Button
          disabled={busy || (type === 'strength' && !list.length)}
          onClick={() => void finish()}
        >
          Antrenmanı tamamla
          <Check size={18} />
        </Button>
        {cancel && (
          <Sheet title="Seans iptal edilsin mi?" onClose={() => setCancel(false)}>
            <p>
              Girdiğin setler iptal edilmiş seans olarak geçmişinde kalır. Bu seans tamamlanan
              antrenman sayısına eklenmez.
            </p>
            <Button variant="secondary" onClick={() => setCancel(false)}>
              Seansa dön
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void cancelWorkout()}>
              Evet, seansı iptal et
            </Button>
          </Sheet>
        )}
        <p className="safety-note">Göğüs ağrısı, bayılma, olağan dışı nefes darlığı → dur, 112.</p>
      </div>
    </div>
  );
}
