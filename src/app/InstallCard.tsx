import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Download,
  Ellipsis,
  Plus,
  Smartphone,
  X,
} from 'lucide-react';
import { Button, Card, Chip, Sheet } from '../ui';
import { isNative } from './native';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
const InstallContext = createContext<{
  event?: InstallEvent;
  installed: boolean;
  clear: () => void;
}>({ installed: false, clear: () => {} });
export function InstallProvider({ children }: PropsWithChildren) {
  const [event, setEvent] = useState<InstallEvent>();
  const [installed, setInstalled] = useState(
    () =>
      isNative() ||
      matchMedia('(display-mode: standalone)').matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone,
  );
  useEffect(() => {
    const prompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setEvent(undefined);
    };
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', prompt);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  return (
    <InstallContext.Provider value={{ event, installed, clear: () => setEvent(undefined) }}>
      {children}
    </InstallContext.Provider>
  );
}
export function InstallCard({ force = false }: { force?: boolean }) {
  const { event, installed, clear } = useContext(InstallContext);
  const [dismissed, setDismissed] = useState(
    () => Date.now() - Number(localStorage.getItem('yol-install-dismissed') || 0) < 7 * 86400000,
  );
  const [guide, setGuide] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android'>(() =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      ? 'ios'
      : 'android',
  );
  if (installed || (dismissed && !force)) return null;
  const install = async () => {
    if (event) {
      try {
        await event.prompt();
        const choice = await event.userChoice;
        if (choice.outcome === 'accepted') setDismissed(true);
      } catch {
        setGuide(true);
      } finally {
        clear();
      }
    } else setGuide(true);
  };
  return (
    <>
      <Card className="install-card stack">
        <div className="row between">
          <span className="install-icon">
            <Smartphone size={26} />
          </span>
          {!force && (
            <Button
              variant="quiet"
              aria-label="Yükleme kartını kapat"
              onClick={() => {
                localStorage.setItem('yol-install-dismissed', String(Date.now()));
                setDismissed(true);
              }}
            >
              <X size={16} />
            </Button>
          )}
        </div>
        <div>
          <p className="eyebrow">HEP BİR DOKUNUŞ UZAĞINDA</p>
          <h2>berXfit, cebinde olsun.</h2>
          <p className="muted small">
            Ana ekranından aç. Çevrimdışı kaydet. Kendi ritminde devam et.
          </p>
        </div>
        <Button onClick={() => void install()}>
          <Download size={17} />
          Uygulamayı yükle
        </Button>
        <p className="install-footnote">Ücretsiz · Hesap yok · Verilerin cihazında</p>
      </Card>
      {guide && (
        <Sheet title="berXfit'i telefonuna yükle" onClose={() => setGuide(false)}>
          <div className="choice-grid">
            <button
              className="choice"
              aria-pressed={platform === 'ios'}
              onClick={() => setPlatform('ios')}
            >
              iPhone
            </button>
            <button
              className="choice"
              aria-pressed={platform === 'android'}
              onClick={() => setPlatform('android')}
            >
              Android
            </button>
          </div>
          {platform === 'ios' ? (
            <>
              <div className="install-guide-art" role="img" aria-label="iPhone yükleme rehberi">
                <div className="guide-phone">
                  <span className="guide-island" />
                  <img
                    src={import.meta.env.BASE_URL + 'icons/icon-192.png'}
                    alt="berXfit uygulama simgesi"
                  />
                  <b>berXfit</b>
                  <div className="guide-browser">
                    <span>berXfit</span>
                    <ArrowUpFromLine size={22} />
                  </div>
                </div>
                <div className="guide-steps">
                  <p>
                    <Chip>1</Chip>
                    <ArrowUpFromLine size={20} />
                    Paylaş
                  </p>
                  <p>
                    <Chip>2</Chip>
                    <Plus size={20} />
                    Ana Ekrana Ekle
                  </p>
                  <p>
                    <Chip>3</Chip>
                    <Check size={20} />
                    Uygulama Olarak Aç
                  </p>
                </div>
              </div>
              <ol className="instruction-list">
                <li>Safari'de Paylaş düğmesine dokun. Gerekirse önce sayfa menüsünü aç.</li>
                <li>Ana Ekrana Ekle'yi seç.</li>
                <li>Varsa Uygulama Olarak Aç seçeneğini açık tut ve Ekle'ye dokun.</li>
              </ol>
            </>
          ) : (
            <>
              <div className="android-install-art">
                <Smartphone size={50} />
                <ArrowDownToLine size={28} />
                <img src={import.meta.env.BASE_URL + 'icons/icon-192.png'} alt="berXfit simgesi" />
              </div>
              <ol className="instruction-list">
                <li>Chrome'da bu uygulamayı aç.</li>
                <li>
                  Tarayıcı menüsünden <Ellipsis size={18} /> Uygulamayı yükle veya Ana ekrana
                  ekle'yi seç.
                </li>
                <li>Yükle'ye dokun. berXfit'i ana ekranındaki simgeden aç.</li>
              </ol>
              {event && <Button onClick={() => void install()}>Şimdi yükle</Button>}
            </>
          )}
          <Button variant="secondary" onClick={() => setGuide(false)}>
            Hazırım
          </Button>
        </Sheet>
      )}
    </>
  );
}
