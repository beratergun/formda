import { it, expect } from 'vitest';
import { parseNumericDraft, parseWeightMilestones } from './index';

it.each([
  ['0', 0],
  ['1500', 1500],
  ['0012', 12],
  [' 12 ', 12],
  ['1,5', 1.5],
  ['1.50', 1.5],
])('parses explicit decimal draft %s without thousands guessing', (raw, expected) => {
  expect(parseNumericDraft(raw)).toEqual({
    valid: true,
    value: expected,
    normalized: String(expected),
  });
});
it.each([
  '',
  '-',
  '1,',
  '1.',
  '1e3',
  'Infinity',
  'NaN',
  'null',
  'undefined',
  'abc',
  '1,000.50',
  '1.000,50',
  '1 500',
  '-2',
  '1000001',
  '1.234',
  '9'.repeat(400),
])('rejects invalid draft %s without coercion', (raw) => {
  expect(parseNumericDraft(raw).valid).toBe(false);
});
it('distinguishes optional absence from valid zero and respects field-specific rules', () => {
  expect(parseNumericDraft('', { optional: true })).toEqual({
    valid: true,
    value: undefined,
    normalized: '',
  });
  expect(parseNumericDraft('0', { min: 0.25 }).valid).toBe(false);
  expect(parseNumericDraft('0', { optional: true }).valid).toBe(true);
  expect(parseNumericDraft('8.5', { min: 1, max: 10, precision: 1 }).valid).toBe(true);
  expect(parseNumericDraft('8.5', { precision: 0 }).valid).toBe(false);
  expect(parseNumericDraft('-5', { min: -10, max: 10 }).valid).toBe(true);
  expect(parseNumericDraft('401', { max: 400 }).valid).toBe(false);
});

it('parses weight milestone lists without truncating Turkish decimal weights', () => {
  expect(parseWeightMilestones('90; 85,5; 80.25')).toEqual({
    valid: true,
    values: [90, 85.5, 80.25],
  });
  expect(parseWeightMilestones('')).toEqual({ valid: true, values: [] });
  expect(parseWeightMilestones('100,90,85').valid).toBe(false);
  expect(parseWeightMilestones('90;;80').valid).toBe(false);
  expect(parseWeightMilestones('90; 5').valid).toBe(false);
});
