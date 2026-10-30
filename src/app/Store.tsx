import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type Context,
} from 'react';
import { db } from '../data/db';
import { bootstrapDatabase } from '../data/bootstrap';
import { repository, type AppData } from '../data/repositories';
import { emptyDay, type DayLog, type MealEntry } from '../domain/types';
import { todayKey } from '../domain/dates';
import { Skeleton } from '../ui';

interface Store {
  data: AppData;
  date: string;
  setDate: (date: string) => void;
  status: string;
  error: string;
  setError: (message: string) => void;
  mutate: (change: (data: AppData) => Partial<AppData>) => void;
  flush: () => Promise<void>;
  reload: () => Promise<void>;
  updateDay: (patch: Partial<DayLog>) => void;
  addMeals: (meals: MealEntry[]) => void;
}
const StoreContext: Context<Store | null> =
  import.meta.hot?.data.context || createContext<Store | null>(null);
if (import.meta.hot) import.meta.hot.data.context = StoreContext;
export function StoreProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData | null>(null);
  const current = useRef<AppData | null>(null);
  const [date, setDate] = useState(todayKey);
  const [status, setStatus] = useState('Cihazda kayıtlı');
  const [error, setError] = useState('');
  const pending = useRef<Partial<AppData>>({});
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const chain = useRef(Promise.resolve());
  const reload = useCallback(async () => {
    const value = await repository.load();
    current.current = value;
    setData(value);
  }, []);
  const flush = useCallback(async () => {
    clearTimeout(timeout.current);
    const patch = pending.current;
    if (!Object.keys(patch).length) return chain.current;
    pending.current = {};
    chain.current = chain.current
      .catch(() => {})
      .then(() => repository.replace(patch))
      .then(() => {
        if (!Object.keys(pending.current).length) setStatus('Kaydedildi');
      })
      .catch((e: unknown) => {
        pending.current = { ...patch, ...pending.current };
        setError(e instanceof Error ? e.message : 'Kayıt tamamlanamadı.');
        setStatus('Kayıt bekliyor');
        throw e;
      });
    return chain.current;
  }, []);
  const mutate = useCallback(
    (change: (data: AppData) => Partial<AppData>) => {
      if (!current.current) return;
      const patch = change(current.current);
      if (!Object.keys(patch).length) return;
      current.current = { ...current.current, ...patch };
      setData(current.current);
      pending.current = { ...pending.current, ...patch };
      setStatus('Kaydediliyor');
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => void flush().catch(() => {}), 700);
    },
    [flush],
  );
  useEffect(() => {
    let alive = true;
    void bootstrapDatabase()
      .then(() => {
        if (alive) return reload();
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'Yerel kayıt açılamadı.');
      });
    const hide = () => {
      if (document.visibilityState === 'hidden') void flush().catch(() => {});
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', hide);
      clearTimeout(timeout.current);
      void flush().catch(() => {});
    };
  }, [flush, reload]);
  const updateDay = (patch: Partial<DayLog>) =>
    mutate((value) => {
      const previous = value.dayLog.find((d) => d.date === date) || emptyDay(date);
      const next = { ...previous, ...patch, updatedAt: Date.now() };
      return { dayLog: [...value.dayLog.filter((d) => d.date !== date), next] };
    });
  const addMeals = (entries: MealEntry[]) =>
    mutate((value) => {
      const day = value.dayLog.find((d) => d.date === date) || emptyDay(date);
      return {
        mealEntry: [...value.mealEntry, ...entries],
        dayLog: [
          ...value.dayLog.filter((d) => d.date !== date),
          {
            ...day,
            boxes: { ...day.boxes, k: day.boxOverrides?.k ?? true },
            updatedAt: Date.now(),
          },
        ],
        food: value.food.map((f) => {
          const used = entries.filter((e) => e.foodId === f.id).length;
          return used ? { ...f, lastUsedAt: Date.now(), useCount: f.useCount + used } : f;
        }),
      };
    });
  if (!data)
    return (
      <main className="app-shell stack" style={{ paddingTop: 60 }}>
        {error ? (
          <section className="card stack">
            <h1>Yerel kayıt açılamadı</h1>
            <p>{error}</p>
            <button className="button primary" onClick={() => location.reload()}>
              Yeniden dene
            </button>
          </section>
        ) : (
          <>
            <Skeleton />
            <Skeleton />
          </>
        )}
      </main>
    );
  return (
    <StoreContext.Provider
      value={{
        data,
        date,
        setDate,
        status,
        error,
        setError,
        mutate,
        flush,
        reload,
        updateDay,
        addMeals,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('Store unavailable');
  return store;
}
export function newId() {
  return crypto.randomUUID();
}
export { db };
