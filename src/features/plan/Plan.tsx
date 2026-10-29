import { useState } from 'react';
import { ProgramPicker } from './ProgramPicker';
import { selectProgram, type ProgramId } from '../../domain/program/programs';
import { ChangeExercise } from './DailyAlternative';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, CalendarDays, Check, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useStore, newId } from '../../app/Store';
import { Button, Card, Chip, Segmented, Sheet } from '../../ui';
import { defaultPlan, PHASES, planFor, TEMPLATE_NAMES } from '../../domain/program';
import { adjustment } from '../../domain/progression';
import { dateDiff, monday, shiftDate, weekday } from '../../domain/dates';
import {
  MEALS,
  type Horizon,
  type PlanSettings,
  type Targets,
  type TemplateExercise,
  type WorkoutType,
} from '../../domain/types';
import { calculate, total } from '../../domain/calories';
import { searchFoods } from '../../domain/parser';
import { DEFAULT_MENU } from '../../data/seed/foods';
import { Library } from '../workout-mode/Library';
import { EXERCISES } from '../../data/seed/exercises';

const weekdays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export function Plan() {
  const { data, date, mutate, updateDay } = useStore();
  const [tab, setTab] = useState('training');
  const [template, setTemplate] = useState('A');
  const [addExercise, setAddExercise] = useState(false);
  const [inspectDate, setInspectDate] = useState(date);
  const [quoteText, setQuoteText] = useState('');
  const [quoteCategory, setQuoteCategory] = useState('genel');
  const settings = data.planSettings[0];
  const inspected = planFor(inspectDate, settings);
  const patch = (value: Partial<PlanSettings>) =>
    mutate((v) => ({ planSettings: [{ ...v.planSettings[0], ...value }] }));
  const editMovement = (index: number, value: Partial<TemplateExercise>) =>
    patch({
      templates: {
        ...settings.templates,
        [template]: settings.templates[template].map((e, i) =>
          i === index ? { ...e, ...value } : e,
        ),
      },
    });
  const reorder = (index: number, delta: number) => {
    const items = [...settings.templates[template]];
    [items[index], items[index + delta]] = [items[index + delta], items[index]];
    patch({ templates: { ...settings.templates, [template]: items } });
  };
  const recent = data.workoutLog
    .filter((w) => w.done && w.type !== 'rest')
    .sort((a, b) => a.startedAt - b.startedAt)
    .slice(-3);
  const missedWeeks = [0, 1].filter((offset) => {
    const start = shiftDate(monday(date), -(offset + 1) * 7);
    return (
      !data.workoutLog.some(
        (w) =>
          w.done &&
          w.type !== 'rest' &&
          dateDiff(w.date, start) >= 0 &&
          dateDiff(w.date, start) < 7,
      ) && dateDiff(date, settings.startDate) >= (offset + 1) * 7
    );
  }).length;
  const proposal = adjustment(
    recent.map((w) => ({
      rpe: w.rpe || Math.max(0, ...w.sets.map((s) => s.rpe || 0)),
      energy: data.dayLog.find((d) => d.date === w.date)?.energy,
    })),
    missedWeeks,
  );
  return (
    <div className="stack page-enter">
      <div>
        <p className="eyebrow">HAYATINA UYAN BİR DÜZEN</p>
        <h1>Rotanı sen çiz.</h1>
        <p className="muted">Planın değişebilir. Yolun sana ait.</p>
      </div>
      <Segmented
        label="Plan bölümü"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'training', label: 'Antrenman' },
          { value: 'nutrition', label: 'Beslenme' },
          { value: 'targets', label: 'Hedefler' },
          { value: 'quotes', label: 'Sözlerim' },
          { value: 'timeline', label: 'Program' },
        ]}
      />
      {tab === 'training' && (
        <>
          <Card>
            <ProgramPicker settings={settings} onChange={(next) => patch(next)} />
          </Card>
          <Card className="stack">
            <div className="row between">
              <h2>Önündeki yol</h2>
              <CalendarDays size={20} className="accent" />
            </div>
            <div className="grid2">
              <label className="field">
                Başlangıç tarihi
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => {
                    if (e.target.value) patch({ startDate: e.target.value });
                  }}
                />
              </label>
              <label className="field">
                Plan ufku
                <select
                  value={settings.horizon}
                  onChange={(e) => patch({ horizon: e.target.value as Horizon })}
                >
                  <option value="6m">6 ay</option>
                  <option value="1y">1 yıl</option>
                  <option value="3y">3 yıl</option>
                  <option value="5y">5 yıl</option>
                  <option value="forever">Süresiz</option>
                </select>
              </label>
            </div>
            <label className="field">
              Yüzme hedefi (m)
              <input
                type="number"
                min={25}
                step={25}
                value={settings.swimTargetM || ''}
                placeholder="Faza göre ilerlesin"
                onChange={(e) => patch({ swimTargetM: +e.target.value || undefined })}
              />
            </label>
            <div className="grid2">
              <label className="field">
                Deneyim
                <select
                  value={settings.experience}
                  onChange={(e) => patch({ experience: e.target.value })}
                >
                  <option value="beginner">Yeni başlıyorum</option>
                  <option value="returning">Geri dönüyorum</option>
                  <option value="experienced">Düzenli hareket ediyorum</option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend>Ekipman</legend>
              <div className="choice-grid">
                {['salon', 'ev', 'havuz'].map((item) => (
                  <button
                    key={item}
                    className="choice"
                    aria-pressed={settings.equipment.includes(item)}
                    onClick={() =>
                      patch({
                        equipment: settings.equipment.includes(item)
                          ? settings.equipment.filter((v) => v !== item)
                          : [...settings.equipment, item],
                      })
                    }
                  >
                    {item === 'salon' ? 'Salon' : item === 'ev' ? 'Ev' : 'Havuz'}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button
              variant="secondary"
              disabled={!settings.equipment.length}
              onClick={() =>
                patch({
                  ...selectProgram(
                    settings,
                    (settings.programId || 'personal') as ProgramId,
                    settings.daysPerWeek,
                  ),
                  horizon: settings.horizon,
                })
              }
            >
              Tercihlerimle haftayı yeniden kur
            </Button>
          </Card>
          <Card className="stack">
            <h2>Haftanın ritmi</h2>
            {settings.weekTemplate.map((day, index) => (
              <div key={index} className="schedule-row">
                <h3>{weekdays[index]}</h3>
                <div className="grid2">
                  <label className="field">
                    {weekdays[index]} türü
                    <select
                      value={day.type}
                      onChange={(e) => {
                        const type = e.target.value as WorkoutType;
                        const titles = {
                          strength: 'Kuvvet',
                          swim: 'Yüzme',
                          cardio: 'Kardiyo',
                          recovery: 'Toparlanma',
                          rest: 'Planlı dinlenme',
                        };
                        patch({
                          weekTemplate: settings.weekTemplate.map((d, i) =>
                            i === index
                              ? {
                                  ...d,
                                  type,
                                  title:
                                    type === 'strength'
                                      ? `Kuvvet ${d.templateId || 'A'}`
                                      : titles[type],
                                  templateId: type === 'strength' ? d.templateId || 'A' : undefined,
                                }
                              : d,
                          ),
                        });
                      }}
                    >
                      <option value="strength">Kuvvet</option>
                      <option value="swim">Yüzme</option>
                      <option value="cardio">Kardiyo</option>
                      <option value="recovery">Toparlanma</option>
                      <option value="rest">Dinlenme</option>
                    </select>
                  </label>
                  <label className="field">
                    {weekdays[index]} saati
                    <input
                      type="time"
                      value={day.time}
                      onChange={(e) => {
                        if (e.target.value)
                          patch({
                            weekTemplate: settings.weekTemplate.map((d, i) =>
                              i === index ? { ...d, time: e.target.value } : d,
                            ),
                          });
                      }}
                    />
                  </label>
                </div>
                {day.type === 'strength' && (
                  <label className="field">
                    {weekdays[index]} şablonu
                    <select
                      value={day.templateId || 'A'}
                      onChange={(e) =>
                        patch({
                          weekTemplate: settings.weekTemplate.map((d, i) =>
                            i === index
                              ? {
                                  ...d,
                                  templateId: e.target.value,
                                  title: TEMPLATE_NAMES[e.target.value] || e.target.value,
                                }
                              : d,
                          ),
                        })
                      }
                    >
                      {Object.keys(settings.templates).map((id) => (
                        <option key={id} value={id}>
                          {TEMPLATE_NAMES[id] || id}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="field">
                  {weekdays[index]} notu
                  <input
                    value={day.note}
                    onChange={(e) =>
                      patch({
                        weekTemplate: settings.weekTemplate.map((d, i) =>
                          i === index ? { ...d, note: e.target.value } : d,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() => {
                const overrides = { ...settings.overrides };
                const start = monday(date);
                for (let i = 0; i < 7; i++)
                  overrides[shiftDate(start, i + 7)] = {
                    ...planFor(shiftDate(start, i), settings),
                  };
                patch({ overrides });
                updateDay({
                  boxes: {
                    ...(data.dayLog.find((d) => d.date === date)?.boxes || {
                      h: false,
                      s: false,
                      k: false,
                      u: false,
                    }),
                    h: true,
                  },
                });
              }}
            >
              Bu haftayı gelecek hafta tekrarla
            </Button>
            <Button
              variant="quiet"
              onClick={() =>
                patch({
                  ...defaultPlan(settings.startDate, settings.daysPerWeek, settings.equipment),
                  horizon: settings.horizon,
                })
              }
            >
              <RefreshCw size={16} />
              Varsayılana dön
            </Button>
          </Card>
          {proposal && (
            <Card className="stack">
              <h3>{proposal}</h3>
              <p className="muted small">Bu değişiklik yalnızca onayladığında uygulanır.</p>
              <Button
                onClick={() => {
                  if (proposal.startsWith('Hafif')) patch({ deloadFrom: date });
                  else
                    patch({
                      ...defaultPlan(settings.startDate, 3, settings.equipment),
                      horizon: settings.horizon,
                    });
                }}
              >
                Öneriyi uygula
              </Button>
            </Card>
          )}
          <Card className="stack">
            <h2>Hareket şablonların</h2>
            <Segmented
              label="Kuvvet şablonu"
              value={template}
              onChange={setTemplate}
              options={Object.keys(settings.templates).map((value) => ({
                value,
                label: TEMPLATE_NAMES[value] || value,
              }))}
            />
            {(settings.templates[template] || []).map((item, index) => (
              <div key={`${item.exerciseId}-${index}`} className="template-row stack">
                <div className="row between">
                  <h3>
                    {EXERCISES.find((e) => e.id === item.exerciseId)?.name || item.exerciseId}
                  </h3>
                  <div className="row compact-row">
                    <Button
                      variant="quiet"
                      aria-label={`Hareket ${index + 1} yukarı`}
                      disabled={index === 0}
                      onClick={() => reorder(index, -1)}
                    >
                      <ArrowUp size={15} />
                    </Button>
                    <Button
                      variant="quiet"
                      aria-label={`Hareket ${index + 1} aşağı`}
                      disabled={index === settings.templates[template].length - 1}
                      onClick={() => reorder(index, 1)}
                    >
                      <ArrowDown size={15} />
                    </Button>
                    <Button
                      variant="quiet"
                      aria-label={`Hareket ${index + 1} çıkar`}
                      onClick={() =>
                        patch({
                          templates: {
                            ...settings.templates,
                            [template]: settings.templates[template].filter((_, i) => i !== index),
                          },
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
                <ChangeExercise
                  exerciseId={item.exerciseId}
                  onSelect={(exerciseId) => editMovement(index, { exerciseId })}
                />
                <div className="grid2">
                  <label className="field">
                    Set
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={item.sets}
                      onChange={(e) => {
                        if (+e.target.value > 0) editMovement(index, { sets: +e.target.value });
                      }}
                    />
                  </label>
                  <label className="field">
                    Dinlenme (sn)
                    <input
                      type="number"
                      min={15}
                      max={600}
                      step={15}
                      value={item.restSec}
                      onChange={(e) => {
                        if (+e.target.value > 0) editMovement(index, { restSec: +e.target.value });
                      }}
                    />
                  </label>
                  <label className="field">
                    Alt tekrar
                    <input
                      type="number"
                      min={1}
                      max={item.maxReps}
                      value={item.minReps}
                      onChange={(e) => {
                        if (+e.target.value > 0 && +e.target.value <= item.maxReps)
                          editMovement(index, { minReps: +e.target.value });
                      }}
                    />
                  </label>
                  <label className="field">
                    Üst tekrar
                    <input
                      type="number"
                      min={item.minReps}
                      max={100}
                      value={item.maxReps}
                      onChange={(e) => {
                        if (+e.target.value >= item.minReps)
                          editMovement(index, { maxReps: +e.target.value });
                      }}
                    />
                  </label>
                </div>
                <label className="field">
                  Alternatif hareket
                  <select
                    value={item.alternative || ''}
                    onChange={(e) =>
                      editMovement(index, { alternative: e.target.value || undefined })
                    }
                  >
                    <option value="">Seç</option>
                    {EXERCISES.filter((e) => e.id !== item.exerciseId).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
            <Button variant="secondary" onClick={() => setAddExercise(true)}>
              <Plus size={17} />
              Hareket ekle
            </Button>
            <Link className="button quiet" to="/library">
              Hareketleri tanı
            </Link>
          </Card>
          {addExercise && (
            <Sheet title="Şablonuna hareket ekle" onClose={() => setAddExercise(false)}>
              <Library
                onSelect={(exerciseId) => {
                  patch({
                    templates: {
                      ...settings.templates,
                      [template]: [
                        ...settings.templates[template],
                        { exerciseId, sets: 3, minReps: 8, maxReps: 12, restSec: 90 },
                      ],
                    },
                  });
                  setAddExercise(false);
                }}
              />
            </Sheet>
          )}
        </>
      )}
      {tab === 'nutrition' && <MenuEditor />}
      {tab === 'targets' && <Goals />}
      {tab === 'quotes' && (
        <>
          <Card className="stack">
            <h2>Kendi cümlen, kendi sesin.</h2>
            <label className="field">
              Sözün
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                maxLength={300}
                placeholder="Kendine hatırlatmak istediğin bir cümle…"
              />
            </label>
            <label className="field">
              Kategori
              <select value={quoteCategory} onChange={(e) => setQuoteCategory(e.target.value)}>
                {[
                  'genel',
                  'kuvvet',
                  'yüzme',
                  'toparlanma',
                  'dinlenme',
                  'zor gün',
                  'uyku',
                  'beslenme',
                  'kutlama',
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <Button
              disabled={!quoteText.trim()}
              onClick={() => {
                mutate((v) => ({
                  quote: [
                    ...v.quote,
                    { id: newId(), text: quoteText.trim(), category: quoteCategory, custom: true },
                  ],
                }));
                setQuoteText('');
              }}
            >
              Sözümü ekle
            </Button>
          </Card>
          {data.quote
            .filter((q) => q.custom)
            .map((q) => (
              <Card key={q.id}>
                <div className="row between">
                  <p>{q.text}</p>
                  <Button
                    variant="quiet"
                    aria-label="Sözümü sil"
                    onClick={() => mutate((v) => ({ quote: v.quote.filter((x) => x.id !== q.id) }))}
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
                <Chip>{q.category}</Chip>
              </Card>
            ))}
        </>
      )}
      {tab === 'timeline' && (
        <>
          <Card className="stack">
            <h2>İstediğin güne bak.</h2>
            <label className="field">
              Program tarihi
              <input
                type="date"
                value={inspectDate}
                onChange={(e) => {
                  if (e.target.value) setInspectDate(e.target.value);
                }}
              />
            </label>
            <Chip>
              {inspected.week}. hafta · {inspected.phase}
            </Chip>
            <h3>{inspected.title}</h3>
            <p>
              {inspected.time} ·{' '}
              {inspected.deload ? 'Hafif hafta · daha az set' : 'Kendi ritminde devam'}
              {inspected.assessment ? ' · Değerlendirme haftası' : ''}
            </p>
            {inspected.beforeStart && <p className="notice">Başlangıç tarihinden önce.</p>}
            {inspected.ended && (
              <p className="notice">Seçili ufuk tamamlandı. İstersen ufku uzatabilirsin.</p>
            )}
          </Card>
          {PHASES.map((phase, i) => (
            <Card key={phase}>
              <div className="row">
                <span className="avatar">{i + 1}</span>
                <div>
                  <h3>{phase}</h3>
                  <p className="muted small">
                    {i < 6
                      ? `${i * 4 + 1}–${i * 4 + 4}. haftalar`
                      : '25. haftadan itibaren, seçili ufuk boyunca'}
                  </p>
                </div>
              </div>
              <p className="muted small phase-description">
                Üç yüklenme haftası, bir hafif hafta. Her 12 haftada ölçüm, fotoğraf ve teknik
                değerlendirmesi.
              </p>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
function Goals() {
  const { data, mutate } = useStore();
  const [values, setValues] = useState<Targets>(data.targets[0]);
  const [saved, setSaved] = useState(false);
  const [milestonesText, setMilestonesText] = useState(data.targets[0].milestones.join(', '));
  const patch = (value: Partial<Targets>) => {
    setValues({ ...values, ...value });
    setSaved(false);
  };
  return (
    <Card className="stack">
      <h2>Sana uyan hedefler</h2>
      <div className="grid2">
        {(
          [
            { key: 'kcal', label: 'Kalori (kcal)', min: 1 },
            { key: 'protein', label: 'Protein (g)', min: 1 },
            { key: 'carb', label: 'Karbonhidrat (g)', min: 0 },
            { key: 'fat', label: 'Yağ (g)', min: 0 },
            { key: 'water', label: 'Su (bardak)', min: 1 },
            { key: 'steps', label: 'Adım', min: 0 },
            { key: 'goalWeight', label: 'Hedef kilo (kg)', min: 30 },
          ] as const
        ).map((field) => (
          <label className="field" key={field.key}>
            {field.label}
            <input
              type="number"
              min={field.min}
              value={values[field.key] ?? ''}
              onChange={(e) =>
                patch({ [field.key]: e.target.value === '' ? undefined : +e.target.value })
              }
            />
          </label>
        ))}
        <label className="field">
          Yatış saati
          <input
            type="time"
            value={values.bedtime}
            onChange={(e) => patch({ bedtime: e.target.value })}
          />
        </label>
      </div>
      {values.kcal < 1500 && <p className="notice">Bu hedefi hekim/diyetisyeninle netleştir.</p>}
      <label className="field">
        Kilo basamakları (virgülle ayır)
        <input
          value={milestonesText}
          onChange={(e) => {
            setMilestonesText(e.target.value);
            setSaved(false);
          }}
        />
      </label>
      <Button
        disabled={
          !Number.isFinite(values.kcal) ||
          values.kcal <= 0 ||
          !Number.isFinite(values.protein) ||
          values.protein <= 0 ||
          !Number.isFinite(values.water) ||
          values.water <= 0 ||
          !values.bedtime ||
          !Number.isFinite(values.goalWeight) ||
          values.goalWeight < 30 ||
          [values.carb, values.fat, values.steps].some(
            (n) => n !== undefined && (!Number.isFinite(n) || n < 0),
          )
        }
        onClick={() => {
          mutate(() => ({
            targets: [
              {
                ...values,
                milestones: milestonesText
                  .split(',')
                  .map(Number)
                  .filter((n) => Number.isFinite(n) && n > 0),
              },
            ],
          }));
          setSaved(true);
        }}
      >
        {saved ? 'Hedeflerin kaydedildi' : 'Hedefleri kaydet'}
        <Check size={17} />
      </Button>
    </Card>
  );
}
function MenuEditor() {
  const { data, mutate, date, updateDay } = useStore();
  const [day, setDay] = useState(weekday(date));
  const [copyTo, setCopyTo] = useState((day + 1) % 7);
  const [addTo, setAddTo] = useState<(typeof MEALS)[number]['id']>();
  const [query, setQuery] = useState('');
  const menu = data.menuPlan[0];
  const selected = menu.days[day];
  const update = (meal: (typeof MEALS)[number]['id'], items: typeof selected.kahvalti.items) =>
    mutate((v) => ({
      menuPlan: [
        {
          ...menu,
          days: menu.days.map((d, i) => (i === day ? { ...d, [meal]: { ...d[meal], items } } : d)),
        },
      ],
      dayLog: v.dayLog.map((d) =>
        d.date === date ? { ...d, boxes: { ...d.boxes, h: d.boxOverrides?.h ?? true } } : d,
      ),
    }));
  const shopping = new Map<string, number>();
  for (const d of menu.days)
    for (const m of Object.values(d))
      for (const item of m.items)
        shopping.set(item.foodId, (shopping.get(item.foodId) || 0) + item.qty);
  return (
    <div className="stack">
      <Segmented
        label="Menü günü"
        value={String(day)}
        onChange={(value) => setDay(+value)}
        options={weekdays.map((label, i) => ({ value: String(i), label: label.slice(0, 3) }))}
      />
      {MEALS.map((meal) => (
        <Card className="stack" key={meal.id}>
          <div className="row between">
            <h2>{meal.name}</h2>
            <Button
              variant="quiet"
              aria-label={`${meal.name} planına yiyecek ekle`}
              onClick={() => setAddTo(meal.id)}
            >
              <Plus size={18} />
            </Button>
          </div>
          <label className="field">
            Öğün başlığı
            <input
              value={selected[meal.id].title}
              onChange={(e) =>
                mutate(() => ({
                  menuPlan: [
                    {
                      ...menu,
                      days: menu.days.map((d, i) =>
                        i === day
                          ? { ...d, [meal.id]: { ...d[meal.id], title: e.target.value } }
                          : d,
                      ),
                    },
                  ],
                }))
              }
            />
          </label>
          {selected[meal.id].items.map((item, i) => {
            const food = data.food.find((f) => f.id === item.foodId)!;
            return (
              <div className="menu-item" key={i}>
                <div>
                  <strong>{food.name}</strong>
                  <small>
                    {item.state === 'raw' ? 'Çiğ' : item.state === 'cooked' ? 'Pişmiş' : 'Hazır'} ·{' '}
                    {Math.round(calculate(food, item.qty).kcal)} kcal
                  </small>
                </div>
                <input
                  type="number"
                  min={0.25}
                  className="compact-input"
                  aria-label={`${food.name} plan miktarı`}
                  value={item.qty}
                  onChange={(e) => {
                    if (+e.target.value > 0)
                      update(
                        meal.id,
                        selected[meal.id].items.map((v, n) =>
                          n === i ? { ...v, qty: +e.target.value } : v,
                        ),
                      );
                  }}
                />
                <span className="small muted">{food.unit}</span>
                <Button
                  variant="quiet"
                  aria-label={`${food.name} plandan çıkar`}
                  onClick={() =>
                    update(
                      meal.id,
                      selected[meal.id].items.filter((_, n) => n !== i),
                    )
                  }
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            );
          })}
          <p className="muted small">
            {Math.round(
              total(
                selected[meal.id].items.map((i) =>
                  calculate(
                    data.food.find((f) => f.id === i.foodId)!,
                    i.qty,
                  ),
                ),
              ).kcal,
            )}{' '}
            kcal ·{' '}
            {total(
              selected[meal.id].items.map((i) =>
                calculate(
                  data.food.find((f) => f.id === i.foodId)!,
                  i.qty,
                ),
              ),
            ).protein.toFixed(1)}{' '}
            g protein
          </p>
        </Card>
      ))}
      <Card className="stack">
        <label className="field">
          Bu günü kopyalayacağın gün
          <select value={copyTo} onChange={(e) => setCopyTo(+e.target.value)}>
            {weekdays.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          onClick={() =>
            mutate(() => ({
              menuPlan: [
                {
                  ...menu,
                  days: menu.days.map((d, i) => (i === copyTo ? structuredClone(selected) : d)),
                },
              ],
            }))
          }
        >
          Bu günü kopyala
        </Button>
        <Button
          variant="quiet"
          onClick={() => mutate(() => ({ menuPlan: [structuredClone(DEFAULT_MENU)] }))}
        >
          Menüyü varsayılana döndür
        </Button>
      </Card>
      <Card className="stack">
        <h2>Haftanın alışverişi</h2>
        <details>
          <summary>Alışveriş listesini aç · {shopping.size} yiyecek</summary>
          {[...shopping].map(([id, qty]) => {
            const food = data.food.find((f) => f.id === id)!;
            return (
              <label className="check-label" key={id}>
                <input type="checkbox" />
                {food.name} · {Math.round(qty)} {food.unit}
              </label>
            );
          })}
        </details>
        <label className="field">
          Hazırlık günü notun
          <textarea
            defaultValue={data.meta.find((m) => m.key === 'prepNotes')?.value || ''}
            placeholder="Pazar günü kutuları hazırla…"
            onChange={(e) => {
              const value = e.target.value;
              mutate((v) => ({
                meta: [...v.meta.filter((m) => m.key !== 'prepNotes'), { key: 'prepNotes', value }],
              }));
              updateDay({
                boxes: {
                  ...(data.dayLog.find((d) => d.date === date)?.boxes || {
                    h: false,
                    s: false,
                    k: false,
                    u: false,
                  }),
                  h: true,
                },
              });
            }}
          />
        </label>
      </Card>
      {addTo && (
        <Sheet title="Menüne yiyecek ekle" onClose={() => setAddTo(undefined)}>
          <label className="field">
            Menüde yiyecek ara
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {searchFoods(query, data.food)
            .slice(0, 20)
            .map((food) => (
              <Button
                key={food.id}
                variant="secondary"
                onClick={() => {
                  update(addTo, [
                    ...selected[addTo].items,
                    { foodId: food.id, qty: food.portions[0]?.qty || food.per, state: food.state },
                  ]);
                  setAddTo(undefined);
                  setQuery('');
                }}
              >
                {food.name}
                <Chip>
                  {food.state === 'raw' ? 'Çiğ' : food.state === 'cooked' ? 'Pişmiş' : 'Hazır'}
                </Chip>
              </Button>
            ))}
        </Sheet>
      )}
    </div>
  );
}
