import { ColorPicker } from '../atoms/ColorPicker';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Colors } from '../../types';

interface Props {
  label: string;
  colorKey: keyof Colors;
}

export function ColorGroup({ label, colorKey }: Props) {
  const value = useSettingsStore((s) => s.colors[colorKey]);
  const updateColor = useSettingsStore((s) => s.updateColor);

  return (
    <div className="color-group">
      <label>{label}</label>
      <ColorPicker value={value} onChange={(v) => updateColor(colorKey, v)} />
    </div>
  );
}
