export const COOKING_FACTORS: Record<string, number> = {
  chicken: 0.75,
  rice: 2.5,
  pasta: 2.2,
  lentils: 2.4,
};
export function convertWeight(qty: number, key: string, from: 'raw' | 'cooked') {
  if (!Number.isFinite(qty) || qty < 0 || !(key in COOKING_FACTORS))
    throw new Error('Dönüşüm için geçerli yiyecek ve miktar seç.');
  return from === 'raw' ? qty * COOKING_FACTORS[key] : qty / COOKING_FACTORS[key];
}
