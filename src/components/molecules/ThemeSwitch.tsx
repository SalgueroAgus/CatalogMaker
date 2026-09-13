import { useId } from 'react';
import { Switch } from '@radix-ui/themes';
import { useUIThemeStore } from '../../store/useUIThemeStore';

export function ThemeSwitch() {
  const id = useId();
  const theme = useUIThemeStore((s) => s.theme);
  const setTheme = useUIThemeStore((s) => s.setTheme);
  return <label className="theme-switch" htmlFor={id}>
    <span>Modo oscuro</span>
    <Switch id={id} size="3" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
  </label>;
}
