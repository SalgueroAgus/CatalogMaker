import { forwardRef } from 'react';
import { TextField } from '@radix-ui/themes';

export const Input = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<typeof TextField.Root>>(function Input({ className = '', ...props }, ref) {
  return <TextField.Root ref={ref} size="3" className={`ui-input ${className}`} {...props} />;
});
