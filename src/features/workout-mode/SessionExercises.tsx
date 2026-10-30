import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Sheet } from '../../ui';
import { EXERCISES } from '../../data/seed/exercises';
import type { TemplateExercise } from '../../domain/types';
import { Library } from './Library';

export function SessionExercises({
  exercises,
  current,
  onChange,
}: {
  exercises: TemplateExercise[];
  current: number;
  onChange: (list: TemplateExercise[], current: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<number>();
  const [message, setMessage] = useState('');
  const move = (index: number, direction: number) => {
    const next = [...exercises];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(
      next,
      current === index ? index + direction : current === index + direction ? index : current,
    );
  };
  return (
    <Card className="stack">
      <div className="row between">
        <h2>Seans hareketleri</h2>
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus size={16} />
          Ekle
        </Button>
      </div>
      <p className="small muted">
        Bu seansta yaptığın düzenlemeler kayıtlı programını değiştirmez. Çıkardığın hareketin
        tamamlanan setleri geçmişinde kalır.
      </p>
      <ol className="session-exercise-list">
        {exercises.map((item, index) => {
          const name = EXERCISES.find((e) => e.id === item.exerciseId)?.name ?? item.exerciseId;
          return (
            <li
              key={`${item.exerciseId}-${index}`}
              aria-current={index === current ? 'step' : undefined}
            >
              <span>
                {index + 1}. {name}
              </span>
              <div className="row">
                <Button
                  variant="quiet"
                  aria-label={`${name} yukarı taşı`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={17} />
                </Button>
                <Button
                  variant="quiet"
                  aria-label={`${name} aşağı taşı`}
                  disabled={index === exercises.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={17} />
                </Button>
                <Button
                  variant="quiet"
                  aria-label={`${name} seanstan çıkar`}
                  disabled={exercises.length === 1}
                  onClick={() => setRemoving(index)}
                >
                  <Trash2 size={17} />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      {message && <p role="status">{message}</p>}
      {adding && (
        <Sheet title="Seansa hareket ekle" onClose={() => setAdding(false)}>
          <Library
            onSelect={(id) => {
              if (exercises.some((e) => e.exerciseId === id)) {
                setMessage('Bu hareket zaten seansında.');
                setAdding(false);
                return;
              }
              const exercise = EXERCISES.find((e) => e.id === id)!;
              onChange(
                [
                  ...exercises,
                  {
                    exerciseId: id,
                    sets: 3,
                    minReps: 8,
                    maxReps: 12,
                    restSec: exercise.defaultRestSec,
                  },
                ],
                current,
              );
              setAdding(false);
              setMessage('Hareket seansına eklendi.');
            }}
          />
        </Sheet>
      )}
      {removing !== undefined && (
        <Sheet title="Hareket seanstan çıkarılsın mı?" onClose={() => setRemoving(undefined)}>
          <p>Tamamladığın setler korunur. Yalnızca kalan hareket sırası değişir.</p>
          <Button variant="secondary" onClick={() => setRemoving(undefined)}>
            Vazgeç
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const next = exercises.filter((_, i) => i !== removing);
              onChange(
                next,
                Math.max(0, Math.min(next.length - 1, current > removing ? current - 1 : current)),
              );
              setRemoving(undefined);
            }}
          >
            Evet, hareketi çıkar
          </Button>
        </Sheet>
      )}
    </Card>
  );
}
