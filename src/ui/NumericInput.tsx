import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react';
import { parseNumericDraft } from '../domain/numeric';

type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step'
> & {
  value: number | string | undefined;
  'aria-label': string;
  onValueChange: (normalized: string) => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  precision?: number;
  allowEmpty?: boolean;
};

export function NumericInput({
  value,
  onValueChange,
  min = 0,
  max = 1000000,
  step,
  precision,
  allowEmpty = false,
  onFocus,
  onBlur,
  className = '',
  ...props
}: NumericInputProps) {
  const external = String(value ?? '');
  const [draft, setDraft] = useState(external);
  const [showError, setShowError] = useState(false);
  const lastCommitted = useRef(external);
  const focusValue = useRef(external);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  // Preserve precision already present in imported or calculated values.
  const decimals = precision ?? Math.max(2, external.split('.')[1]?.length || 0);
  const result = parseNumericDraft(draft, { min, max, precision: decimals, optional: allowEmpty });
  useEffect(() => {
    if (external !== lastCommitted.current) {
      lastCommitted.current = external;
      setDraft(external);
      setShowError(false);
    }
  }, [external]);
  const validationMessage = result.valid ? '' : result.message;
  useEffect(() => {
    input.current?.setCustomValidity(validationMessage);
  }, [validationMessage]);
  const commit = (text: string) => {
    const parsed = parseNumericDraft(text, { min, max, precision: decimals, optional: allowEmpty });
    if (parsed.valid) {
      if (lastCommitted.current === parsed.normalized) return parsed;
      lastCommitted.current = parsed.normalized;
      onValueChange(parsed.normalized);
    }
    return parsed;
  };
  return (
    <span className={`numeric-control ${className}`}>
      <input
        {...props}
        ref={input}
        type="text"
        role="spinbutton"
        inputMode={decimals ? 'decimal' : 'numeric'}
        value={draft}
        required={!allowEmpty}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={result.valid ? result.value : undefined}
        aria-invalid={(showError && !result.valid) || undefined}
        aria-describedby={
          [props['aria-describedby'], showError && !result.valid ? errorId : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
        onFocus={(e) => {
          focusValue.current = external;
          if (e.currentTarget.value === '0') e.currentTarget.select();
          onFocus?.(e);
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          commit(raw);
        }}
        onInvalid={() => setShowError(true)}
        onBlur={(e) => {
          const parsed = commit(draft);
          setShowError(true);
          if (parsed.valid) setDraft(parsed.normalized);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(focusValue.current);
            commit(focusValue.current);
            setShowError(false);
            e.stopPropagation();
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const current = result.valid ? (result.value ?? min) : Number(external) || min;
            const next = Math.max(
              min,
              Math.min(
                max,
                current + (e.key === 'ArrowUp' ? 1 : -1) * (typeof step === 'number' ? step : 1),
              ),
            );
            const text = String(Number(next.toFixed(decimals)));
            setDraft(text);
            commit(text);
          }
          props.onKeyDown?.(e);
        }}
      />
      {showError && !result.valid && (
        <small id={errorId} className="field-error" role="alert">
          {result.message}
        </small>
      )}
    </span>
  );
}
