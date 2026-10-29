import type { SetLog } from '../types';

export function progression(
  sets: SetLog[],
  upper: number,
  increment: number,
  pain = false,
  poorSleep = false,
) {
  if (pain || poorSleep) return 'Bugün aynı kal';
  if (
    sets.length &&
    sets.every((s) => s.done && (s.reps || 0) >= upper && s.rpe !== undefined && s.rpe <= 8)
  )
    return `Bugün +${increment.toLocaleString('tr-TR')} kg dene`;
  return 'Aynı ağırlıkla tekrarı artır';
}
export function epley(kg: number, reps: number) {
  return kg <= 0 || reps <= 0 ? 0 : reps === 1 ? kg : kg * (1 + reps / 30);
}
export function volume(sets: SetLog[]) {
  return sets.filter((s) => s.done).reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0);
}
export function adjustment(sessions: { rpe?: number; energy?: number }[], missedWeeks: number) {
  if (
    sessions.length >= 3 &&
    sessions.slice(-3).every((s) => (s.rpe || 0) >= 9 || (s.energy ?? 5) <= 2)
  )
    return 'Hafif hafta öne alınsın mı?';
  return missedWeeks >= 2 ? 'Planı haftada 3 güne indirelim mi?' : null;
}
