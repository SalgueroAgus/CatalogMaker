import { Theme } from '@radix-ui/themes';
import type { ComponentProps } from 'react';

export function EditorTheme({ className = '', ...props }: ComponentProps<typeof Theme>) {
  return <Theme appearance="light" accentColor="jade" grayColor="slate" radius="medium" scaling="100%" className={`editor-ui ${className}`} {...props} />;
}
