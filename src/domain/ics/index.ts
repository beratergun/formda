import { dateDiff, shiftDate } from '../dates';
import { planFor } from '../program';
import type { PlanSettings } from '../types';

export function foldLine(line: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let current = '';
  let length = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (length + bytes > 75) {
      lines.push(current);
      current = ' ';
      length = 1;
    }
    current += char;
    length += bytes;
  }
  lines.push(current);
  return lines.join('\r\n');
}
export function escapeIcs(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}
export interface CalendarEvent {
  uid: string;
  date: string;
  time: string;
  minutes: number;
  title: string;
  description: string;
}
export function validateEvents(events: CalendarEvent[]) {
  const sorted = events
    .map((e) => ({ ...e, start: new Date(`${e.date}T${e.time}:00+03:00`).getTime() }))
    .sort((a, b) => a.start - b.start);
  const ids = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];
    if (ids.has(event.uid) || !Number.isFinite(event.start) || event.minutes <= 0)
      throw new Error('Takvim kaydı geçersiz veya yineleniyor.');
    ids.add(event.uid);
    if (i && sorted[i - 1].start + sorted[i - 1].minutes * 60000 > event.start)
      throw new Error('Takvimde çakışan etkinlikler var.');
  }
  return sorted;
}
export function createIcs(settings: PlanSettings, start: string, end: string, now = new Date()) {
  const days = dateDiff(end, start);
  if (days < 0 || days > 1830) throw new Error('Takvim aralığı en fazla beş yıl olabilir.');
  const events: CalendarEvent[] = [];
  for (let i = 0; i <= days; i++) {
    const date = shiftDate(start, i);
    const plan = planFor(date, settings);
    if (plan.beforeStart || plan.ended) continue;
    events.push({
      uid: `formda-${date}-${plan.type}@local`,
      date,
      time: plan.time,
      minutes:
        plan.type === 'strength' ? 75 : plan.type === 'swim' ? 45 : plan.type === 'rest' ? 10 : 30,
      title: `Formda · ${plan.title}${plan.deload ? ' · Hafif hafta' : ''}`,
      description: `${plan.phase} · ${plan.week}. hafta${plan.assessment ? ' · Değerlendirme haftası' : ''}. ${plan.note}`,
    });
  }
  validateEvents(events);
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
  const format = (value: Date) =>
    `${value.getUTCFullYear()}${String(value.getUTCMonth() + 1).padStart(2, '0')}${String(value.getUTCDate()).padStart(2, '0')}T${String(value.getUTCHours()).padStart(2, '0')}${String(value.getUTCMinutes()).padStart(2, '0')}00`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Formda//Kişisel Plan//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Formda',
    'X-WR-TIMEZONE:Europe/Istanbul',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Istanbul',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'TZNAME:+03',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];
  for (const event of events) {
    const local = new Date(`${event.date}T${event.time}:00Z`);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Istanbul:${format(local)}`,
      `DTEND;TZID=Europe/Istanbul:${format(new Date(local.getTime() + event.minutes * 60000))}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT5M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(event.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
