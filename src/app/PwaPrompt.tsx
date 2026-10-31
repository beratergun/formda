import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState } from 'react';
import { Button } from '../ui';
import { isNative } from './native';
import { useStore } from './Store';

export function PwaPrompt() {
  return isNative() ? null : <BrowserPrompt />;
}
function BrowserPrompt() {
  const { flush, setError } = useStore();
  const [busy, setBusy] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  return (
    needRefresh && (
      <aside className="update-toast" aria-live="polite">
        <p>Yeni sürüm hazır</p>
        <Button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void flush()
              .then(() => updateServiceWorker(true))
              .catch((e) => setError(e instanceof Error ? e.message : 'Güncelleme tamamlanamadı.'))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? 'Kayıtlar tamamlanıyor…' : 'Güncelle'}
        </Button>
        <Button variant="quiet" onClick={() => setNeedRefresh(false)}>
          Daha sonra
        </Button>
      </aside>
    )
  );
}
