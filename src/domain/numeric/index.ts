export interface NumberRules {
  min?: number;
  max?: number;
  precision?: number;
  optional?: boolean;
}
export type NumberResult =
  | { valid: true; value: number | undefined; normalized: string }
  | { valid: false; message: string };

export function parseNumericDraft(raw: string, rules: NumberRules = {}): NumberResult {
  const text = raw.trim();
  if (!text)
    return rules.optional
      ? { valid: true, value: undefined, normalized: '' }
      : { valid: false, message: 'Bir değer gir.' };
  if (!/^-?\d+(?:[.,]\d+)?$/.test(text))
    return {
      valid: false,
      message:
        'Geçerli bir sayı yaz. Ondalık için virgül veya nokta kullan; binlik ayırıcı kullanma.',
    };
  const value = Number(text.replace(',', '.'));
  if (!Number.isFinite(value)) return { valid: false, message: 'Sonlu bir sayı gir.' };
  const precision = rules.precision ?? 2;
  if ((text.split(/[.,]/)[1]?.length || 0) > precision)
    return {
      valid: false,
      message: precision ? `En fazla ${precision} ondalık basamak kullan.` : 'Tam sayı gir.',
    };
  const min = rules.min ?? 0,
    max = rules.max ?? 1000000;
  if (value < min || value > max)
    return {
      valid: false,
      message: `${min.toLocaleString('tr-TR')} ile ${max.toLocaleString('tr-TR')} arasında bir değer gir.`,
    };
  return { valid: true, value, normalized: String(value) };
}

export function parseWeightMilestones(
  raw: string,
): { valid: true; values: number[] } | { valid: false; message: string } {
  if (!raw.trim()) return { valid: true, values: [] };
  const values: number[] = [];
  for (const item of raw.split(';')) {
    const result = parseNumericDraft(item, { min: 30, max: 400, precision: 2 });
    if (!result.valid)
      return {
        valid: false,
        message:
          'Basamakları noktalı virgülle ayır; ör. 90; 85,5. Her değer 30–400 kg arasında olmalı.',
      };
    values.push(result.value!);
  }
  return { valid: true, values };
}
