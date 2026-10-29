import { useState } from 'react';
import { useStore } from '../../app/Store';
import { Button, Sheet, Chip } from '../../ui';
import { planFor } from '../../domain/program';
import {
  ALTERNATIVE_NAMES,
  chooseDayAlternative,
  clearDayAlternative,
  type AlternativeKind,
  exerciseAlternatives,
} from '../../domain/program/programs';
import { EXERCISES } from '../../data/seed/exercises';

export function DailyAlternative() {
  const { data, date, mutate } = useStore();
  const [open, setOpen] = useState(false);
  const settings = data.planSettings[0],
    plan = planFor(date, settings);
  return (
    <>
      {plan.alternative && (
        <Chip>
          {plan.alternative.kind === 'custom'
            ? 'Hareket düzenlendi'
            : ALTERNATIVE_NAMES[plan.alternative.kind]}
        </Chip>
      )}
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Alternatif
      </Button>
      {open && (
        <Sheet title="Bugünün alternatif planı" onClose={() => setOpen(false)}>
          <p className="muted small">Yalnızca seçili güne uygulanır.</p>
          {(Object.keys(ALTERNATIVE_NAMES) as AlternativeKind[]).map((kind) => {
            const next = chooseDayAlternative(settings, date, kind),
              preview = planFor(date, next);
            return (
              <article className="stack alternative-preview" key={kind}>
                <h3>{ALTERNATIVE_NAMES[kind]}</h3>
                <p className="small muted">
                  {kind === 'short'
                    ? '20–25 dakika · kısa dinlenme'
                    : kind === 'home' && plan.type === 'swim'
                      ? 'Sırt, omuz ve kalça için karada destek çalışması'
                      : plan.title}
                </p>
                <ul>
                  {preview.exercises.map((item, i) => (
                    <li key={i}>
                      {EXERCISES.find((e) => e.id === item.exerciseId)?.name} · {item.sets} ×{' '}
                      {item.minReps}–{item.maxReps}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    mutate(() => ({ planSettings: [next] }));
                    setOpen(false);
                  }}
                >
                  {ALTERNATIVE_NAMES[kind]} seç
                </Button>
              </article>
            );
          })}
          {plan.alternative && (
            <Button
              variant="quiet"
              onClick={() => {
                mutate(() => ({ planSettings: [clearDayAlternative(settings, date)] }));
                setOpen(false);
              }}
            >
              Bu günün asıl planına dön
            </Button>
          )}
        </Sheet>
      )}
    </>
  );
}
export function ChangeExercise({
  exerciseId,
  onSelect,
}: {
  exerciseId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [equipment, setEquipment] = useState('');
  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;
  const matches = exerciseAlternatives(exercise, equipment ? [equipment] : undefined);
  return (
    <>
      <Button variant="quiet" onClick={() => setOpen(true)}>
        Hareketi değiştir
      </Button>
      {open && (
        <Sheet title={`${exercise.name} yerine`} onClose={() => setOpen(false)}>
          <label className="field">
            Kullanabileceğin ekipman
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              <option value="">Tüm ekipmanlar</option>
              {[...new Set(EXERCISES.map((e) => e.equipment))].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          {matches.length ? (
            matches.map((candidate) => (
              <Button
                key={candidate.id}
                variant="secondary"
                onClick={() => {
                  onSelect(candidate.id);
                  setOpen(false);
                }}
              >
                {candidate.name} · {candidate.equipment}
              </Button>
            ))
          ) : (
            <p className="muted">
              Bu ekipmanda aynı hareket örüntüsüne uygun seçenek yok. Ekipman filtresini
              değiştirebilirsin.
            </p>
          )}
        </Sheet>
      )}
    </>
  );
}
