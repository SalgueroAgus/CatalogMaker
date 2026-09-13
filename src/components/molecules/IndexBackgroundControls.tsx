import { useRef } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { usePersistenceStore } from '../../store/usePersistenceStore';
import { Select } from '../atoms/Select';
import { Button } from '../atoms/Button';
import { GradientPickerPopover } from '../atoms/GradientPickerPopover';
import { FormField } from './FormField';

export function IndexBackgroundControls() {
  const settings = useSettingsStore();
  const busy = usePersistenceStore((s) => s.managing || s.exporting || s.saving === 'conflict');
  const fileRef = useRef<HTMLInputElement>(null);
  return <div className="sb-stack-sm">
    <FormField label="Fondo del índice">
      <Select label="Fondo del índice" disabled={busy} value={settings.indexBackgroundMode} options={[{ value: 'global', label: 'Usar fondo global' }, { value: 'image', label: 'Imagen propia' }, { value: 'color', label: 'Solo color' }]} onValueChange={(value) => { if (value === 'global' || value === 'image' || value === 'color') void settings.setIndexBackgroundMode(value); }} />
    </FormField>
    {settings.indexBackgroundMode !== 'global' && <>
      <span className="sb-label">Color de fondo del índice</span>
      <GradientPickerPopover label="Color de fondo del índice" idSuffix="index-bg" disabled={busy} solidOnly value={settings.indexBgColor} onChange={settings.setIndexBgColor} />
      {settings.indexBackgroundMode === 'image' && <>
        <input ref={fileRef} type="file" accept="image/*" hidden disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void settings.setIndexBgImage(file); event.target.value = ''; }} />
        <Button disabled={busy} onClick={() => fileRef.current?.click()}>{settings.indexBgImage ? 'Cambiar imagen del índice' : 'Cargar imagen del índice'}</Button>
        {settings.indexBgImage && <Button disabled={busy} variant="ghost" onClick={() => void settings.setIndexBgImage(null)}>Quitar imagen del índice</Button>}
        <label className="sb-opacity-row">Opacidad del índice
          <input type="range" min={0} max={1} step={0.05} disabled={busy} value={settings.indexBgImageOpacity} onChange={(event) => void settings.setIndexBgImageOpacity(Number(event.target.value))} />
          <span>{Math.round(settings.indexBgImageOpacity * 100)}%</span>
        </label>
      </>}
    </>}
  </div>;
}
