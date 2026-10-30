import { Flame, Footprints, Plus } from 'lucide-react';
import { Button, Card, Ring } from '../../ui';
import type { Macros, Targets } from '../../domain/types';

export function DailyOverview({
  macros,
  targets,
  active,
  source,
  steps,
  onFood,
}: {
  macros: Macros;
  targets: Targets;
  active: number;
  source: string;
  steps: number | undefined;
  onFood: () => void;
}) {
  const remaining = targets.kcal - macros.kcal;
  const nutrients = [
    { label: 'Protein', value: macros.protein, goal: targets.protein, tone: 'protein' },
    { label: 'Karbonhidrat', value: macros.carb, goal: targets.carb, tone: 'carb' },
    { label: 'Yağ', value: macros.fat, goal: targets.fat, tone: 'fat' },
  ];
  return (
    <Card className="energy-overview stack">
      <div className="row between">
        <p className="eyebrow">GÜNLÜK BESLENMEN</p>
        <Button variant="quiet" onClick={onFood}>
          <Plus size={16} />
          Öğün ekle
        </Button>
      </div>
      <div className="calorie-summary">
        <Ring value={macros.kcal} max={targets.kcal} label="Alınan kalori" unit="kcal" size={148} />
        <div className="calorie-context">
          <span className="small muted">Bugünkü hedefin</span>
          <p className="target-number">
            {Math.round(targets.kcal).toLocaleString('tr-TR')} <small>kcal</small>
          </p>
          <div className="divider" />
          <b className="remaining-number">
            {Math.abs(Math.round(remaining)).toLocaleString('tr-TR')}
          </b>
          <p className="small muted">{remaining >= 0 ? 'kcal kaldı' : 'kcal hedef farkı'}</p>
        </div>
      </div>
      <div className="nutrient-strip">
        {nutrients.map((n) => (
          <div
            key={n.tone}
            className={`nutrient-item ${n.tone}`}
            role="img"
            aria-label={`${n.label}: ${n.value === undefined ? 'bilinmiyor' : Math.round(n.value) + ' g'}${n.goal !== undefined ? ', hedef ' + n.goal : ''}`}
          >
            <span>{n.label}</span>
            <p>
              <b>{n.value === undefined ? '—' : Math.round(n.value)}</b> <small>g</small>
            </p>
            <div className="nutrient-track">
              <i
                style={{
                  width:
                    n.goal && n.value !== undefined
                      ? `${Math.min(100, Math.max(0, (n.value / n.goal) * 100))}%`
                      : '0%',
                }}
              />
            </div>
            <small>{n.goal !== undefined ? `${n.goal} g hedef` : 'Hedef seçilmedi'}</small>
          </div>
        ))}
      </div>
      <div className="activity-strip">
        <div role="img" aria-label={`Harcanan kalori tahmini: ${Math.round(active)} kcal`}>
          <Flame size={19} />
          <div>
            <b>
              {Math.round(active).toLocaleString('tr-TR')} <small>kcal</small>
            </b>
            <span>Harcama · Tahmini</span>
            <small>{source}</small>
          </div>
        </div>
        <div
          role="img"
          aria-label={`Adım: ${steps ?? 0}${targets.steps ? ', hedef ' + targets.steps : ''}`}
        >
          <Footprints size={19} />
          <div>
            <b>{steps === undefined ? '—' : steps.toLocaleString('tr-TR')}</b>
            <span>Adım</span>
            <small>
              {steps === undefined
                ? 'Henüz kayıt yok'
                : targets.steps
                  ? `${targets.steps.toLocaleString('tr-TR')} hedef`
                  : 'Günlük hareket'}
            </small>
          </div>
        </div>
      </div>
    </Card>
  );
}
