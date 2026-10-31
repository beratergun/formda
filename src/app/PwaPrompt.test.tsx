import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useStore } from './Store';
import { PwaPrompt } from './PwaPrompt';

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: vi.fn() }));
vi.mock('./Store', () => ({ useStore: vi.fn() }));
vi.mock('./native', () => ({ isNative: () => false }));

function setup(flush: () => Promise<void>) {
  const update = vi.fn().mockResolvedValue(undefined),
    setError = vi.fn();
  vi.mocked(useStore).mockReturnValue({ flush, setError } as unknown as ReturnType<
    typeof useStore
  >);
  vi.mocked(useRegisterSW).mockReturnValue({
    needRefresh: [true, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: update,
  });
  render(<PwaPrompt />);
  return { update, setError };
}
it('waits for pending local writes before requesting an update and reload', async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const { update } = setup(() => pending);
  fireEvent.click(screen.getByRole('button', { name: 'Güncelle' }));
  expect(update).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Kayıtlar tamamlanıyor…' })).toBeDisabled();
  await act(async () => finish());
  await waitFor(() => expect(update).toHaveBeenCalledWith(true));
});
it('keeps the update available and never reloads when a local write fails', async () => {
  const { update, setError } = setup(() => Promise.reject(new Error('Storage full')));
  fireEvent.click(screen.getByRole('button', { name: 'Güncelle' }));
  await waitFor(() => expect(setError).toHaveBeenCalledWith('Storage full'));
  expect(update).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Güncelle' })).toBeEnabled());
});
