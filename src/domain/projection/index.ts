import { shiftDate } from '../dates';
import { mifflin } from '../tdee';

export function project(input: {
  startDate: string;
  weight: number;
  goal: number;
  height: number;
  age: number;
  sex: 'male' | 'female' | 'unspecified';
  activity: number;
  kcal: number;
  weeks: number;
  adjustment?: number;
}) {
  let weight = input.weight;
  const direction = Math.sign(input.goal - input.weight);
  return Array.from({ length: Math.max(0, Math.min(261, input.weeks)) + 1 }, (_, week) => {
    const maintenance = Math.abs(weight - input.goal) < 0.01;
    const point = {
      date: shiftDate(input.startDate, week * 7),
      weight,
      maintenance,
      label: maintenance ? 'Koruma' : 'Tahmin',
    };
    if (!maintenance) {
      const tdee =
        mifflin(weight, input.height, input.age + week / 52, input.sex, input.activity) +
        (input.adjustment || 0);
      const next = Math.max(30, weight + ((input.kcal - tdee) * 7) / 7700);
      weight = direction <= 0 ? Math.max(input.goal, next) : Math.min(input.goal, next);
    }
    return point;
  });
}
