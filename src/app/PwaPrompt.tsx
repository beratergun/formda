import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '../ui';
import { isNative } from './native';

export function PwaPrompt() {
  return isNative() ? null : <BrowserPrompt />;
}
function BrowserPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  return (
    needRefresh && (
      <aside className="update-toast" aria-live="polite">
        <p>Yeni sürüm hazır</p>
        <Button onClick={() => void updateServiceWorker(true)}>Güncelle</Button>
        <Button variant="quiet" onClick={() => setNeedRefresh(false)}>
          Daha sonra
        </Button>
      </aside>
    )
  );
}
