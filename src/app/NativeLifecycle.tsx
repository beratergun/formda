import { useEffect } from 'react';
import { isNative } from './native';

export function NativeLifecycle() {
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void import('@capacitor/app').then(async ({ App }) => {
      const listener = await App.addListener('backButton', () => {
        if (location.hash && location.hash !== '#/' && location.hash !== '#') history.back();
        else void App.exitApp();
      });
      if (cancelled) await listener.remove();
      else stop = () => void listener.remove();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
