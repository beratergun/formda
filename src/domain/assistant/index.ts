import type { DayLog, Food, Macros, Targets } from '../types';
import { calculate } from '../calories';
import { average } from '../tdee';
import { dateDiff } from '../dates';
import { bedtimeMet, scoreHistory, streaks } from '../score';
import type { AppData } from '../../data/repositories';

export interface AssistantInput {
  day: DayLog;
  macros: Macros;
  targets: Targets;
  gapDays?: number;
  weeklyLosses?: number[];
  recentEnergy?: number[];
  insights?: string[];
}
export interface AssistantProvider {
  messages(input: AssistantInput): string[];
}
export function assistantMessages({
  day,
  macros,
  targets,
  gapDays = 0,
  weeklyLosses = [],
  recentEnergy = [],
  insights = [],
}: AssistantInput) {
  const result: string[] = [];
  if (
    (weeklyLosses.slice(-2).length === 2 && weeklyLosses.slice(-2).every((x) => x > 1.5)) ||
    (recentEnergy.length >= 3 && average(recentEnergy.slice(-3)) <= 2)
  )
    result.push('Hekim/diyetisyeninle konuşmak iyi olur.');
  if (gapDays >= 2) result.push('Kaldığın yerden devam: bugün tek öğün yazmak yeter.');
  if (macros.kcal > targets.kcal) result.push('Sorun değil, yarın plana dön; açlıkla telafi etme.');
  const boxes = Object.values(day.boxes).filter(Boolean).length;
  if (boxes === 4 && macros.protein >= targets.protein)
    result.push('Bugün çok iyi gittin: 4/4 kutu ve protein hedefi tamam.');
  else if (macros.protein < targets.protein)
    result.push(`Protein hedefine ${Math.ceil(targets.protein - macros.protein)} g kaldı.`);
  if (day.water < targets.water)
    result.push(`Su hedefine ${targets.water - day.water} bardak kaldı.`);
  result.push(...insights);
  if (!result.length) result.push('Kendi ritminde devam et. Bugünkü emeğin kıymetli.');
  return result.slice(0, 4);
}
export class LocalAssistant implements AssistantProvider {
  messages(input: AssistantInput) {
    return assistantMessages(input);
  }
}
export function remainingSuggestions(foods: Food[], kcal: number, protein: number) {
  if (kcal <= 0 || protein <= 0) return [];
  const candidates = foods
    .filter((f) => f.proteinPer > 0 && f.state !== 'raw')
    .sort(
      (a, b) =>
        Number(b.favorite || false) - Number(a.favorite || false) || b.useCount - a.useCount,
    )
    .slice(0, 16)
    .map((food) => ({ food, qty: food.portions[0]?.qty || food.per }));
  const combinations = candidates.map((item) => [item]);
  for (let i = 0; i < candidates.length; i++)
    for (let j = i + 1; j < candidates.length; j++)
      combinations.push([candidates[i], candidates[j]]);
  return combinations
    .map((items) => {
      const macros = items.reduce(
        (sum, item) => {
          const value = calculate(item.food, item.qty);
          return { kcal: sum.kcal + value.kcal, protein: sum.protein + value.protein };
        },
        { kcal: 0, protein: 0 },
      );
      const favorite = items.filter((i) => i.food.favorite).length;
      return {
        food: items[0].food,
        qty: items[0].qty,
        items,
        ...macros,
        fit:
          Math.abs(kcal - macros.kcal) / kcal +
          Math.abs(protein - macros.protein) / protein -
          favorite * 0.15,
      };
    })
    .filter((x) => x.kcal <= kcal + 25)
    .sort((a, b) => a.fit - b.fit)
    .slice(0, 3);
}
export function assistantContext(data: AppData, date: string, names: Record<string, string> = {}) {
  const logs = data.dayLog
    .filter((d) => d.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const weights = logs.filter((d) => d.weight !== undefined);
  const insights: string[] = [];
  const weekly = [2, 1, 0].map((week) =>
    weights
      .filter((d) => dateDiff(date, d.date) >= week * 7 && dateDiff(date, d.date) < (week + 1) * 7)
      .map((d) => d.weight!),
  );
  const weeklyLosses = weekly.every((w) => w.length)
    ? [average(weekly[0]) - average(weekly[1]), average(weekly[1]) - average(weekly[2])]
    : [];
  const earlier = weights
    .filter((d) => dateDiff(date, d.date) >= 21 && dateDiff(date, d.date) < 28)
    .map((d) => d.weight!);
  const latest = weights.filter((d) => dateDiff(date, d.date) < 7).map((d) => d.weight!);
  if (earlier.length && latest.length) {
    const delta = average(earlier) - average(latest);
    insights.push(
      `Son 3 haftada 7 günlük kilo ortalaman ${Math.abs(delta).toLocaleString('tr', { maximumFractionDigits: 1 })} kg ${delta >= 0 ? 'düştü' : 'arttı'}.`,
    );
  }
  const workouts = data.workoutLog
    .filter((w) => w.done && w.date <= date && dateDiff(date, w.date) < 30)
    .sort((a, b) => a.startedAt - b.startedAt);
  const movementIds = [
    ...new Set(workouts.flatMap((w) => w.sets.filter((s) => s.done).map((s) => s.exerciseId))),
  ];
  for (const id of movementIds) {
    const history = workouts.filter((w) => w.sets.some((s) => s.done && s.exerciseId === id));
    if (history.length < 2) continue;
    const first = Math.max(
      ...history[0].sets.filter((s) => s.exerciseId === id && s.done).map((s) => s.kg || 0),
    );
    const last = Math.max(
      ...history
        .at(-1)!
        .sets.filter((s) => s.exerciseId === id && s.done)
        .map((s) => s.kg || 0),
    );
    if (last > first) {
      insights.push(
        `Bu ay ${names[id] || id.replace(/-/g, ' ')} hareketinde +${(last - first).toLocaleString('tr')} kg.`,
      );
      break;
    }
  }
  const sleep = logs.filter((d) => d.sleepAt).slice(-5);
  if (sleep.length)
    insights.push(
      `Yatışın ${data.targets[0].bedtime} hedefine ${sleep.length} gecenin ${sleep.filter((d) => bedtimeMet(d.sleepAt, data.targets[0].bedtime)).length}'ünde uydu.`,
    );
  const streak = streaks(
    scoreHistory(logs, data.mealEntry, data.workoutLog, data.targets[0]),
    date,
  );
  if ([7, 30, 100, 365].includes(streak.current))
    insights.unshift(`${streak.current} günlük serin kutlu olsun. Bu emek sana ait.`);
  if (weights.length >= 2) {
    const last = weights.at(-1)!.weight!,
      before = weights.at(-2)!.weight!;
    const crossed = data.targets[0].milestones.find((m) => before > m && last <= m);
    if (crossed)
      insights.unshift(`${crossed} kg basamağını kaydettin. Kendi yolunda bir zaman işareti.`);
  }
  return {
    weeklyLosses,
    insights,
    recentEnergy: logs
      .filter((d) => d.energy !== undefined)
      .slice(-3)
      .map((d) => d.energy!),
    gapDays: logs.length ? dateDiff(date, logs.at(-1)!.date) : 0,
  };
}
export interface FoodRecognizer {
  recognize(image: Blob): Promise<never[]>;
}
export class NoopRecognizer implements FoodRecognizer {
  async recognize() {
    return [];
  }
}
