import { useEffect, useState } from 'react';
import { normalizePrice, PRICE_ERROR } from '../utils/price';

export function usePriceField(value: string, save: (value: string) => unknown) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setDraft(value); setError(null); }, [value]);
  function commit() {
    if (draft === value) return;
    const formatted = normalizePrice(draft);
    if (formatted === null) { setError(PRICE_ERROR); return; }
    setDraft(formatted);
    setError(null);
    save(formatted);
  }
  return {
    value: draft,
    inputMode: 'numeric' as const,
    'aria-invalid': !!error,
    title: error ?? undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => { setDraft(event.target.value); setError(normalizePrice(event.target.value) === null ? PRICE_ERROR : null); },
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') event.currentTarget.blur();
      if (event.key === 'Escape') { setDraft(value); setError(null); }
    },
    error,
  };
}
