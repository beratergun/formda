import { useEffect, useState, type PropsWithChildren } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useStore } from './Store';
import { Button } from '../ui';
import { verifyPin } from '../domain/privacy';

export function AppLock({ children }: PropsWithChildren) {
  const { data } = useStore();
  const profile = data.profile[0];
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [until, setUntil] = useState(0);
  useEffect(() => {
    const lock = () => {
      if (document.visibilityState === 'hidden') {
        setUnlocked(false);
        setPin('');
      }
    };
    document.addEventListener('visibilitychange', lock);
    return () => document.removeEventListener('visibilitychange', lock);
  }, []);
  if (!profile.pinHash || unlocked) return children;
  return (
    <main className="app-lock app-shell stack">
      <div className="celebration">
        <LockKeyhole size={40} />
      </div>
      <p className="eyebrow">SANA AİT, SENİN ALANIN</p>
      <h1>Yoluna dön.</h1>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (Date.now() < until) {
            setError('Biraz bekleyip tekrar dene.');
            return;
          }
          setBusy(true);
          void verifyPin(pin, profile.pinSalt || '', profile.pinHash!)
            .then((ok) => {
              if (ok) {
                setUnlocked(true);
                setPin('');
                setAttempts(0);
                setError('');
              } else {
                const next = attempts + 1;
                setAttempts(next);
                if (next % 5 === 0) setUntil(Date.now() + 30000);
                setError('PIN eşleşmedi. Tekrar deneyebilirsin.');
              }
            })
            .finally(() => setBusy(false));
        }}
      >
        <label className="field">
          Dört haneli PIN
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <Button type="submit" disabled={busy || pin.length !== 4}>
          Kilidi aç
        </Button>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
