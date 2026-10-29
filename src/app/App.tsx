import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Camera,
  ChartNoAxesCombined,
  ChevronRight,
  Dumbbell,
  House,
  LockKeyhole,
  Plus,
  Route as RouteIcon,
  Scale,
  SquarePen,
  Sun,
  UserRound,
  Utensils,
  Video,
  X,
} from 'lucide-react';
import { APP_NAME } from './config';
import { Button, Card, EmptyState, Sheet } from '../ui';
import { PwaPrompt } from './PwaPrompt';
import { StoreProvider, useStore } from './Store';
import { Onboarding } from '../features/onboarding/Onboarding';
import { Today } from '../features/today/Today';
const FoodSheet = lazy(() =>
  import('../features/food-sheet/FoodSheet').then((m) => ({ default: m.FoodSheet })),
);
import { QuickEntry } from '../features/today/QuickEntry';
import type { MealId } from '../domain/types';
const Workout = lazy(() =>
  import('../features/workout-mode/Workout').then((m) => ({ default: m.Workout })),
);
const Library = lazy(() =>
  import('../features/workout-mode/Library').then((m) => ({ default: m.Library })),
);
const CameraPage = lazy(() =>
  import('../features/camera/Camera').then((m) => ({ default: m.CameraPage })),
);
const Vlog = lazy(() => import('../features/vlog/Vlog').then((m) => ({ default: m.Vlog })));
const Journal = lazy(() =>
  import('../features/journal/Journal').then((m) => ({ default: m.Journal })),
);
const Progress = lazy(() =>
  import('../features/progress/Progress').then((m) => ({ default: m.Progress })),
);
const Plan = lazy(() => import('../features/plan/Plan').then((m) => ({ default: m.Plan })));
const Profile = lazy(() =>
  import('../features/profile/Profile').then((m) => ({ default: m.Profile })),
);
import { AppLock } from './AppLock';
import { LocalReminders } from './LocalReminders';
import { InstallProvider } from './InstallCard';
import { NativeLifecycle } from './NativeLifecycle';

const tabs = [
  ['/', 'Bugün', House],
  ['/journal', 'Günlük', BookOpen],
  ['/progress', 'İlerleme', ChartNoAxesCombined],
  ['/plan', 'Planım', RouteIcon],
  ['/profile', 'Profil', UserRound],
] as const;
function AppLayout() {
  const { data, status, error, setError } = useStore();
  const [quick, setQuick] = useState(false);
  const [entry, setEntry] = useState<'food' | 'weight' | 'note'>();
  const [meal, setMeal] = useState<MealId>('kahvalti');
  const [theme, setTheme] = useState(() => localStorage.getItem('yol-theme') || 'system');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    localStorage.setItem('yol-theme', theme);
  }, [theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const sync = () => setTheme(localStorage.getItem('yol-theme') || 'system');
    window.addEventListener('yol-theme-change', sync);
    return () => window.removeEventListener('yol-theme-change', sync);
  }, []);
  useEffect(() => {
    const show = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener('yol-export-error', show);
    return () => window.removeEventListener('yol-export-error', show);
  }, [setError]);
  const onFood = (meal: MealId = 'kahvalti') => {
    setMeal(meal);
    setEntry('food');
  };
  const onboarded = data.meta.some((m) => m.key === 'onboardingDone' && m.value === 'true');
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        İçeriğe geç
      </a>
      <div className="app-shell">
        {onboarded ? (
          <>
            <header className="topbar">
              <NavLink to="/" className="brand" aria-label={`${APP_NAME} ana sayfa`}>
                <span className="brand-mark">
                  <RouteIcon size={21} />
                </span>
                {APP_NAME}
                <span className="brand-dot">/</span>
              </NavLink>
              <div className="row">
                <span className="local-status" role="status">
                  <i />
                  {status}
                </span>
                <Button
                  variant="quiet"
                  aria-label="Temayı değiştir"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun size={20} />
                </Button>
              </div>
            </header>
            <main id="main" tabIndex={-1}>
              <Suspense
                fallback={
                  <div className="card" role="status">
                    Yolun hazırlanıyor…
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Today onFood={onFood} />} />
                  <Route path="/workout" element={<Workout />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/camera" element={<CameraPage />} />
                  <Route path="/vlog" element={<Vlog />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/plan" element={<Plan />} />
                  <Route path="/profile" element={<Profile />} />
                  {tabs.slice(5).map(([path, title]) => (
                    <Route
                      key={path}
                      path={path}
                      element={
                        <>
                          <p className="eyebrow">SENİN YOLUN</p>
                          <h1>{title}</h1>
                          <Card>
                            <EmptyState title={`${title} için yeni bir sayfa`}>
                              Bugün kendine ayırdığın her an kıymetli.
                            </EmptyState>
                          </Card>
                        </>
                      }
                    />
                  ))}
                  <Route
                    path="*"
                    element={
                      <Card>
                        <EmptyState
                          title="Yoluna buradan devam et"
                          action={
                            <NavLink className="button primary" to="/">
                              Bugün'e dön
                            </NavLink>
                          }
                        />
                      </Card>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <p className="footer-note">
              <LockKeyhole size={12} />
              Sana ait. Cihazında kalır.
            </p>
          </>
        ) : (
          <main id="main" tabIndex={-1}>
            <Onboarding />
          </main>
        )}
      </div>
      {onboarded && (
        <nav className="bottom-nav" aria-label="Ana gezinme">
          {tabs.map(([path, title, Icon]) => (
            <NavLink key={path} to={path} end>
              <Icon size={21} strokeWidth={1.8} />
              <span>{title}</span>
            </NavLink>
          ))}
          <button className="quick-add" onClick={() => setQuick(true)} aria-label="Hızlı ekle">
            <Plus size={27} />
          </button>
        </nav>
      )}
      {quick && (
        <Sheet title="Kendin için bir adım" onClose={() => setQuick(false)}>
          {(
            [
              ['Öğün', Utensils, 'food'],
              ['Antrenman', Dumbbell, '/workout'],
              ['Fotoğraf', Camera, '/camera'],
              ['Vlog', Video, '/vlog'],
              ['Tartı', Scale, 'weight'],
              ['Not', SquarePen, 'note'],
            ] as const
          ).map(([label, Icon, target]) => (
            <Button
              key={label}
              variant="secondary"
              onClick={() => {
                setQuick(false);
                if (target === 'food') onFood();
                else if (target === 'weight' || target === 'note') setEntry(target);
                else navigate(target);
              }}
            >
              <span className="row">
                <Icon size={18} />
                {label}
              </span>
              <ChevronRight size={18} />
            </Button>
          ))}
        </Sheet>
      )}
      {entry === 'food' && (
        <Suspense fallback={<p role="status">Hazırlanıyor…</p>}>
          <FoodSheet initialMeal={meal} onClose={() => setEntry(undefined)} />
        </Suspense>
      )}{' '}
      {(entry === 'weight' || entry === 'note') && (
        <QuickEntry kind={entry} onClose={() => setEntry(undefined)} />
      )}{' '}
      {error && (
        <aside className="error-toast" role="alert">
          <p>{error}</p>
          <Button variant="quiet" aria-label="Hata mesajını kapat" onClick={() => setError('')}>
            <X size={18} />
          </Button>
        </aside>
      )}
      <PwaPrompt />
      <LocalReminders />
      <NativeLifecycle />
    </>
  );
}
export function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <InstallProvider>
          <AppLock>
            <AppLayout />
          </AppLock>
        </InstallProvider>
      </StoreProvider>
    </HashRouter>
  );
}
