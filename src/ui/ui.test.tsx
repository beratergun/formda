import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ring, Stepper, Sheet } from './index';
import { it, expect, vi } from 'vitest';

it('announces the actual ring value even when it exceeds the goal', () => {
  render(<Ring value={150} max={100} label="Protein" unit="g" />);
  expect(screen.getByRole('img')).toHaveAccessibleName('Protein: 150 g, hedef 100');
});
it('does not decrement below zero', async () => {
  const change = vi.fn();
  render(<Stepper label="Su" value={0} onChange={change} />);
  expect(screen.getByRole('button', { name: 'Su azalt' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Su artır' }));
  expect(change).toHaveBeenCalledWith(1);
});
it('keeps Escape in the innermost sheet and restores scrolling only after the last sheet closes', () => {
  const proto = HTMLDialogElement.prototype;
  const show = Object.getOwnPropertyDescriptor(proto, 'showModal'),
    close = Object.getOwnPropertyDescriptor(proto, 'close');
  Object.defineProperty(proto, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(proto, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
  const previousOverflow = document.body.style.overflow;
  const outer = vi.fn(),
    inner = vi.fn();
  try {
    const view = render(
      <Sheet title="Dış rehber" onClose={outer}>
        <Sheet title="Büyük görünüm" onClose={inner}>
          Teknik poz
        </Sheet>
      </Sheet>,
    );
    fireEvent(
      screen.getByRole('dialog', { name: 'Büyük görünüm' }),
      new Event('cancel', { bubbles: true, cancelable: true }),
    );
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('hidden');
    view.rerender(
      <Sheet title="Dış rehber" onClose={outer}>
        Ana rehber
      </Sheet>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    view.unmount();
    expect(document.body.style.overflow).toBe(previousOverflow);
  } finally {
    if (show) Object.defineProperty(proto, 'showModal', show);
    else Reflect.deleteProperty(proto, 'showModal');
    if (close) Object.defineProperty(proto, 'close', close);
    else Reflect.deleteProperty(proto, 'close');
  }
});
