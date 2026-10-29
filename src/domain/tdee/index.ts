export function mifflin(weight: number, height: number, age: number, sex: 'male' | 'female' | 'unspecified', activity = 1.45) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.max(0, base + (sex === 'male' ? 5 : sex === 'female' ? -161 : -78)) * activity;
}
export function average(values: number[]) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; }
export function adaptiveTdee(initial: number, intakes: number[], firstWeights: number[], lastWeights: number[], days: number) {
  if (days < 14 || intakes.length < 14 || !firstWeights.length || !lastWeights.length) return { value: initial, adaptive: false };
  const estimate = average(intakes) - (average(lastWeights) - average(firstWeights)) * 7700 / days;
  const confidence = Math.min(0.75, days / 84);
  return { value: initial * (1 - confidence) + Math.max(800, Math.min(6000, estimate)) * confidence, adaptive: true };
}
