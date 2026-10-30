import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MovementFrames } from '../../ui/MovementFrames';
import { APPARATUS } from '../../data/seed/apparatus';
import { EXERCISES } from '../../data/seed/exercises';
import { Button, Card, Chip, Sheet, EmptyState } from '../../ui';
import { BodyMap, MUSCLES } from '../../ui/BodyMap';
import { normalize } from '../../domain/parser';
import type { Exercise } from '../../domain/types';
import { TECHNIQUES, TECHNIQUE_MUSCLES } from '../../domain/exercises/technique';

export function ExerciseGuide({ exercise }: { exercise: Exercise }) {
  const technique = TECHNIQUES[exercise.id];
  const muscles = TECHNIQUE_MUSCLES[exercise.id];
  return (
    <div className="stack">
      <MovementFrames key={exercise.id} exercise={exercise} />
      <Card className="stack">
        <h3>Başlangıç ayarı</h3>
        <p>{technique?.setup || exercise.setup || exercise.howTo[0]}</p>
        <p className="small muted">
          {APPARATUS.find((a) => a.id === exercise.apparatusId)?.name || exercise.equipment}
        </p>
        <p className="notice">
          {technique?.static
            ? '2–3 set × 15–30 sn · form bozulmadan dinlen'
            : exercise.prescription}
        </p>
      </Card>
      <div className="row">
        <Chip>{exercise.equipment}</Chip>
        <Chip>{exercise.level}</Chip>
      </div>
      {muscles && (
        <Card className="grid2">
          <div>
            <h3>Ana kas grupları</h3>
            <p className="small muted">{muscles.primary.map((id) => MUSCLES[id]).join(' · ')}</p>
          </div>
          <div>
            <h3>Destekleyen kaslar</h3>
            <p className="small muted">{muscles.secondary.map((id) => MUSCLES[id]).join(' · ')}</p>
          </div>
        </Card>
      )}
      <ol className="instruction-list">
        {(technique?.steps || exercise.howTo).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Card className="stack">
        <h3>Sık hatalar</h3>
        {(technique?.mistakes || exercise.mistakes).map((m) => (
          <p className="small muted" key={m}>
            {m}
          </p>
        ))}
        <p className="notice">{exercise.safety}</p>
      </Card>
      <Card className="stack">
        <h3>Nefes</h3>
        <p>{technique?.breathing || exercise.breathing}</p>
        <h3>Daha kolay</h3>
        <p>{exercise.easier}</p>
        <h3>Daha zor</h3>
        <p>{exercise.harder}</p>
      </Card>
      <BodyMap active={muscles ? [...muscles.primary, ...muscles.secondary] : exercise.muscles} />
      {technique && (
        <details className="card">
          <summary>Teknik kaynak</summary>
          <p className="small muted">
            Şema özgün çizimdir. Teknik adımlar aşağıdaki kaynağa göre gözden geçirildi; şema kişiye
            özel form değerlendirmesi yapmaz.
          </p>
          <a className="button quiet" href={technique.source} target="_blank" rel="noreferrer">
            Teknik referansı aç
          </a>
        </details>
      )}
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
  const [level, setLevel] = useState('');
  const [movement, setMovement] = useState('');
  const [environment, setEnvironment] = useState('');
  const [goal, setGoal] = useState('');
  const [selected, setSelected] = useState<Exercise>();
  const filtered = EXERCISES.filter(
    (e) =>
      normalize(e.name + ' ' + e.muscles.map((id) => MUSCLES[id] || id).join(' ')).includes(
        normalize(query),
      ) &&
      (!muscle || e.muscles.includes(muscle)) &&
      (!equipment || e.equipment === equipment) &&
      (!level || e.level === level) &&
      (!movement || e.svgKey === movement) &&
      (!environment ||
        (environment === 'pool'
          ? e.equipment === 'havuz'
          : environment === 'home'
            ? ['vücut ağırlığı', 'bant', 'dumbbell'].includes(e.equipment)
            : e.equipment !== 'havuz')) &&
      (!goal ||
        (['cardio', 'swim'].includes(e.svgKey)
          ? 'conditioning'
          : e.svgKey === 'mobility'
            ? 'mobility'
            : 'strength') === goal),
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
      <details className="card stack">
        <summary>Diğer filtreler</summary>
        <div className="grid2">
          <label className="field">
            Zorluk
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Tümü</option>
              {[...new Set(EXERCISES.map((e) => e.level))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Hareket türü
            <select value={movement} onChange={(e) => setMovement(e.target.value)}>
              <option value="">Tümü</option>
              {Object.entries({
                press: 'İtiş',
                pull: 'Çekiş',
                squat: 'Diz baskın',
                hinge: 'Kalça baskın',
                core: 'Gövde',
                isolation: 'Tek eklem',
                cardio: 'Kardiyo',
                swim: 'Yüzme',
                mobility: 'Mobilite',
              }).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Ortam
            <select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
              <option value="">Tümü</option>
              <option value="home">Ev / az ekipman</option>
              <option value="gym">Salon</option>
              <option value="pool">Havuz</option>
            </select>
          </label>
          <label className="field">
            Çalışma odağı
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="">Tümü</option>
              <option value="strength">Kuvvet</option>
              <option value="conditioning">Dayanıklılık</option>
              <option value="mobility">Mobilite</option>
            </select>
          </label>
        </div>
        <Button
          variant="quiet"
          onClick={() => {
            setQuery('');
            setMuscle('');
            setEquipment('');
            setLevel('');
            setMovement('');
            setEnvironment('');
            setGoal('');
          }}
        >
          Filtreleri temizle
        </Button>
      </details>
      <p className="small muted" aria-live="polite">
        {filtered.length} hareket bulundu
      </p>
      {!filtered.length && (
        <EmptyState title="Bu filtrelerde hareket yok">
          Aramayı kısaltabilir veya filtrelerini değiştirebilirsin.
        </EmptyState>
      )}
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
