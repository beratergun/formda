import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Maximize2, BookOpen } from 'lucide-react';
import { Button, Card, Segmented, Sheet } from './index';
import { TechnicalPoseArt } from './TechnicalPose';
import { TECHNIQUES } from '../domain/exercises/technique';
import type { Exercise } from '../domain/types';

export function MovementFrames({ exercise }: { exercise: Exercise }) {
  const technique = TECHNIQUES[exercise.id];
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [compare, setCompare] = useState(false);
  const [full, setFull] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduced(query.matches);
      if (query.matches) setPlaying(false);
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!playing || reduced || technique?.static || compare) return;
    const timer = setInterval(() => setFrame((f) => 1 - f), 1800 / speed);
    return () => clearInterval(timer);
  }, [playing, reduced, technique?.static, compare, speed]);
  if (!technique)
    return (
      <Card className="guide-fallback stack">
        <BookOpen size={24} />
        <h3>Metin ve kas rehberi</h3>
        <p className="small muted">
          Bu varyant için doğrulanmış bir hareket görseli henüz yok. Aşağıdaki kurulum, uygulama
          adımları ve kas haritası ile ilerleyebilirsin.
        </p>
      </Card>
    );
  const art = (index: number) => (
    <figure key={index}>
      <TechnicalPoseArt
        technique={technique}
        pose={technique.poses[index]}
        index={index}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
      />
      <figcaption>
        <b>{technique.static ? 'Statik tutuş' : `${index + 1} · ${technique.labels[index]}`}</b>
        <span>{technique.cues[index]}</span>
      </figcaption>
    </figure>
  );
  const stage = (
    <div className={`technique-stage ${compare ? 'compare-poses' : ''}`}>
      {compare ? [art(0), art(1)] : art(frame)}
    </div>
  );
  const controls = !technique.static && (
    <div className="stack technique-controls">
      <Segmented
        label="Teknik poz"
        value={String(frame)}
        onChange={(value) => {
          setFrame(+value);
          setPlaying(false);
        }}
        options={[
          { value: '0', label: '1 · Başlangıç' },
          { value: '1', label: '2 · Bitiş' },
        ]}
      />
      <div className="row between">
        <Button
          variant="secondary"
          aria-label={playing ? 'Poz geçişini duraklat' : 'Poz geçişini oynat'}
          aria-pressed={playing}
          disabled={reduced || compare}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? 'Duraklat' : 'Oynat'}
        </Button>
        <Button
          variant="quiet"
          aria-label="Pozları başa al"
          onClick={() => {
            setFrame(0);
            setPlaying(false);
          }}
        >
          <RotateCcw size={18} />
        </Button>
        <label className="field speed-field">
          Geçiş hızı
          <select
            aria-label="Poz geçiş hızı"
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
          >
            <option value={0.5}>0,5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1,5×</option>
          </select>
        </label>
      </div>
      <Button
        variant="quiet"
        aria-pressed={compare}
        onClick={() => {
          setCompare(!compare);
          setPlaying(false);
        }}
      >
        İki pozu karşılaştır
      </Button>
      {reduced && (
        <p className="small muted">
          Azaltılmış hareket tercihin etkin; pozları düğmelerle seçebilirsin.
        </p>
      )}
    </div>
  );
  return (
    <div className="stack technique-viewer">
      <div className="row between">
        <p className="eyebrow">TEKNİK REHBER · {technique.static ? 'STATİK TUTUŞ' : 'İKİ POZ'}</p>
        <Button variant="quiet" aria-label="Teknik rehberi büyüt" onClick={() => setFull(true)}>
          <Maximize2 size={18} />
        </Button>
      </div>
      <p className="small muted">{technique.view}</p>
      {stage}
      {controls}
      <p className="small muted">
        {technique.static
          ? 'Tekrar yerine süreyle takip et. Formunu ve nefesini koruyabildiğin kadar tut.'
          : 'Şema, başlangıç ve bitişte dikkat edeceğin noktaları gösterir. Hareketi kendi rahat aralığında, kontrollü uygula.'}
      </p>
      {full && (
        <Sheet title={`${exercise.name} · Teknik rehber`} onClose={() => setFull(false)}>
          <div className="technique-expanded stack">
            {stage}
            {controls}
          </div>
        </Sheet>
      )}
    </div>
  );
}
