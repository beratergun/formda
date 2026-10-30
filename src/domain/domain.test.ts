import { describe, it, expect } from 'vitest';
import { FOODS, DEFAULT_MENU, LEGACY_FOODS } from '../data/seed/foods';
import { calculate, total, recipeFood } from './calories';
import { convertWeight } from './cooking';
import { parseMeal, searchFoods, normalize } from './parser';
import { defaultPlan, planFor } from './program';
import { progression, epley, volume, adjustment } from './progression';
import { score, bedtimeMet, xpInfo, streaks } from './score';
import { average, adaptiveTdee, mifflin } from './tdee';
import { project } from './projection';
import {
  assistantMessages,
  LocalAssistant,
  NoopRecognizer,
  remainingSuggestions,
} from './assistant';
import { selectQuote } from './quotes';
import { dateLabel, dateDiff, todayKey, shiftDate } from './dates';
import { DEFAULT_TARGETS, emptyDay, type Food, type SetLog } from './types';

const food = (id: string) => FOODS.find((f) => f.id === id)!;
describe('nutrition arithmetic', () => {
  it('matches the exact reference eggs and raw chicken', () => {
    expect(calculate(food('egg'), 2)).toMatchObject({ kcal: 144, protein: 12.6 });
    expect(calculate(food('tavuk'), 130)).toMatchObject({ kcal: 156, protein: 29.25 });
    const monday = total(
      Object.values(DEFAULT_MENU.days[0]).flatMap((m) =>
        m.items.map((i) =>
          calculate(
            LEGACY_FOODS.find((f) => f.id === i.foodId)!,
            i.qty,
          ),
        ),
      ),
    );
    expect(monday.kcal).toBe(1458.5);
    expect(Math.round(monday.kcal)).toBe(1459);
    expect(
      Math.round(
        total([
          monday,
          calculate(
            LEGACY_FOODS.find((f) => f.id === 'cay')!,
            4,
          ),
        ]).kcal,
      ),
    ).toBe(1467);
  });
  it('sums unrounded macros and preserves unknown macros', () => {
    const enriched: Food = { ...food('egg'), carbPer: 1.2, fatPer: 5 };
    expect(total([calculate(enriched, 0.1), calculate(enriched, 0.2)]).protein).toBeCloseTo(1.89);
    expect(total([calculate(enriched, 1)])).toMatchObject({ carb: 1.2, fat: 5 });
    expect(
      total([
        calculate(enriched, 1),
        calculate({ ...food('egg'), carbPer: undefined, fatPer: undefined }, 1),
      ]).carb,
    ).toBeUndefined();
    expect(total([]).kcal).toBe(0);
    for (const qty of [-1, NaN, Infinity]) expect(() => calculate(enriched, qty)).toThrow();
    expect(() => calculate({ ...enriched, per: 0 }, 2)).toThrow();
  });
  it('computes a cooked recipe from ingredients without changing totals', () => {
    const recipe = {
      id: 'test',
      name: 'Kase',
      ingredients: [{ foodId: 'egg', qty: 2 }],
      cookedWeightG: 200,
      servings: 2,
    };
    expect(calculate(recipeFood(recipe, FOODS), 100)).toMatchObject({ kcal: 72, protein: 6.3 });
    expect(() => recipeFood({ ...recipe, cookedWeightG: 0 }, FOODS)).toThrow();
    expect(() =>
      recipeFood({ ...recipe, ingredients: [{ foodId: 'missing', qty: 1 }] }, FOODS),
    ).toThrow();
  });
});
describe('Turkish meal parser', () => {
  const examples: [string, string, number][] = [
    ['2 yumurta', 'egg', 2],
    ['iki yumurta', 'egg', 2],
    ['yarım yumurta', 'egg', 0.5],
    ['çeyrek yumurta', 'egg', 0.25],
    ['1,5 yumurta', 'egg', 1.5],
    ['1.5 yumurta', 'egg', 1.5],
    ['bir yumurta', 'egg', 1],
    ['üç yumurta', 'egg', 3],
    ['dört yumurta', 'egg', 4],
    ['beş yumurta', 'egg', 5],
    ['altı yumurta', 'egg', 6],
    ['yedi yumurta', 'egg', 7],
    ['sekiz yumurta', 'egg', 8],
    ['dokuz yumurta', 'egg', 9],
    ['on yumurta', 'egg', 10],
    ['1 dilim ekmek', 'ekmek', 30],
    ['2 dilim tam buğday ekmeği', 'ekmek', 60],
    ['yarım dilim ekmek', 'ekmek', 15],
    ['30 g ekmek', 'ekmek', 30],
    ['30 gr ekmek', 'ekmek', 30],
    ['30 gram ekmek', 'ekmek', 30],
    ['1 kase yoğurt', 'yogurt', 200],
    ['2 kase süzme yoğurt', 'suzme', 300],
    ['1 bardak süt', 'sut', 200],
    ['200 ml süt', 'sut', 200],
    ['1 bardak kefir', 'kefir', 200],
    ['2 bardak ayran', 'ayran', 400],
    ['1 kaşık zeytinyağı', 'yag', 10],
    ['2 porsiyon makarna', 'makarna', 300],
    ['1 kase mercimek çorbası', 'corba', 1],
    ['150 gr pişmiş tavuk', 'tavukpismis', 150],
    ['130 g çiğ tavuk', 'tavuk', 130],
    ['100 gr ÇİĞ TAVUK', 'tavuk', 100],
    ['150 g pismis tavuk', 'tavukpismis', 150],
    ['200 g nohut', 'nohut', 200],
    ['100 g elma', 'elma', 100],
    ['yumurta', 'egg', 1],
    ['ekmek', 'ekmek', 30],
    ['2 adet yumurta', 'egg', 2],
    ['4 çay', 'cay', 4],
    ['4 adet çay', 'cay', 4],
    ['bir kase mercimek corbasi', 'corba', 1],
    ['yarim bardak sut', 'sut', 100],
    ['1,5 bardak kefir', 'kefir', 300],
    ['150 g tavuk göğsü', 'tavuk', 150],
  ];
  it.each(examples)('%s → %s (%s)', (input, id, qty) => {
    const parsed = parseMeal(input, FOODS)[0];
    expect(parsed.food?.id).toBe(id);
    expect(parsed.qty).toBe(qty);
  });
  it('separates lists without splitting decimal commas', () => {
    expect(
      parseMeal('2 yumurta, 1 dilim ekmek; 1,5 bardak süt\n1 kase çorba ve 4 çay', FOODS),
    ).toHaveLength(5);
    expect(
      total(parseMeal('2 yumurta, 1 dilim ekmek', FOODS).map((p) => calculate(p.food!, p.qty))),
    ).toMatchObject({ kcal: 219.6, protein: 16.32 });
  });
  it('keeps unresolved and ambiguous entries for confirmation', () => {
    expect(parseMeal('1 zargana tatlısı', FOODS)[0].issue).toBe('Eşleşmedi, seç');
    expect(parseMeal('1 kase yumurta', FOODS)[0].issue).toContain('gramaj');
    expect(parseMeal('100 ml ekmek', FOODS)[0].issue).toContain('Birim');
    expect(parseMeal('100 g süt', FOODS)[0].issue).toContain('Birim');
    expect(parseMeal('0 yumurta', FOODS)[0].issue).toContain('pozitif');
    expect(parseMeal('-2 yumurta', FOODS)[0].issue).toContain('pozitif');
    expect(parseMeal('150 g tavuk', FOODS)[0].issue).toContain('doğrula');
    expect(parseMeal('  ', FOODS)).toEqual([]);
  });
  it('searches Turkish letters and small typos; ranks personal preferences', () => {
    expect(normalize('IŞIK, ÇİĞ ÖĞÜN')).toBe('isik, cig ogun');
    expect(searchFoods('yumurt', FOODS)[0].id).toBe('egg');
    expect(searchFoods('yumurtta', FOODS)[0].id).toBe('egg');
    expect(
      searchFoods('', [
        { ...food('egg'), favorite: true },
        { ...food('eggw'), lastUsedAt: 2 },
      ])[0].id,
    ).toBe('eggw');
    expect(searchFoods('', [{ ...food('egg'), favorite: true }, food('eggw')])[0].id).toBe('egg');
    expect(searchFoods('', [{ ...food('egg'), useCount: 5 }, food('eggw')])[0].id).toBe('egg');
  });
});
describe('cooking and calendar', () => {
  it('uses configurable yields in both directions', () => {
    expect(convertWeight(150, 'chicken', 'cooked')).toBe(200);
    expect(convertWeight(100, 'rice', 'raw')).toBe(250);
    expect(convertWeight(100, 'pasta', 'raw')).toBeCloseTo(220);
    expect(convertWeight(100, 'lentils', 'raw')).toBe(240);
    for (const [qty, key] of [
      [-1, 'rice'],
      [NaN, 'rice'],
      [1, 'unknown'],
    ] as const)
      expect(() => convertWeight(qty, key, 'raw')).toThrow();
  });
  it('uses Istanbul dates at the UTC boundary', () => {
    expect(todayKey(new Date('2026-10-29T22:00:00Z'))).toBe('2026-10-30');
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
    expect(dateLabel('2026-10-29')).toContain('Perşembe');
    expect(dateLabel('2026-10-29', 'd MMM')).toContain('Eki');
    expect(dateDiff('2026-11-01', '2026-10-29')).toBe(3);
  });
});
describe('deterministic training plan', () => {
  const plan = defaultPlan('2026-11-02');
  it('handles start, deload, assessments, and the fifth year immediately', () => {
    expect(planFor('2026-11-02', plan)).toMatchObject({
      week: 1,
      phase: 'Alışma',
      beforeStart: false,
    });
    expect(planFor('2026-11-23', plan)).toMatchObject({ week: 4, deload: true });
    expect(planFor('2027-01-18', plan)).toMatchObject({ week: 12, assessment: true });
    expect(planFor('2027-11-02', { ...plan, horizon: '5y' }).phase).toBe('Sürdürme döngüsü');
    expect(planFor('2031-10-28', { ...plan, horizon: '5y' }).ended).toBe(false);
    expect(planFor('2032-11-02', { ...plan, horizon: '5y' }).ended).toBe(true);
    expect(planFor('2026-11-01', plan).beforeStart).toBe(true);
  });
  it('respects equipment, overrides, progression and limited horizons', () => {
    const home = defaultPlan('2026-11-02', 3, ['ev']);
    expect(home.weekTemplate.some((d) => d.type === 'swim')).toBe(false);
    const rest = { type: 'rest' as const, title: 'Mola', time: '12:00', note: '' };
    expect(planFor('2026-11-02', plan, { '2026-11-02': rest }).title).toBe('Mola');
    expect(planFor('2026-11-02', { ...plan, overrides: { '2026-11-02': rest } }).title).toBe(
      'Mola',
    );
    expect(planFor('2026-11-02', { ...plan, deloadFrom: '2026-11-02' }).deload).toBe(true);
    expect(planFor('2026-11-02', { ...plan, swimTargetM: 700 }).swimM).toBe(700);
    expect(planFor('2026-11-16', plan).exercises[0].sets).toBe(3);
    expect(planFor('2026-11-23', plan).exercises[0].sets).toBe(2);
    expect(planFor('2040-01-01', { ...plan, horizon: 'forever' }).ended).toBe(false);
  });
});
describe('double progression and volume', () => {
  const sets: SetLog[] = [
    { exerciseId: 'a', setNo: 1, kg: 40, reps: 12, rpe: 8, done: true },
    { exerciseId: 'a', setNo: 2, kg: 40, reps: 12, rpe: 7, done: true },
  ];
  it('only increases weight after all sets qualify', () => {
    expect(progression(sets, 12, 2.5)).toBe('Bugün +2,5 kg dene');
    expect(progression(sets, 12, 2.5, true)).toBe('Bugün aynı kal');
    expect(progression(sets, 12, 2.5, false, true)).toBe('Bugün aynı kal');
    for (const altered of [
      [],
      [{ ...sets[0], rpe: undefined }],
      [{ ...sets[0], rpe: 9 }],
      [{ ...sets[0], reps: 10 }],
      [{ ...sets[0], done: false }],
      [{ ...sets[0], reps: undefined }],
    ])
      expect(progression(altered, 12, 2.5)).toContain('tekrarı artır');
  });
  it('summarizes volume and estimates 1RM without counting unfinished sets', () => {
    expect(volume([...sets, { exerciseId: 'a', setNo: 3, done: false }])).toBe(960);
    expect(volume([{ exerciseId: 'a', setNo: 1, done: true }])).toBe(0);
    expect(epley(40, 10)).toBeCloseTo(53.333);
    expect(epley(40, 1)).toBe(40);
    expect(epley(0, 0)).toBe(0);
    expect(epley(40, 0)).toBe(0);
  });
  it('proposes adjustments for consent', () => {
    expect(adjustment([{ rpe: 9 }, { energy: 1 }, { rpe: 10 }], 0)).toContain('Hafif');
    expect(adjustment([{}, {}, {}], 2)).toContain('3 güne');
    expect(adjustment([], 0)).toBeNull();
  });
});
describe('score, XP and protected streaks', () => {
  it('scores only recorded evidence and caps ratios', () => {
    const day = {
      ...emptyDay('2026-10-29'),
      boxes: { h: true, s: true, k: true, u: true },
      water: 10,
      sleepAt: '23:00',
    };
    expect(score(day, { kcal: 1900, protein: 200 }, 3, true, DEFAULT_TARGETS).total).toBe(100);
    expect(
      score(emptyDay(day.date), { kcal: 1900, protein: 0 }, 2, false, DEFAULT_TARGETS).total,
    ).toBe(0);
    expect(
      score(day, { kcal: 2500, protein: 0 }, 3, false, {
        ...DEFAULT_TARGETS,
        protein: 0,
        water: 0,
        scoreWeights: [0, 0, 0, 0, 0, 0],
      }).total,
    ).toBe(0);
    expect(bedtimeMet('00:15', '23:30')).toBe(false);
    expect(bedtimeMet('23:45', '00:30')).toBe(true);
    expect(bedtimeMet(undefined, '23:30')).toBe(false);
  });
  it('levels each 600 XP and caps the name', () => {
    expect(xpInfo([300, 300])).toMatchObject({ level: 2, into: 0, name: 'Kararlı' });
    expect(xpInfo([10000]).name).toBe('Efsane');
  });
  it('allows one guard per Monday week and yesterday continuity', () => {
    const entries = [
      { date: '2026-10-26', score: 50 },
      { date: '2026-10-27', score: 0, guard: true },
      { date: '2026-10-28', score: 0, guard: true },
      { date: '2026-10-29', score: 50 },
      { date: '2026-10-30', score: 60 },
    ];
    expect(streaks(entries, '2026-10-30')).toEqual({
      current: 2,
      best: 2,
      guardUsedThisWeek: true,
    });
    expect(streaks(entries, '2026-10-31').current).toBe(2);
    expect(streaks(entries, '2026-11-02').current).toBe(0);
    expect(streaks([], '2026-10-29').best).toBe(0);
    expect(streaks([{ date: '2026-10-26', score: 0 }], '2026-10-26').current).toBe(0);
  });
});
describe('energy estimates and projection', () => {
  it('uses Mifflin and waits for adequate intake and weights', () => {
    expect(mifflin(80, 180, 30, 'male', 1)).toBe(1780);
    expect(mifflin(80, 180, 30, 'female', 1)).toBe(1614);
    expect(mifflin(80, 180, 30, 'unspecified')).toBeCloseTo(1697 * 1.45);
    expect(average([])).toBe(0);
    expect(adaptiveTdee(2500, [], [], [], 20)).toEqual({ value: 2500, adaptive: false });
    expect(adaptiveTdee(2500, Array(14).fill(2000), [80], [79], 14).value).toBeCloseTo(2508.333);
    expect(adaptiveTdee(2500, Array(14).fill(2000), [], [79], 14).adaptive).toBe(false);
    expect(adaptiveTdee(2500, Array(14).fill(2000), [80], [], 14).adaptive).toBe(false);
    expect(adaptiveTdee(2500, Array(14).fill(2000), [80], [79], 13).adaptive).toBe(false);
    expect(adaptiveTdee(2500, Array(14).fill(0), [80], [100], 100).value).toBe(1225);
  });
  it('recalculates weekly and stops exactly at goal', () => {
    const input = {
      startDate: '2026-10-29',
      weight: 80,
      goal: 79,
      height: 180,
      age: 30,
      sex: 'male' as const,
      activity: 1.45,
      kcal: 1900,
      weeks: 260,
    };
    const points = project(input);
    expect(points).toHaveLength(261);
    expect(points.at(-1)).toMatchObject({ weight: 79, maintenance: true, label: 'Koruma' });
    expect(Math.min(...points.map((p) => p.weight))).toBe(79);
    expect(
      project({ ...input, goal: 81, kcal: 3500, weeks: 10, adjustment: 20 }).at(-1)?.weight,
    ).toBe(81);
    expect(project({ ...input, goal: 80, weeks: 0 })[0].maintenance).toBe(true);
  });
});
describe('local assistant and quotes', () => {
  const base = {
    day: emptyDay('2026-10-29'),
    macros: { kcal: 1000, protein: 88 },
    targets: DEFAULT_TARGETS,
  };
  it('uses real remaining values and deterministic messages', () => {
    expect(assistantMessages(base)).toEqual([
      'Protein hedefine 22 g kaldı.',
      'Su hedefine 8 bardak kaldı.',
    ]);
    expect(new LocalAssistant().messages(base)).toEqual(assistantMessages(base));
  });
  it('handles completion, safety, gaps and adequate rest', () => {
    expect(
      assistantMessages({
        ...base,
        weeklyLosses: [2, 2],
        recentEnergy: [1, 1, 1],
        gapDays: 2,
        macros: { kcal: 2000, protein: 120 },
      }),
    ).toHaveLength(4);
    expect(
      assistantMessages({
        ...base,
        day: { ...base.day, boxes: { h: true, s: true, k: true, u: true }, water: 8 },
        macros: { kcal: 1900, protein: 110 },
      })[0],
    ).toContain('4/4');
    expect(
      assistantMessages({
        ...base,
        day: { ...base.day, water: 8 },
        macros: { kcal: 1900, protein: 110 },
      })[0],
    ).toContain('Kendi ritminde');
    expect(assistantMessages({ ...base, recentEnergy: [2, 1, 2] })[0]).toContain('Hekim');
  });
  it('suggests only real portions and makes no image recognition claims', async () => {
    expect(remainingSuggestions(FOODS, 500, 30).length).toBe(3);
    expect(remainingSuggestions(FOODS, 0, 30)).toEqual([]);
    expect(remainingSuggestions(FOODS, 500, 0)).toEqual([]);
    expect(
      remainingSuggestions(
        [{ ...food('egg'), favorite: true, useCount: 3, portions: [] }],
        200,
        20,
      )[0].qty,
    ).toBe(1);
    expect(await new NoopRecognizer().recognize()).toEqual([]);
  });
  it('picks a stable category or custom quote and handles no quotes', () => {
    const quotes = [
      { id: '1', text: 'İlerle.', category: 'genel', custom: false },
      { id: '2', text: 'Nefes al.', category: 'uyku', custom: false },
    ];
    expect(selectQuote('2026-10-29', quotes)?.id).toBe('1');
    expect(selectQuote('2026-10-29', quotes, 'unknown', 1)).toBeDefined();
    expect(selectQuote('2026-10-29', [])).toBeUndefined();
    expect(selectQuote('2026-10-29', [{ ...quotes[0], custom: true }], 'unknown')?.id).toBe('1');
  });
});
