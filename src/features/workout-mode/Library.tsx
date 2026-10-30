import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MovementFrames } from '../../ui/MovementFrames';
import { APPARATUS } from '../../data/seed/apparatus';
import { EXERCISES } from '../../data/seed/exercises';
import { Button, Card, Chip, Sheet } from '../../ui';
import { BodyMap, MUSCLES } from '../../ui/BodyMap';
import { normalize } from '../../domain/parser';
import type { Exercise } from '../../domain/types';

export function ExerciseGuide({ exercise }: { exercise: Exercise }) {
  return (
    <div className="stack">
      <MovementFrames exercise={exercise} />
      <Card className="stack">
        <h3>Başlangıç ayarı</h3>
        <p>{exercise.setup || exercise.howTo[0]}</p>
        <p className="small muted">
          {APPARATUS.find((a) => a.id === exercise.apparatusId)?.name || exercise.equipment}
        </p>
        <p className="notice">{exercise.prescription}</p>
      </Card>
      <div className="row">
        <Chip>{exercise.equipment}</Chip>
        <Chip>{exercise.level}</Chip>
      </div>
      <ol className="instruction-list">
        {exercise.howTo.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Card className="stack">
        <h3>Sık hatalar</h3>
        {exercise.mistakes.map((m) => (
          <p className="small muted" key={m}>
            {m}
          </p>
        ))}
        <p className="notice">{exercise.safety}</p>
      </Card>
      <Card className="stack">
        <h3>Nefes</h3>
        <p>{exercise.breathing}</p>
        <h3>Daha kolay</h3>
        <p>{exercise.easier}</p>
        <h3>Daha zor</h3>
        <p>{exercise.harder}</p>
      </Card>
      <BodyMap active={exercise.muscles} />
      <div>
        <h3>Alternatiflerin</h3>
        <ul className="instruction-list">
          {exercise.alternatives.map((id, i) => (
            <li key={i}>
              <strong>
                {['İstasyon doluysa', 'Ev / az ekipman', 'Daha kolay', 'Daha zor'][i]}:{' '}
              </strong>
              {EXERCISES.find((e) => e.id === id)?.name}
              {i === 2
                ? ' · daha hafif yük veya kısa süre'
                : i === 3
                  ? ' · teknik korunarak daha yüksek direnç'
                  : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export function Library({ onSelect }: { onSelect?: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [selected, setSelected] = useState<Exercise>();
  const filtered = EXERCISES.filter(
    (e) =>
      normalize(e.name).includes(normalize(query)) &&
      (!muscle || e.muscles.includes(muscle)) &&
      (!equipment || e.equipment === equipment),
  );
  return (
    <div className="stack">
      <div>
        <p className="eyebrow">HAREKETİ TANI</p>
        <h1>Hareket kütüphanesi</h1>
        <p className="muted small">{EXERCISES.length} hareket · kendi ritminde öğren</p>
      </div>
      <Link className="button secondary" to="/apparatus">
        Aletleri keşfet
      </Link>
      <label className="field">
        Hareket ara
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Leg press, yüzme…"
        />
      </label>
      <div className="grid2">
        <label className="field">
          Kas grubu
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
            <option value="">Tümü</option>
            {Object.entries(MUSCLES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Ekipman
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            <option value="">Tümü</option>
            {[...new Set(EXERCISES.map((e) => e.equipment))].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>
      {filtered.map((exercise) => (
        <Card key={exercise.id}>
          <button className="library-item" onClick={() => setSelected(exercise)}>
            <span>
              <strong>{exercise.name}</strong>
              <small>{exercise.muscles.map((m) => MUSCLES[m]).join(' · ')}</small>
            </span>
            <Chip>{exercise.equipment}</Chip>
          </button>
          {onSelect && (
            <Button variant="quiet" onClick={() => onSelect(exercise.id)}>
              Harekete ekle
            </Button>
          )}
        </Card>
      ))}
      {selected && (
        <Sheet title={selected.name} onClose={() => setSelected(undefined)}>
          <ExerciseGuide exercise={selected} />
          {onSelect && (
            <Button
              onClick={() => {
                onSelect(selected.id);
                setSelected(undefined);
              }}
            >
              Bu hareketi seç
            </Button>
          )}
        </Sheet>
      )}
    </div>
  );
}
