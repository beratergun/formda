import { dateDiff, monday, shiftDate } from '../dates';
import type { DayLog, Macros, Targets } from '../types';

export const DEFAULT_WEIGHTS = [48, 16, 10, 14, 6, 6];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function bedtimeMet(actual: string | undefined, target: string) {
  if (!actual) return false;
  const minutes = (s: string) => { const [h, m] = s.split(':').map(Number); return (h < 12 ? h + 24 : h) * 60 + m; };
  return minutes(actual) <= minutes(target);
}
export function score(day: DayLog, macros: Macros, mealCount: number, activityDone: boolean, targets: Targets) {
  const weights = targets.scoreWeights || DEFAULT_WEIGHTS;
  const ratios = [Object.values(day.boxes).filter(Boolean).length / 4, targets.protein > 0 ? clamp(macros.protein / targets.protein) : 0, mealCount >= 3 && Math.abs(macros.kcal - targets.kcal) <= 250 ? 1 : 0, activityDone ? 1 : 0, targets.water > 0 ? clamp(day.water / targets.water) : 0, bedtimeMet(day.sleepAt, targets.bedtime) ? 1 : 0];
  const weightSum = weights.reduce((a, b) => a + Math.max(0, b), 0);
  const parts = ['Kutular', 'Protein', 'Kalori', 'Hareket', 'Su', 'Uyku'].map((label, i) => ({ label, value: weightSum > 0 ? ratios[i] * Math.max(0, weights[i]) * 100 / weightSum : 0, max: weightSum > 0 ? Math.max(0, weights[i]) * 100 / weightSum : 0 }));
  return { total: Math.round(parts.reduce((a, p) => a + p.value, 0)), parts };
}
export const LEVELS = ['Başlangıç', 'Kararlı', 'İstikrarlı', 'Disiplinli', 'Güçlü', 'Demir İrade', 'Usta', 'Efsane'];
export function xpInfo(points: number[]) { const xp = points.reduce((a, b) => a + b, 0); const level = Math.floor(xp / 600); return { xp, level: level + 1, name: LEVELS[Math.min(level, LEVELS.length - 1)], into: xp % 600 }; }
export function streaks(entries: { date: string; score: number; guard?: boolean }[], today: string) {
  const sorted = [...entries].filter(e => e.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const used = new Set<string>(); const eligible = new Set<string>(); let best = 0, run = 0, previous = '';
  for (const entry of sorted) {
    const week = monday(entry.date);
    const valid = entry.score >= 40 || entry.guard && !used.has(week);
    if (entry.score < 40 && valid) used.add(week);
    if (valid) { run = previous && dateDiff(entry.date, previous) === 1 ? run + 1 : 1; eligible.add(entry.date); } else run = 0;
    best = Math.max(best, run); previous = entry.date;
  }
  let current = 0; let cursor = eligible.has(today) ? today : shiftDate(today, -1);
  while (eligible.has(cursor)) { current++; cursor = shiftDate(cursor, -1); }
  return { current, best, guardUsedThisWeek: used.has(monday(today)) };
}
