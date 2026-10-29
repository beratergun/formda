import type { Macros } from '../domain/types';

export function MacroBreakdown({ macros }: { macros: Macros }) {
  if (macros.carb === undefined || macros.fat === undefined)
    return (
      <p className="muted small">
        Makro dağılımı, karbonhidrat ve yağ değerleri olan kayıtlarınla oluşur.
      </p>
    );
  const energy = macros.protein * 4 + macros.carb * 4 + macros.fat * 9;
  return (
    <div className="stack macro-breakdown">
      <p className="eyebrow">MAKRO DAĞILIMI · ENERJİYE GÖRE</p>
      {[
        {
          label: 'Protein',
          grams: macros.protein,
          kcal: macros.protein * 4,
          color: 'var(--accent)',
        },
        {
          label: 'Karbonhidrat',
          grams: macros.carb,
          kcal: macros.carb * 4,
          color: 'var(--strength)',
        },
        { label: 'Yağ', grams: macros.fat, kcal: macros.fat * 9, color: 'var(--swim)' },
      ].map((item) => (
        <div key={item.label}>
          <div className="row between small">
            <span>{item.label}</span>
            <b>
              {item.grams.toLocaleString('tr', { maximumFractionDigits: 1 })} g · %
              {Math.round((item.kcal / Math.max(1, energy)) * 100)}
            </b>
          </div>
          <div className="macro-track">
            <i
              style={{
                width: `${(item.kcal / Math.max(1, energy)) * 100}%`,
                background: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
