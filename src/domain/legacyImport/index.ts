import { z } from 'zod';
import type { AppData } from '../../data/repositories';
import { calculate } from '../calories';
import { normalize } from '../parser';
import { MEALS, emptyDay, type MealEntry, type WorkoutLog, type WorkoutType } from '../types';
import { EXERCISES } from '../../data/seed/exercises';

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const number = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return value !== null && value !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
};
const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
export function importLegacy(input: unknown, base: AppData, now = Date.now()): AppData {
  const root = z.record(z.string(), z.unknown()).parse(input);
  const documents = object(root.documents);
  const days = object(root.gunler || root.logs);
  const settings = object(root.ayarlar);
  for (const [path, doc] of Object.entries({ ...documents, ...root })) {
    if (path.startsWith('gunler/')) days[path.slice(7)] = doc;
    if (path.startsWith('ayarlar/')) settings[path.slice(8)] = doc;
  }
  if (!Object.keys(days).length && !Object.keys(settings).length)
    throw new Error('Prototipteki gunler ve ayarlar belgeleri bulunamadı.');
  const next = structuredClone(base);
  const mealIds = new Set<string>();
  for (const [date, value] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Eski kayıtta geçersiz tarih var.');
    const old = object(value);
    const day = {
      ...emptyDay(date),
      boxes: { h: !!old.h, s: !!old.s, k: !!old.k, u: !!old.u },
      water: number(old.su),
      sleepAt: /^([01]\d|2[0-3]):[0-5]\d$/.test(text(old.uyku)) ? text(old.uyku) : undefined,
      energy: old.enerji ? Math.min(5, number(old.enerji)) : undefined,
      weight: old.kilo ? number(old.kilo) : undefined,
      measurements: old.bel ? { waist: number(old.bel) } : undefined,
      note: text(old.not),
      updatedAt: now,
    };
    next.dayLog = [...next.dayLog.filter((d) => d.date !== date), day];
    next.mealEntry = next.mealEntry.filter((m) => m.date !== date);
    next.workoutLog = next.workoutLog.filter((w) => w.date !== date);
    const meals = object(old.ogunler);
    for (const meal of MEALS) {
      const entries = Array.isArray(meals[meal.id]) ? (meals[meal.id] as unknown[]) : [];
      entries.forEach((entry, index) => {
        const item = object(entry);
        const food = next.food.find((f) => f.id === item.k);
        const qty = number(item.mik ?? item.qty, 1);
        const id = `legacy-meal-${date}-${meal.id}-${index}`;
        if (mealIds.has(id)) throw new Error('Yinelenen öğün.');
        mealIds.add(id);
        const values =
          food && !item.serbest
            ? calculate(food, qty)
            : { kcal: number(item.kcal), protein: number(item.p ?? item.protein) };
        const result: MealEntry = {
          id,
          date,
          mealId: meal.id,
          foodId: food?.id,
          name: text(item.ad, food?.name || 'Aktarılan yiyecek'),
          qty,
          unit: text(item.birim, food?.unit || 'adet'),
          state:
            food?.state ||
            (/cig/.test(normalize(text(item.ad)))
              ? 'raw'
              : /pismis|haslanmis/.test(normalize(text(item.ad)))
                ? 'cooked'
                : 'na'),
          ...values,
          photoIds: [],
          freeText: item.serbest ? text(item.ad) : undefined,
          createdAt: now,
        };
        next.mealEntry.push(result);
      });
    }
    const sport = object(old.spor);
    if (Object.keys(sport).length) {
      const name = text(sport.tur);
      const type: WorkoutType = /yüzme/i.test(name)
        ? 'swim'
        : /dinlenme/i.test(name)
          ? 'rest'
          : /kuvvet/i.test(name)
            ? 'strength'
            : /yürüyüş|kardiyo/i.test(name)
              ? 'cardio'
              : 'recovery';
      const start = new Date(`${date}T12:00:00+03:00`).getTime();
      const workout: WorkoutLog = {
        id: `legacy-workout-${date}`,
        date,
        type,
        startedAt: start,
        endedAt: sport.tamam ? start + number(sport.sure) * 60000 : undefined,
        done: !!sport.tamam,
        rpe: sport.zorluk ? Math.min(10, number(sport.zorluk)) : undefined,
        note: text(sport.not),
        distanceM: sport.mesafe ? number(sport.mesafe) : undefined,
        sets: [],
      };
      for (const [name, value] of Object.entries(object(sport.hareketler))) {
        const movement = object(value);
        const exercise = EXERCISES.find(
          (e) => normalize(e.name) === normalize(name) || e.id === name,
        );
        const count = Math.min(20, number(movement.set ?? movement.sets, 1));
        for (let i = 0; i < count; i++)
          workout.sets.push({
            exerciseId: exercise?.id || normalize(name).replace(/ /g, '-'),
            setNo: i + 1,
            kg: number(movement.kg),
            reps: number(movement.tekrar ?? movement.rep ?? movement.reps),
            rpe: movement.rpe ? Math.min(10, number(movement.rpe)) : undefined,
            done: !!movement.ok,
          });
      }
      next.workoutLog.push(workout);
    }
  }
  const profile = object(settings.profil);
  if (Object.keys(profile).length)
    next.profile = [
      {
        ...next.profile[0],
        name: text(profile.ad ?? profile.name, next.profile[0].name),
        age: profile.yas ? number(profile.yas) : next.profile[0].age,
        heightCm: number(profile.boy, next.profile[0].heightCm),
        startWeight: number(profile.w0 ?? profile.kilo ?? profile.baslangic, next.profile[0].startWeight),
        sex: profile.cins === 'e' ? 'male' : profile.cins === 'k' ? 'female' : next.profile[0].sex,
      },
    ];
  const targets = object(settings.hedef);
  if (Object.keys(targets).length)
    next.targets = [
      {
        ...next.targets[0],
        kcal: number(targets.kcal, next.targets[0].kcal),
        protein: number(targets.p ?? targets.protein, next.targets[0].protein),
        water: number(targets.su, next.targets[0].water),
        bedtime: text(targets.uyku, next.targets[0].bedtime),
        goalWeight: number(targets.kilo, next.targets[0].goalWeight),
      },
    ];
  const quotes = object(settings.sozler);
  if (Array.isArray(quotes.list))
    for (const [q, textValue] of quotes.list.entries())
      if (typeof textValue === 'string')
        next.quote.push({
          id: `legacy-quote-${q}`,
          text: textValue,
          category: 'genel',
          custom: true,
        });
  const plan = object(settings.plan);
  if (Array.isArray(plan.gunler) && plan.gunler.length === 7)
    next.planSettings = [
      {
        ...next.planSettings[0],
        weekTemplate: plan.gunler.map((value, i) => {
          const item = object(value);
          const title = text(
            item.t ?? item.tur ?? item.ad,
            next.planSettings[0].weekTemplate[i].title,
          );
          const type: WorkoutType = /yüzme/i.test(title)
            ? 'swim'
            : /kuvvet/i.test(title)
              ? 'strength'
              : /dinlen/i.test(title)
                ? 'rest'
                : /kardiyo/i.test(title)
                  ? 'cardio'
                  : 'recovery';
          return {
            ...next.planSettings[0].weekTemplate[i],
            type,
            title,
            time: text(item.saat, '18:30').replace('.', ':').slice(0, 5),
            note: text(item.not ?? item.detay),
          };
        }),
      },
    ];
  const menu = object(settings.menu);
  if (Array.isArray(menu.gunler) && menu.gunler.length === 7)
    next.menuPlan = [
      {
        ...next.menuPlan[0],
        days: menu.gunler.map((value, i) => {
          const result = structuredClone(next.menuPlan[0].days[i]);
          for (const meal of MEALS) {
            const item = object(object(value)[meal.id]);
            if (Array.isArray(item.items)) {
              result[meal.id] = {
                title: text(item.t ?? item.title, result[meal.id].title),
                items: item.items.map((raw) => {
                  const pair = Array.isArray(raw) ? raw : [];
                  const food = next.food.find((f) => f.id === pair[0]);
                  if (!food) throw new Error('Eski menüde tanınmayan yiyecek var.');
                  return { foodId: food.id, qty: number(pair[1]), state: food.state };
                }),
              };
            }
          }
          return result;
        }),
      },
    ];
  next.meta = [
    ...next.meta.filter((m) => m.key !== 'onboardingDone'),
    { key: 'onboardingDone', value: 'true' },
  ];
  return next;
}
