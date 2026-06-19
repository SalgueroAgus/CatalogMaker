import { Select } from '../atoms/Select';
import { FormField } from './FormField';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SYSTEM_FONTS } from '../../constants/fonts';
import type { Fonts } from '../../types';

interface Props {
  label: string;
  fontKey: keyof Fonts;
}

const FONT_OPTIONS = SYSTEM_FONTS.map((f) => ({
  value: f.stack,
  label: f.name,
  fontFamily: f.stack,
}));

export function FontSelector({ label, fontKey }: Props) {
  const value = useSettingsStore((s) => s.fonts[fontKey]);
  const updateFont = useSettingsStore((s) => s.updateFont);

  return (
    <FormField label={label}>
      <Select
        value={value}
        options={FONT_OPTIONS}
        onChange={(e) => updateFont(fontKey, e.target.value)}
      />
    </FormField>
  );
}
