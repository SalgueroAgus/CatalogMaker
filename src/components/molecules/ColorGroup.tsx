import { usePersistenceStore } from '../../store/usePersistenceStore';
import { GradientPickerPopover } from '../atoms/GradientPickerPopover';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Colors } from '../../types';

interface Props {
  label: string;
  colorKey: keyof Colors;
  solidOnly?: boolean;
}

export function ColorGroup({ label, colorKey, solidOnly }: Props) {
  const busy = usePersistenceStore((s) => s.managing || s.exporting);
  const value = useSettingsStore((s) => s.colors[colorKey]);
  const updateColor = useSettingsStore((s) => s.updateColor);

  return (
    <div className="color-group">
      <span className="sb-label">{label}</span>
      <GradientPickerPopover
        disabled={busy}
        value={value}
        onChange={(v) => updateColor(colorKey, v)}
        solidOnly={solidOnly}
        idSuffix={colorKey}
        label={label}
      />
    </div>
  );
}
