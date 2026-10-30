import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { Button, Card, NumericInput, Stepper } from './index';

function Form({ save, optional = false }: { save: (value: string) => void; optional?: boolean }) {
  const [value, setValue] = useState('0');
  return (
    <Card>
      <label>
        Kalori
        <NumericInput
          aria-label="Kalori"
          value={value}
          min={0}
          max={20000}
          allowEmpty={optional}
          onValueChange={setValue}
        />
      </label>
      <Button onClick={() => save(value)}>Kaydet</Button>
    </Card>
  );
}
it('replaces focused zero naturally, allows deletion, and saves the exact replacement', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  render(<Form save={save} />);
  const input = screen.getByRole('spinbutton', { name: 'Kalori' });
  await user.click(input);
  await user.keyboard('1500');
  expect(input).toHaveValue('1500');
  await user.clear(input);
  expect(input).toHaveValue('');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(save).not.toHaveBeenCalled();
  await user.type(input, '1500');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(save).toHaveBeenLastCalledWith('1500');
});
it('retains decimal editing text and blocks invalid pasted values from saving', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  render(<Form save={save} />);
  const input = screen.getByRole('spinbutton');
  await user.clear(input);
  await user.type(input, '1,5');
  expect(input).toHaveValue('1,5');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(save).toHaveBeenCalledWith('1.5');
  save.mockClear();
  await user.clear(input);
  await user.paste('1e3');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(save).not.toHaveBeenCalled();
  expect(input).toHaveAttribute('aria-invalid', 'true');
  await user.clear(input);
  await user.paste('20001');
  await user.click(screen.getByRole('button', { name: 'Kaydet' }));
  expect(save).not.toHaveBeenCalled();
});
it('allows optional clearing, rejects fractional integers, and syncs external changes', async () => {
  const onValueChange = vi.fn();
  const props = { value: 8, onValueChange, min: 1, max: 10, precision: 0 };
  const view = render(<NumericInput {...props} aria-label="Tekrar" />);
  const input = screen.getByRole('spinbutton');
  fireEvent.change(input, { target: { value: '8.5' } });
  expect(onValueChange).not.toHaveBeenCalled();
  view.rerender(<NumericInput {...props} value={9} aria-label="Tekrar" />);
  expect(input).toHaveValue('9');
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input).toHaveValue('10');
  expect(onValueChange).toHaveBeenCalledWith('10');
  view.rerender(<NumericInput {...props} value={10} allowEmpty aria-label="Tekrar" />);
  fireEvent.change(input, { target: { value: '' } });
  expect(onValueChange).toHaveBeenLastCalledWith('');
});
it('does not snap an empty portion draft to its minimum', async () => {
  const user = userEvent.setup();
  function Portion() {
    const [qty, setQty] = useState(1);
    return <Stepper label="Miktar" value={qty} onChange={setQty} min={0.25} step={0.25} />;
  }
  render(<Portion />);
  const input = screen.getByRole('spinbutton', { name: 'Miktar' });
  await user.clear(input);
  expect(input).toHaveValue('');
  await user.type(input, '1,5');
  await user.tab();
  expect(input).toHaveValue('1.5');
});

it('preserves calculated portion precision and restores an edit with Escape', async () => {
  const user = userEvent.setup(),
    save = vi.fn();
  const view = render(
    <NumericInput aria-label="Hesaplanan porsiyon" value={1000 / 3} onValueChange={save} />,
  );
  const input = screen.getByRole('spinbutton');
  expect(input).toBeValid();
  await user.click(input);
  await user.tab();
  expect(save).not.toHaveBeenCalled();
  view.unmount();
  render(<Form save={save} />);
  const calories = screen.getByRole('spinbutton', { name: 'Kalori' });
  await user.click(calories);
  await user.keyboard('1500{Escape}');
  expect(calories).toHaveValue('0');
});
