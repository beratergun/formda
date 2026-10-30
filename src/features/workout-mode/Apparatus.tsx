import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cable, Dumbbell, Footprints, Waves } from 'lucide-react';
import { TEMPLATE_NAMES } from '../../domain/program';
import { APPARATUS } from '../../data/seed/apparatus';
import { EXERCISES } from '../../data/seed/exercises';
import { useStore } from '../../app/Store';
import { Button, Card, Sheet } from '../../ui';
import { ExerciseGuide } from './Library';
import type { Exercise } from '../../domain/types';
export function Apparatus() {
  const { data, mutate } = useStore();
  const [selected, setSelected] = useState(APPARATUS[0].id);
  const [guide, setGuide] = useState<Exercise>();
  const [pending, setPending] = useState<string>();
  const [message, setMessage] = useState('');
  const device = APPARATUS.find((a) => a.id === selected)!;
  const settings = data.planSettings[0];
  return (
    <div className="stack page-enter">
      <div>
        <p className="eyebrow">SALONU TANI</p>
        <h1>Aletler</h1>
        <p className="muted">Aleti seç, hareketi öğren, programına ekle.</p>
      </div>
      <Link className="button quiet" to="/library">
        Tüm hareketler
      </Link>
      <div className="apparatus-grid">
        {APPARATUS.map((a) => {
          const Icon =
            a.id === 'pool'
              ? Waves
              : a.id === 'bodyweight'
                ? Footprints
                : a.id === 'cable'
                  ? Cable
                  : Dumbbell;
          return (
            <button key={a.id} aria-pressed={selected === a.id} onClick={() => setSelected(a.id)}>
              <Icon size={24} strokeWidth={1.8} />
              <span>{a.name}</span>
            </button>
          );
        })}
      </div>
      <Card className="stack">
        <h2>{device.name}</h2>
        <h3>Bu alet ne işe yarar?</h3>
        <p>{device.description}</p>
      </Card>
      {EXERCISES.filter((e) => e.apparatusId === selected).map((e) => (
        <Card key={e.id} className="stack">
          <h3>{e.name}</h3>
          <p className="muted small">{e.prescription}</p>
          <Button variant="secondary" onClick={() => setGuide(e)}>
            Nasıl yapılır? · {e.name}
          </Button>
          <Button variant="quiet" onClick={() => setPending(e.id)}>
            Programa ekle · {e.name}
          </Button>
        </Card>
      ))}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {guide && (
        <Sheet title={guide.name} onClose={() => setGuide(undefined)}>
          <ExerciseGuide exercise={guide} />
        </Sheet>
      )}
      {pending && (
        <Sheet title="Hangi şablona eklensin?" onClose={() => setPending(undefined)}>
          {Object.keys(settings.templates).map((id) => (
            <Button
              key={id}
              variant="secondary"
              onClick={() => {
                mutate((v) => ({
                  planSettings: [
                    {
                      ...v.planSettings[0],
                      templates: {
                        ...v.planSettings[0].templates,
                        [id]: [
                          ...v.planSettings[0].templates[id],
                          { exerciseId: pending, sets: 3, minReps: 8, maxReps: 12, restSec: 90 },
                        ],
                      },
                    },
                  ],
                }));
                setMessage('Hareket programına eklendi.');
                setPending(undefined);
              }}
            >
              {TEMPLATE_NAMES[id] || id}
            </Button>
          ))}
        </Sheet>
      )}
    </div>
  );
}
