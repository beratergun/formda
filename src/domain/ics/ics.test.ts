import { it, expect } from 'vitest';
import { createIcs, foldLine, escapeIcs, validateEvents } from './index';
import { defaultPlan } from '../program';
it('folds UTF-8 at 75 octets without breaking Turkish or emoji code points', () => {
  const line = 'SUMMARY:' + 'Şıİğöçü🙂'.repeat(40);
  const folded = foldLine(line);
  expect(folded.replace(/\r\n /g, '')).toBe(line);
  for (const part of folded.split('\r\n'))
    expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
  expect(escapeIcs('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
});
it('exports stable Istanbul events, alarms and phase details without duplicates', () => {
  const plan = defaultPlan('2026-11-02');
  const text = createIcs(plan, '2026-11-01', '2027-01-24', new Date('2026-10-29T12:00:00Z'));
  expect(text).toContain('TZID:Europe/Istanbul');
  expect(text).toContain('TRIGGER:-PT5M');
  expect(text).toContain('DTSTAMP:20261029T120000Z');
  expect(text).toContain('Hafif hafta');
  expect(text).toContain('Değerlendirme haftası');
  expect(text).toContain('DTSTART;TZID=Europe/Istanbul:20261102T183000');
  expect(text).toContain('DTEND;TZID=Europe/Istanbul:20261102T194500');
  const ids = text.match(/^UID:.*$/gm)!;
  expect(new Set(ids).size).toBe(ids.length);
  expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
  expect(createIcs(plan, '2030-01-01', '2030-01-02')).not.toContain('BEGIN:VEVENT');
});
it('rejects bad ranges and overlapping or duplicate calendar entries', () => {
  const plan = defaultPlan('2026-11-02');
  expect(() => createIcs(plan, '2026-11-02', '2026-11-01')).toThrow();
  expect(() => createIcs(plan, '2026-11-02', '2040-01-01')).toThrow();
  const event = {
    uid: '1',
    date: '2026-11-02',
    time: '18:30',
    minutes: 60,
    title: 'Kuvvet',
    description: '',
  };
  expect(() => validateEvents([event, { ...event, uid: '2', time: '19:00' }])).toThrow('çakışan');
  expect(() => validateEvents([event, event])).toThrow();
  expect(() => validateEvents([{ ...event, date: 'bad' }])).toThrow();
  expect(() => validateEvents([{ ...event, minutes: 0 }])).toThrow();
  expect(validateEvents([event, { ...event, uid: '2', time: '19:30' }])).toHaveLength(2);
});
