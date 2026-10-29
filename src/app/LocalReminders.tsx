import { useEffect } from 'react';
import { useStore } from './Store';
import { useMedia } from '../features/today/Today';
import { dateDiff, todayKey } from '../domain/dates';
import { planFor } from '../domain/program';

export function LocalReminders() {
  const { data } = useStore();
  const media = useMedia();
  useEffect(() => {
    if (
      !data.profile[0].notifications ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    )
      return;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const today = todayKey();
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date());
      const plan = planFor(today, data.planSettings[0]);
      const toMinutes = (value: string) => {
        const [h, m] = value.split(':').map(Number);
        return h * 60 + m;
      };
      const delta = toMinutes(plan.time) - toMinutes(time);
      const lastPhoto =
        media.filter((m) => m.kind === 'progress').sort((a, b) => b.date.localeCompare(a.date))[0]
          ?.date || data.planSettings[0].startDate;
      let message = '';
      if (delta >= 0 && delta <= 5 && !data.workoutLog.some((w) => w.date === today && w.done))
        message = `${plan.title} için küçük bir hazırlık zamanı.`;
      else if (dateDiff(today, lastPhoto) >= data.profile[0].photoReminderDays)
        message = 'İstersen bugün ilerleme fotoğrafından bir kare sakla.';
      if (!message) return;
      const key = `yol-reminder-${today}-${message}`;
      if (localStorage.getItem(key)) return;
      new Notification('Formda · Kendine bir adım', {
        body: message,
        icon: import.meta.env.BASE_URL + 'icons/icon-192.png',
        tag: key,
      });
      localStorage.setItem(key, '1');
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [data, media]);
  return null;
}
