import { useState } from 'react';
import type { Fonts, FontSizes } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SYSTEM_FONTS, GOOGLE_FONTS, loadGoogleFont } from '../../constants/fonts';

interface Props {
  label: string;
  fontKey?: keyof Fonts;
  sizeKey: keyof FontSizes;
  sizeMin?: number;
  sizeMax?: number;
  sizeOnly?: boolean;
}

const allFonts = [...SYSTEM_FONTS, ...GOOGLE_FONTS];
const googleByStack = new Map(GOOGLE_FONTS.map((f) => [f.stack, f.family]));

function getFontName(stack: string): string {
  return (
    allFonts.find((f) => f.stack === stack)?.name ??
    stack.split(',')[0].replace(/['"]/g, '').trim()
  );
}

export function TypographyRole({
  label,
  fontKey,
  sizeKey,
  sizeMin = 6,
  sizeMax = 28,
  sizeOnly = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const font = useSettingsStore((s) => (fontKey ? s.fonts[fontKey] : ''));
  const size = useSettingsStore((s) => s.fontSizes[sizeKey]);
  const updateFont = useSettingsStore((s) => s.updateFont);
  const updateFontSize = useSettingsStore((s) => s.updateFontSize);

  function handleFontChange(stack: string) {
    const family = googleByStack.get(stack);
    if (family) loadGoogleFont(family);
    if (fontKey) updateFont(fontKey, stack);
  }

  function step(delta: number) {
    const next = Math.round((size + delta) * 10) / 10;
    updateFontSize(sizeKey, Math.min(sizeMax, Math.max(sizeMin, next)));
  }

  function handleSizeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) updateFontSize(sizeKey, Math.min(sizeMax, Math.max(sizeMin, v)));
  }

  const summary = sizeOnly
    ? `${size}px`
    : `${getFontName(font)} · ${size}px`;

  return (
    <div className="typo-role">
      <button className="typo-role-header" onClick={() => setOpen((o) => !o)}>
        <span className={`typo-chevron ${open ? 'open' : ''}`}>▸</span>
        <span className="typo-role-name">{label}</span>
        {!open && <span className="typo-role-summary">{summary}</span>}
      </button>

      {open && (
        <div className="typo-role-body">
          {!sizeOnly && (
            <div className="select-wrap">
              <select
                className="sb-select"
                value={font}
                onChange={(e) => handleFontChange(e.target.value)}
              >
                <optgroup label="Sistema">
                  {SYSTEM_FONTS.map((f) => (
                    <option key={f.name} value={f.stack}>{f.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Google Fonts">
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f.name} value={f.stack}>{f.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="typo-size-row">
            <span className="typo-size-label">Tamaño</span>
            <div className="typo-stepper">
              <button className="typo-step-btn" onClick={() => step(-0.5)} aria-label="Reducir">−</button>
              <input
                type="number"
                className="typo-size-input"
                value={size}
                min={sizeMin}
                max={sizeMax}
                step={0.5}
                onChange={handleSizeInput}
              />
              <span className="typo-size-unit">px</span>
              <button className="typo-step-btn" onClick={() => step(0.5)} aria-label="Aumentar">+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
