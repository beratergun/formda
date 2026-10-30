import { describe, it, expect } from 'vitest';
import { emptyDay } from '../types';
import { addWater, editWater, removeWater, editWaterBase, validWaterLedger, waterMl } from '.';

const legacy = () => ({ ...emptyDay('2026-10-30'), water: 2.5, note: 'Keep this note' });
const entry = { id: 'one', ml: 250, createdAt: 1000 };
describe('water ledger compatibility and arithmetic', () => {
  it('preserves fractional legacy totals and unrelated fields without mutating input', () => {
    const original = legacy();
    const first = addWater(original, entry);
    const second = addWater(first, { id: 'two', ml: 100, createdAt: 2000 });
    expect(waterMl(second)).toBe(975);
    expect(second.waterBaseMl).toBe(625);
    expect(second.note).toBe(original.note);
    expect(original.waterEntries).toBeUndefined();
    expect(first.waterEntries).toHaveLength(1);
    expect(addWater(second, entry)).toBe(second);
    expect(validWaterLedger(second)).toBe(true);
  });
  it('edits only the selected contribution and preserves its timestamp', () => {
    const first = addWater(legacy(), entry);
    const edited = editWater(first, 'one', 125, 3000);
    expect(waterMl(edited)).toBe(750);
    expect(edited.waterEntries).toEqual([{ ...entry, ml: 125 }]);
    expect(edited.updatedAt).toBe(3000);
    expect(first.waterEntries?.[0].ml).toBe(250);
    expect(() => editWater(first, 'missing', 100, 3000)).toThrow();
  });
  it('removes entries idempotently and adjusts the legacy base independently', () => {
    const first = addWater(legacy(), entry);
    const adjusted = editWaterBase(first, 400, 3000);
    expect(waterMl(adjusted)).toBe(650);
    const removed = removeWater(adjusted, 'one', 4000);
    expect(waterMl(removed)).toBe(400);
    expect(removeWater(removed, 'one', 5000)).toBe(removed);
    expect(waterMl(editWaterBase(first, 0, 3000))).toBe(250);
    expect(waterMl(emptyDay('2026-10-29'))).toBe(0);
  });
  it.each([0, -1, 0.5, 5001, NaN, Infinity])('rejects invalid entry amount %s', (ml) => {
    expect(() => addWater(legacy(), { ...entry, ml })).toThrow();
    expect(() => editWater(addWater(legacy(), entry), 'one', ml, 2000)).toThrow();
  });
  it('rejects malformed dates, bases and inconsistent or duplicate ledgers', () => {
    for (const createdAt of [-1, NaN, Infinity, 8640000000000001])
      expect(() => addWater(legacy(), { ...entry, createdAt })).toThrow();
    expect(() => addWater(legacy(), { ...entry, id: '' })).toThrow();
    for (const ml of [-1, NaN, Infinity]) expect(() => editWaterBase(legacy(), ml, 1)).toThrow();
    const valid = addWater(legacy(), entry);
    const malformed = [
      { ...valid, water: 1 },
      { ...valid, waterEntries: [entry, entry] },
      { ...valid, waterBaseMl: undefined },
      { ...valid, waterEntries: undefined },
      { ...valid, waterEntries: [{ ...entry, ml: 0 }] },
      { ...legacy(), water: Infinity },
    ];
    for (const day of malformed) {
      expect(validWaterLedger(day)).toBe(false);
      expect(() => addWater(day, { ...entry, id: 'new' })).toThrow();
    }
  });
});
