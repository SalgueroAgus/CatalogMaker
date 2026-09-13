import { Theme } from '@radix-ui/themes';
import type { ComponentProps } from 'react';
import { useUIThemeStore } from '../../store/useUIThemeStore';

export function EditorTheme({ className = '', ...props }: ComponentProps<typeof Theme>) {
  const theme = useUIThemeStore((s) => s.theme);
  return <Theme appearance={theme} accentColor={theme === 'dark' ? 'mint' : 'jade'} grayColor="slate" radius="medium" scaling="100%" className={`editor-ui ${className}`} {...props} />;
}
