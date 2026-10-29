import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ring, Stepper } from './index';
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
