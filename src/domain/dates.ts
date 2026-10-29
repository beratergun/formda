import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export function todayKey(now = new Date()) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function shiftDate(date: string, days: number) { return format(addDays(parseISO(date), days), 'yyyy-MM-dd'); }
export function dateDiff(a: string, b: string) { return differenceInCalendarDays(parseISO(a), parseISO(b)); }
export function weekday(date: string) { return (parseISO(date).getDay() + 6) % 7; }
export function dateLabel(date: string, pattern = 'd MMMM EEEE') { return format(parseISO(date), pattern, { locale: tr }); }
export function monday(date: string) { return shiftDate(date, -weekday(date)); }
