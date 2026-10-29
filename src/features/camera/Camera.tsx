import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera as CameraIcon,
  Download,
  FlipHorizontal,
  Images,
  LockKeyhole,
  Trash2,
  Video,
} from 'lucide-react';
import { useStore } from '../../app/Store';
import { Button, Card, Chip, EmptyState, Segmented, Sheet } from '../../ui';
import { useBlobUrl, useMedia, MediaThumb } from '../today/Today';
import { addImage } from '../../data/media/images';
import { readMedia, deleteMedia } from '../../data/media/opfs';
import { createMontage } from '../../data/media/montage';
import { downloadBlob, shareBlob } from '../../data/media/export';
import { dateLabel } from '../../domain/dates';
import type { MediaRecord } from '../../domain/types';
import { ensureMediaPermissions } from '../../app/native';

export function CameraCapture({ onSaved }: { onSaved?: (record: MediaRecord) => void }) {
  const { date, setError } = useStore();
  const [pose, setPose] = useState('Ön');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [active, setActive] = useState(false);
  const [timer, setTimer] = useState(3);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [ghost, setGhost] = useState(true);
  const [ghostBlob, setGhostBlob] = useState<Blob>();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream>();
  const alive = useRef(true);
  const records = useMedia();
  const first = records
    .filter((r) => r.kind === 'progress' && r.pose === pose)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const ghostUrl = useBlobUrl(ghostBlob);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setGhostBlob(undefined);
    if (first)
      void readMedia(first)
        .then((blob) => {
          if (!cancelled) setGhostBlob(blob);
        })
        .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [first]);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void ensureMediaPermissions(false)
      .then(() =>
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }),
      )
      .then(async (media) => {
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = media;
        if (video.current) {
          video.current.srcObject = media;
          await video.current.play();
        }
      })
      .catch(() => {
        setError('Kamera açılamadı. Galeriden fotoğraf seçebilirsin.');
        setActive(false);
      });
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [active, facing, setError]);
  const save = async (blob: Blob) => {
    setBusy(true);
    try {
      const record = await addImage(blob, date, 'progress', pose);
      if (alive.current) {
        setMessage('Fotoğrafın cihazında, güvende.');
        setActive(false);
        onSaved?.(record);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fotoğraf eklenemedi.');
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const capture = async () => {
    setBusy(true);
    try {
      for (let n = timer; n > 0; n--) {
        if (!alive.current) return;
        setCountdown(n);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(0);
      const source = video.current;
      if (!source?.videoWidth) throw new Error('Kamera henüz hazır değil.');
      const canvas = document.createElement('canvas');
      canvas.width = source.videoWidth;
      canvas.height = source.videoHeight;
      canvas.getContext('2d')!.drawImage(source, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Fotoğraf alınamadı.'))),
          'image/jpeg',
          0.95,
        ),
      );
      await save(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fotoğraf alınamadı.');
    } finally {
      if (alive.current) {
        setBusy(false);
        setCountdown(0);
      }
    }
  };
  return (
    <div className="stack">
      <Segmented
        label="Fotoğraf pozu"
        value={pose}
        onChange={setPose}
        options={['Ön', 'Yan', 'Arka'].map((value) => ({ value, label: value }))}
      />
      <div className="camera-preview">
        {active ? (
          <video ref={video} muted playsInline aria-label="Kamera önizlemesi" />
        ) : (
          <div className="camera-empty">
            <CameraIcon size={42} strokeWidth={1} />
            <p>Aynı açı, kendi yolculuğun.</p>
          </div>
        )}
        {active && (
          <svg viewBox="0 0 200 300" className="pose-guide" aria-hidden="true">
            <ellipse cx="100" cy="52" rx="22" ry="28" />
            <path d="M75 88h50l30 72-14 7-25-48v84l10 76h-20l-6-65-6 65H74l10-76v-84l-25 48-14-7z" />
          </svg>
        )}
        {active && ghost && ghostUrl && (
          <img className="ghost-image" src={ghostUrl} alt="İlk fotoğrafınla hizalama" />
        )}
        {countdown > 0 && (
          <b className="camera-countdown" role="timer">
            {countdown}
          </b>
        )}
      </div>
      <div className="grid2">
        <label className="field">
          Zamanlayıcı
          <select value={timer} disabled={busy} onChange={(e) => setTimer(+e.target.value)}>
            <option value={0}>Kapalı</option>
            <option value={3}>3 saniye</option>
            <option value={10}>10 saniye</option>
          </select>
        </label>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}
        >
          <FlipHorizontal size={17} />
          Kamerayı çevir
        </Button>
      </div>
      {first && (
        <label className="check-label">
          <input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} />
          İlk fotoğrafla hizala (%30)
        </label>
      )}
      {active ? (
        <Button disabled={busy} onClick={() => void capture()}>
          <CameraIcon size={18} />
          {busy ? 'Hazırlanıyor…' : 'Fotoğrafı çek'}
        </Button>
      ) : (
        <Button
          disabled={busy}
          onClick={() => {
            if (!navigator.mediaDevices?.getUserMedia) {
              setError('Kamera bu tarayıcıda açılamıyor. Galeriden seçebilirsin.');
              return;
            }
            setActive(true);
          }}
        >
          <CameraIcon size={18} />
          Kamerayı aç
        </Button>
      )}
      <label className="button secondary file-button">
        <Images size={18} />
        Galeriden fotoğraf seç
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void save(file);
          }}
        />
      </label>
      <p className="row privacy-line">
        <LockKeyhole size={15} />
        <span>Konum bilgisi silinir. Fotoğraf yalnızca bu cihazda saklanır.</span>
      </p>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
function MediaImage({ record }: { record: MediaRecord }) {
  const [blob, setBlob] = useState<Blob>();
  useEffect(() => {
    let alive = true;
    void readMedia(record).then((b) => {
      if (alive) setBlob(b);
    });
    return () => {
      alive = false;
    };
  }, [record]);
  const url = useBlobUrl(blob);
  return url ? (
    <img src={url} alt={`${record.pose || 'İlerleme'} · ${dateLabel(record.date)}`} />
  ) : null;
}
export function CompareSlider({ before, after }: { before: MediaRecord; after: MediaRecord }) {
  const [value, setValue] = useState(50);
  const [mode, setMode] = useState('slider');
  const { data } = useStore();
  const caption = (record: MediaRecord) => {
    const day = data.dayLog.find((d) => d.date === record.date);
    return `${dateLabel(record.date, 'd MMM yyyy')}${day?.weight ? ` · ${day.weight} kg` : ''}${day?.measurements?.waist ? ` · Bel ${day.measurements.waist} cm` : ''}`;
  };
  return (
    <div className="stack">
      <Segmented
        label="Karşılaştırma görünümü"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'slider', label: 'Kaydırmalı' },
          { value: 'side', label: 'Yan yana' },
        ]}
      />
      <div className={mode === 'slider' ? 'compare-slider' : 'compare-side'}>
        {mode === 'slider' ? (
          <>
            <div className="compare-base">
              <MediaImage record={after} />
              <span className="compare-caption right">{caption(after)}</span>
            </div>
            <div className="compare-before" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
              <MediaImage record={before} />
            </div>
            <span className="compare-caption before-label">{caption(before)}</span>
            <span className="compare-line" style={{ left: `${value}%` }} />
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              aria-label="Önce sonra kaydırıcısı"
              onChange={(e) => setValue(+e.target.value)}
            />
          </>
        ) : (
          <>
            <div className="compare-pane">
              <MediaImage record={before} />
              <span className="compare-caption">{caption(before)}</span>
            </div>
            <div className="compare-pane">
              <MediaImage record={after} />
              <span className="compare-caption">{caption(after)}</span>
            </div>
          </>
        )}
      </div>
      <div className="grid2 small muted">
        <span>{caption(before)}</span>
        <span>{caption(after)}</span>
      </div>
    </div>
  );
}
export function PhotoTimeline({ from, to }: { from?: string; to?: string } = {}) {
  const records = useMedia()
    .filter((r) => r.kind === 'progress' && (!from || r.date >= from) && (!to || r.date <= to))
    .sort((a, b) => a.date.localeCompare(b.date));
  const [pose, setPose] = useState('Ön');
  const [beforeId, setBeforeId] = useState('');
  const [afterId, setAfterId] = useState('');
  const [view, setView] = useState<MediaRecord>();
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selection, setSelection] = useState<string[] | null>(null);
  const { setError } = useStore();
  const controller = useRef<AbortController>();
  useEffect(() => () => controller.current?.abort(), []);
  const filtered = records.filter((r) => r.pose === pose);
  const before = filtered.find((r) => r.id === beforeId) || filtered[0];
  const after = filtered.find((r) => r.id === afterId) || filtered.at(-1);
  const montage = async () => {
    setBusy(true);
    setPercent(0);
    controller.current = new AbortController();
    try {
      const blob = await createMontage(
        filtered.filter((r) => !selection || selection.includes(r.id)),
        setPercent,
        controller.current.signal,
      );
      await shareBlob(
        blob,
        `formda-donusum.${blob.type.includes('html') ? 'html' : blob.type.includes('mp4') ? 'mp4' : 'webm'}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video hazırlanamadı.');
    } finally {
      setBusy(false);
    }
  };
  if (!records.length)
    return (
      <Card>
        <EmptyState
          title="Her fotoğraf, bir zaman işareti"
          action={
            <Link className="button primary" to="/camera">
              İlk fotoğrafını ekle
            </Link>
          }
        >
          Değişimini kendi gözünden izle. Fotoğrafların cihazında kalır.
        </EmptyState>
      </Card>
    );
  return (
    <div className="stack">
      <Segmented
        label="Poz filtresi"
        value={pose}
        onChange={setPose}
        options={['Ön', 'Yan', 'Arka'].map((value) => ({ value, label: value }))}
      />
      {filtered.length >= 2 && (
        <Card className="stack">
          <h2>İki an, aynı yol</h2>
          <div className="grid2">
            <label className="field">
              Önce
              <select value={before?.id || ''} onChange={(e) => setBeforeId(e.target.value)}>
                {filtered.map((r) => (
                  <option key={r.id} value={r.id}>
                    {dateLabel(r.date)} · {r.id.slice(0, 4)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Sonra
              <select value={after?.id || ''} onChange={(e) => setAfterId(e.target.value)}>
                {filtered.map((r) => (
                  <option key={r.id} value={r.id}>
                    {dateLabel(r.date)} · {r.id.slice(0, 4)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <CompareSlider before={before!} after={after!} />
        </Card>
      )}
      <Button
        variant="secondary"
        disabled={filtered.filter((r) => !selection || selection.includes(r.id)).length < 2 || busy}
        onClick={() => void montage()}
      >
        <Video size={18} />
        {busy ? `Video hazırlanıyor · %${percent}` : 'Hızlandırılmış dönüşüm videosu'}
      </Button>
      <details className="card stack">
        <summary>Videoya girecek kareleri seç</summary>
        <Button variant="quiet" onClick={() => setSelection(null)}>
          Tüm kareleri seç
        </Button>
        {filtered.map((r) => (
          <label key={r.id} className="check-label">
            <input
              type="checkbox"
              checked={!selection || selection.includes(r.id)}
              onChange={(e) =>
                setSelection(
                  e.target.checked
                    ? [...(selection || filtered.map((v) => v.id)), r.id]
                    : (selection || filtered.map((v) => v.id)).filter((id) => id !== r.id),
                )
              }
            />
            {dateLabel(r.date)} · {r.pose}
          </label>
        ))}
      </details>
      {busy && (
        <Button variant="quiet" onClick={() => controller.current?.abort()}>
          İptal et
        </Button>
      )}
      {[...new Set(filtered.map((r) => r.date.slice(0, 7)))].reverse().map((month) => (
        <Card key={month}>
          <h3>{dateLabel(`${month}-01`, 'MMMM yyyy')}</h3>
          <div className="media-grid">
            {filtered
              .filter((r) => r.date.startsWith(month))
              .map((record) => (
                <MediaThumb
                  key={record.id}
                  record={record}
                  onClick={() => {
                    setView(record);
                    setConfirmDelete(false);
                  }}
                />
              ))}
          </div>
        </Card>
      ))}
      {view && (
        <Sheet title={dateLabel(view.date)} onClose={() => setView(undefined)}>
          <div className="photo-detail">
            <MediaImage record={view} />
          </div>
          <Chip>{view.pose}</Chip>
          <Button
            variant="secondary"
            onClick={() =>
              void readMedia(view).then((blob) =>
                downloadBlob(
                  blob,
                  `formda-${view.date}.${blob.type.includes('webp') ? 'webp' : 'jpg'}`,
                ),
              )
            }
          >
            <Download size={17} />
            Fotoğrafı indir
          </Button>
          {confirmDelete ? (
            <Card className="stack">
              <p>Bu fotoğraf cihazından silinsin mi?</p>
              <Button
                variant="danger"
                onClick={() => void deleteMedia(view.id).then(() => setView(undefined))}
              >
                Evet, fotoğrafı sil
              </Button>
            </Card>
          ) : (
            <Button variant="quiet" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={17} />
              Fotoğrafı sil
            </Button>
          )}
        </Sheet>
      )}
    </div>
  );
}
export function CameraPage() {
  const [tab, setTab] = useState('capture');
  return (
    <div className="stack page-enter">
      <div>
        <p className="eyebrow">KENDİ GÖZÜNDEN</p>
        <h1>Yolundan bir kare.</h1>
      </div>
      <Segmented
        label="Fotoğraf bölümü"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'capture', label: 'Fotoğraf ekle' },
          { value: 'timeline', label: 'Zaman tüneli' },
        ]}
      />
      {tab === 'capture' ? <CameraCapture /> : <PhotoTimeline />}
    </div>
  );
}
