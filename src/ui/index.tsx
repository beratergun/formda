import { useEffect, useId, useRef, type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  return <button type="button" className={`button ${variant} ${className}`} {...props} />;
}
export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Chip({ children, tone = '' }: PropsWithChildren<{ tone?: string }>) {
  return <span className={`chip ${tone}`}>{children}</span>;
}
export function Ring({ value, max = 100, label, unit, size = 116 }: { value: number; max?: number; label: string; unit?: string; size?: number }) {
  const progress = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return <div className="metric-ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${Math.round(value)}${unit ? ` ${unit}` : ''}, hedef ${max}`}><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="51" /><circle className="ring-fill" cx="60" cy="60" r="51" pathLength="100" strokeDasharray={`${progress * 100} 100`} /></svg><div><b>{Math.round(value).toLocaleString('tr-TR')}</b><small>{unit || label}</small></div></div>;
}
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: readonly { value: T; label: string }[]; label: string }) {
  return <div className="segmented" role="group" aria-label={label}>{options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}
export function Stepper({ value, onChange, label, min = 0, max = 10000, step = 1, suffix = '' }: { value: number; onChange: (value: number) => void; label: string; min?: number; max?: number; step?: number; suffix?: string }) {
  return <div className="stepper"><Button variant="secondary" aria-label={`${label} azalt`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}><Minus size={18} /></Button><label>{label}<span><input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))} />{suffix}</span></label><Button variant="secondary" aria-label={`${label} artır`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><Plus size={18} /></Button></div>;
}
export function Sheet({ title, children, onClose }: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const startY = useRef<number | null>(null);
  const id = useId();
  useEffect(() => {
    const node = dialog.current!;
    const active = document.activeElement as HTMLElement | null;
    node.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = ''; active?.focus(); };
  }, []);
  return <dialog ref={dialog} className="sheet" aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="sheet-inner"><div className="sheet-handle" onPointerDown={e => { startY.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerUp={e => { if (startY.current !== null && e.clientY - startY.current > 65) onClose(); startY.current = null; }}><i /></div><header className="row between"><h2 id={id}>{title}</h2><Button variant="quiet" aria-label="Kapat" onClick={onClose}><X size={22} /></Button></header><div className="stack sheet-content">{children}</div></div></dialog>;
}
export function EmptyState({ title, children, action }: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return <div className="empty-state"><svg viewBox="0 0 160 100" aria-hidden="true"><path d="M15 83h130M30 75c20-4 23-40 45-34s9 36 32 26 17-27 31-19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><circle cx="42" cy="24" r="9" fill="currentColor" opacity=".15" /><path d="m91 25 9-8 9 8v15H91z" fill="currentColor" opacity=".2" /></svg><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
}
export function Skeleton() { return <div className="skeleton" role="status" aria-label="Yükleniyor" />; }
