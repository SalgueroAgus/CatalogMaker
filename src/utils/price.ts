export function normalizePrice(value: string): string | null {
  const text = value.trim().replace(/^\$\s*/, '');
  if (!value.trim()) return '';
  if (!text) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text)) return null;
  const digits = text.replace(/\./g, '').replace(/^0+(?=\d)/, '');
  return `$ ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function normalizeLegacyPrice(value: string): string {
  const integer = normalizePrice(value);
  if (integer !== null) return integer;
  const text = value.trim().replace(/^\$\s*/, '');
  const match = /^(\d+|\d{1,3}(?:\.\d{3})+),(\d{1,2})$/.exec(text) ?? /^(\d+)\.(\d{1,2})$/.exec(text);
  if (!match) return value;
  const digits = match[1].replace(/\./g, '');
  const number = Number(digits);
  if (!Number.isSafeInteger(number) || number >= Number.MAX_SAFE_INTEGER) return value;
  return normalizePrice(String(number + (Number(match[2].padEnd(2, '0')) >= 50 ? 1 : 0))) ?? value;
}

export const PRICE_ERROR = 'Ingresá pesos enteros, sin centavos (por ejemplo, $ 1.234).';
