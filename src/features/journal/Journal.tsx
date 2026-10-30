import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronRight, Download, Printer, Share2, Video } from 'lucide-react';
import { useStore } from '../../app/Store';
import { NumericInput, Button, Card, Chip, EmptyState, Segmented, Sheet } from '../../ui';
import { BodyMap } from '../../ui/BodyMap';
import { dailyReport, periodReport } from '../../domain/report';
import { dateDiff, dateLabel, shiftDate } from '../../domain/dates';
import { MEALS, type MediaRecord } from '../../domain/types';
import { normalize } from '../../domain/parser';
import { EXERCISES } from '../../data/seed/exercises';
import { readMedia, deleteMedia } from '../../data/media/opfs';
import { PhotoTimeline } from '../camera/Camera';
import { createMontage } from '../../data/media/montage';
import { downloadBlob, shareBlob } from '../../data/media/export';
import { useBlobUrl, useMedia, MediaThumb } from '../today/Today';
function MediaViewer({ record, onClose }: { record: MediaRecord; onClose: () => void }) {
  const [blob, setBlob] = useState<Blob>();
  const [confirm, setConfirm] = useState(false);
  const { setError } = useStore();
  useEffect(() => {
    let alive = true;
    void readMedia(record)
      .then((b) => {
        if (alive) setBlob(b);
      })
      .catch(() => setError('Medya okunamadı.'));
    return () => {
      alive = false;
    };
  }, [record, setError]);
  const url = useBlobUrl(blob);
  return (
    <Sheet title={record.title || dateLabel(record.date)} onClose={onClose}>
      {record.kind === 'vlog' ? (
        <video
          className="journal-video"
          controls
          playsInline
          src={url}
          aria-label="Günlük vlog oynatıcı"
        />
      ) : (
        <div className="photo-detail">
          <img src={url} alt={record.title || 'Günün anısı'} />
        </div>
      )}
      <p className="muted small">
        {record.tags.map((t) => '#' + t).join(' ')}
        {record.mood ? ` · Ruh hâli ${record.mood}/5` : ''}
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          if (blob)
            downloadBlob(
              blob,
              `formda-${record.date}.${record.kind === 'vlog' ? (record.mime.includes('mp4') ? 'mp4' : 'webm') : 'webp'}`,
            );
        }}
      >
        Cihaza indir
        <Download size={17} />
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          if (confirm) void deleteMedia(record.id).then(onClose);
          else setConfirm(true);
        }}
      >
        {confirm ? 'Evet, cihazımdan sil' : 'Bu anıyı sil'}
      </Button>
    </Sheet>
  );
}
export function Journal() {
  const { data, date, setDate, updateDay, setError } = useStore();
  const [tab, setTab] = useState('day');
  const [query, setQuery] = useState('');
  const [month, setMonth] = useState(date.slice(0, 7));
  const [view, setView] = useState<MediaRecord>();
  const [photoOnCard, setPhotoOnCard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [montageProgress, setMontageProgress] = useState(0);
  const [montageRange, setMontageRange] = useState(30);
  const controller = useRef<AbortController>();
  const media = useMedia();
  const report = dailyReport(data, date);
  const { day, macros, points } = report;
  const period = periodReport(data, date, tab === 'month' ? 30 : 7);
  const dayMedia = media.filter((m) => m.date === date);
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const firstDay = (new Date(`${month}-01T12:00:00`).getDay() + 6) % 7;
  const matches = data.dayLog.filter(
    (d) =>
      query &&
      normalize(
        [
          d.note,
          ...d.tags,
          ...data.mealEntry.filter((m) => m.date === d.date).map((m) => m.name),
          ...media.filter((m) => m.date === d.date).flatMap((m) => [m.title, ...m.tags]),
        ]
          .filter(Boolean)
          .join(' '),
      ).includes(normalize(query)),
  );
  useEffect(() => () => controller.current?.abort(), []);
  const card = async () => {
    setBusy(true);
    try {
      const photo = photoOnCard ? dayMedia.find((m) => m.kind !== 'vlog') : undefined;
      const blob = await new Promise<Blob>((resolve, reject) => {
        const worker = new Worker(new URL('./report.worker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (
          e: MessageEvent<{
            blob: Blob;
            error?: string;
          }>,
        ) => {
          worker.terminate();
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.blob);
        };
        worker.onerror = () => {
          worker.terminate();
          reject(new Error('Rapor hazırlanamadı.'));
        };
        worker.postMessage({
          date: dateLabel(date),
          score: points.total,
          kcal: macros.kcal,
          protein: macros.protein,
          water: day.water,
          sessions: report.workouts.filter((w) => w.done && w.type !== 'rest').length,
          photo: photo?.thumb,
        });
      });
      await shareBlob(blob, `formda-rapor-${date}.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rapor hazırlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  const montage = async () => {
    setBusy(true);
    setMontageProgress(0);
    controller.current = new AbortController();
    try {
      const clips = media
        .filter(
          (m) =>
            m.kind === 'vlog' &&
            dateDiff(date, m.date) >= 0 &&
            dateDiff(date, m.date) < montageRange,
        )
        .sort((a, b) => a.date.localeCompare(b.date));
      const unique = clips.filter((m, i) => clips.findIndex((c) => c.date === m.date) === i);
      if (!unique.length) throw new Error('Bu aralıkta vlog kaydı yok.');
      const blob = await createMontage(unique, setMontageProgress, controller.current.signal);
      await shareBlob(
        blob,
        `formda-bir-saniye.${blob.type.includes('html') ? 'html' : blob.type.includes('mp4') ? 'mp4' : 'webm'}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Montaj hazırlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack page-enter">
      <div>
        <p className="eyebrow">GÜN GÜN, SANA AİT</p>
        <h1>Biriken anların.</h1>
        <p className="muted">Yediklerin, hareketin, hislerin. Hepsi bir arada.</p>
      </div>
      <Segmented
        label="Rapor dönemi"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'day', label: 'Günlük' },
          { value: 'week', label: 'Haftalık' },
          { value: 'month', label: 'Aylık' },
        ]}
      />
      <div className="row between">
        <Button
          variant="quiet"
          aria-label="Önceki gün"
          onClick={() => setDate(shiftDate(date, -1))}
        >
          <ChevronLeft size={18} />
        </Button>
        <label className="field date-picker">
          Rapor tarihi
          <input
            type="date"
            value={date}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
          />
        </label>
        <Button
          variant="quiet"
          aria-label="Sonraki gün"
          onClick={() => setDate(shiftDate(date, 1))}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      {tab !== 'day' ? (
        <div className="stack print-report">
          <Card className="stack">
            <p className="eyebrow">
              SON {period.days} GÜN · {period.loggedDays} KAYITLI GÜN
            </p>
            <h2>{tab === 'week' ? 'Haftana bir bakış' : 'Ayından kalanlar'}</h2>
            <div className="stats-grid">
              <div>
                <b>{Math.round(period.averageScore)}</b>
                <small>ortalama puan</small>
              </div>
              <div>
                <b>{Math.round(period.averageKcal)}</b>
                <small>kayıtlı gün kcal ort.</small>
              </div>
              <div>
                <b>{period.sessions}</b>
                <small>seans</small>
              </div>
            </div>
            <p>
              {Math.round(period.averageProtein)} g protein ortalaması ·{' '}
              {period.volume.toLocaleString('tr')} kg hacim · {period.swimM} m yüzme
            </p>
            {period.weightChange !== undefined && (
              <p>Kilo değişimi: {period.weightChange.toFixed(1)} kg</p>
            )}
            {period.waistChange !== undefined && (
              <p>Bel değişimi: {period.waistChange.toFixed(1)} cm</p>
            )}
            {period.highlights.map((text) => (
              <p key={text} className="notice">
                {text}
              </p>
            ))}
          </Card>
          <PhotoTimeline from={shiftDate(date, -(period.days - 1))} to={date} />
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={17} />
            PDF olarak yazdır / kaydet
          </Button>
        </div>
      ) : (
        <>
          <Card className="stack">
            <div className="row between">
              <h2>{dateLabel(date)}</h2>
              <Chip>{points.total} puan</Chip>
            </div>
            <div className="stats-grid">
              <div>
                <b>{Math.round(macros.kcal)}</b>
                <small>kcal</small>
              </div>
              <div>
                <b>{Math.round(macros.protein)} g</b>
                <small>protein</small>
              </div>
              <div>
                <b>{day.water}</b>
                <small>bardak su</small>
              </div>
            </div>
            <div className="row between muted small">
              <span>{day.steps ? `${day.steps} adım` : 'Adım kaydı yok'}</span>
              <span>{day.sleepAt ? `Yatış ${day.sleepAt}` : 'Yatış kaydı yok'}</span>
            </div>
          </Card>
          <Card className="stack">
            <h2>Ne yedim?</h2>
            {report.meals.length ? (
              MEALS.map((meal) => {
                const entries = report.meals.filter((m) => m.mealId === meal.id);
                return entries.length ? (
                  <div key={meal.id}>
                    <h3>{meal.name}</h3>
                    <ul className="meal-items">
                      {entries.map((m) => (
                        <li key={m.id}>
                          <span>
                            {m.qty} {m.unit} {m.name}
                            <small>
                              {' '}
                              ·{' '}
                              {m.state === 'raw'
                                ? 'Çiğ'
                                : m.state === 'cooked'
                                  ? 'Pişmiş'
                                  : 'Hazır'}
                            </small>
                          </span>
                          <b>{Math.round(m.kcal)} kcal</b>
                        </li>
                      ))}
                    </ul>
                    <div className="media-grid">
                      {media
                        .filter((record) => entries.some((e) => e.photoIds.includes(record.id)))
                        .map((record) => (
                          <MediaThumb
                            key={record.id}
                            record={record}
                            onClick={() => setView(record)}
                          />
                        ))}
                    </div>
                  </div>
                ) : null;
              })
            ) : (
              <EmptyState title="Bugün için yeni bir sayfa">
                İlk öğününü Bugün ekranından ekleyebilirsin.
              </EmptyState>
            )}
          </Card>
          <Card className="stack">
            <h2>Ne yaptım?</h2>
            {report.workouts.length ? (
              report.workouts.map((workout) => (
                <div className="stack" key={workout.id}>
                  <Chip>
                    {workout.done ? 'Tamamlandı' : 'Devam ediyor'} ·{' '}
                    {workout.type === 'strength'
                      ? 'Kuvvet'
                      : workout.type === 'swim'
                        ? 'Yüzme'
                        : workout.type === 'rest'
                          ? 'Dinlenme'
                          : 'Hareket'}
                  </Chip>
                  {workout.distanceM !== undefined && <p>{workout.distanceM} m</p>}
                  {workout.sets
                    .filter((s) => s.done && s.kg && s.reps)
                    .some(
                      (s) =>
                        !data.workoutLog
                          .filter(
                            (w) => w.id !== workout.id && w.done && w.startedAt < workout.startedAt,
                          )
                          .some((w) =>
                            w.sets.some(
                              (old) =>
                                old.exerciseId === s.exerciseId &&
                                old.done &&
                                (old.kg || 0) >= (s.kg || 0),
                            ),
                          ),
                    ) && <p className="notice">Bu seansta yeni bir ağırlık rekoru kaydettin.</p>}
                  {workout.sets.map((s, i) => (
                    <p key={i} className="small">
                      {EXERCISES.find((e) => e.id === s.exerciseId)?.name} · {s.setNo}. set ·{' '}
                      {s.kg || 0} kg × {s.reps || 0} · RPE {s.rpe || '—'}
                    </p>
                  ))}
                  {workout.note && <p className="muted small">{workout.note}</p>}
                </div>
              ))
            ) : (
              <p className="muted small">
                Henüz bir seans kaydı yok. Dinlenmek de planın bir parçası.
              </p>
            )}
          </Card>
          <Card className="stack">
            <h2>Nasıl hissettim?</h2>
            <label className="field">
              Enerji (1–5)
              <select
                value={day.energy || ''}
                onChange={(e) => updateDay({ energy: +e.target.value || undefined })}
              >
                <option value="">Seç</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <div className="grid2">
              <label className="field">
                Ruh hâli (1–5)
                <select
                  value={day.mood || ''}
                  onChange={(e) => updateDay({ mood: +e.target.value || undefined })}
                >
                  <option value="">Seç</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Uyku kalitesi (1–5)
                <select
                  value={day.sleepQuality || ''}
                  onChange={(e) => updateDay({ sleepQuality: +e.target.value || undefined })}
                >
                  <option value="">Seç</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Adım sayısı
              <NumericInput
                min={0}
                value={day.steps ?? ''}
                max={200000}
                precision={0}
                onValueChange={(text) => updateDay({ steps: text === '' ? undefined : +text })}
                allowEmpty
                aria-label={'Adım sayısı'}
              />
            </label>
            <details>
              <summary>Kas hassasiyeti haritası · 0–3</summary>
              <BodyMap
                values={day.soreness}
                onSelect={(id) =>
                  updateDay({
                    soreness: { ...day.soreness, [id]: ((day.soreness?.[id] || 0) + 1) % 4 },
                  })
                }
              />
            </details>
            <label className="field">
              Günün notu
              <textarea
                rows={3}
                value={day.note || ''}
                onChange={(e) => updateDay({ note: e.target.value })}
              />
            </label>
            <label className="field">
              Etiketler
              <input
                value={day.tags.join(' ')}
                onChange={(e) => updateDay({ tags: e.target.value.split(/[, ]+/).filter(Boolean) })}
                placeholder="antrenman motivasyon"
              />
            </label>
          </Card>
          <Card className="stack">
            <div className="row between">
              <h2>Anıların</h2>
              <Link className="button quiet" to="/vlog">
                <Video size={17} />
                Vlog ekle
              </Link>
            </div>
            {dayMedia.length ? (
              <div className="media-grid">
                {dayMedia.map((record) => (
                  <MediaThumb key={record.id} record={record} onClick={() => setView(record)} />
                ))}
              </div>
            ) : (
              <p className="muted small">Bugünden bir kare veya kısa bir video ekleyebilirsin.</p>
            )}
          </Card>
          <Card className="stack">
            <p className="eyebrow">KOÇUNUN NOTU</p>
            {report.comments.map((comment) => (
              <p key={comment}>{comment}</p>
            ))}
          </Card>
          <Card className="stack">
            <h2>Bugününü yanında götür.</h2>
            <label className="check-label">
              <input
                type="checkbox"
                checked={photoOnCard}
                onChange={(e) => setPhotoOnCard(e.target.checked)}
              />
              Rapor kartına fotoğraf ekle
            </label>
            <Button disabled={busy} onClick={() => void card()}>
              <Share2 size={17} />
              Rapor kartını paylaş / indir
            </Button>
          </Card>
        </>
      )}
      <Card className="stack">
        <label className="field">
          Takvim ayı
          <input
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
        </label>
        <div className="calendar-grid">
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map((d) => (
            <small key={d}>{d}</small>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <span key={`empty${i}`} />
          ))}
          {Array.from(
            { length: daysInMonth },
            (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`,
          ).map((d) => {
            const entries = media.filter((m) => m.date === d);
            const score = dailyReport(data, d).points.total;
            return (
              <button
                key={d}
                aria-label={`${dateLabel(d)} · ${score} puan${entries.some((m) => m.kind === 'vlog') ? ' · vlog' : ''}`}
                aria-pressed={date === d}
                style={{ background: score >= 40 ? 'var(--accent-soft)' : undefined }}
                onClick={() => {
                  setDate(d);
                  setTab('day');
                }}
              >
                <b>{d.slice(-2)}</b>
                <span>
                  {entries.some((m) => m.kind === 'vlog') && <Video size={9} />}
                  {entries.some((m) => m.kind !== 'vlog') && <Camera size={9} />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
      <label className="field">
        Not, yiyecek ve etiketlerde ara
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Yürüyüş, kahvaltı, motivasyon…"
        />
      </label>
      {query && (
        <Card className="stack">
          {matches.length ? (
            matches.map((d) => (
              <Button
                key={d.date}
                variant="secondary"
                onClick={() => {
                  setDate(d.date);
                  setTab('day');
                }}
              >
                {dateLabel(d.date)}
              </Button>
            ))
          ) : (
            <p>Bu aramada kayıt bulunamadı.</p>
          )}
        </Card>
      )}
      <Card className="stack">
        <h2>Her gün bir saniye.</h2>
        <p className="muted small">
          Seçili tarihe kadar her günün ilk vlogundan bir saniye. Sessiz, tarih etiketli bir anı.
        </p>
        <label className="field">
          Montaj aralığı
          <select value={montageRange} onChange={(e) => setMontageRange(+e.target.value)}>
            <option value={7}>Son 7 gün</option>
            <option value={30}>Son 30 gün</option>
            <option value={90}>Son 90 gün</option>
            <option value={365}>Son 1 yıl</option>
          </select>
        </label>
        <Button variant="secondary" disabled={busy} onClick={() => void montage()}>
          <Video size={17} />
          {busy ? `Hazırlanıyor · %${montageProgress}` : '1 saniyelik anılarımı birleştir'}
        </Button>
        {busy && (
          <Button variant="quiet" onClick={() => controller.current?.abort()}>
            İptal et
          </Button>
        )}
      </Card>
      {view && <MediaViewer record={view} onClose={() => setView(undefined)} />}
    </div>
  );
}
