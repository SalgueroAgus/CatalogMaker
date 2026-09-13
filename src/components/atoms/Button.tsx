import { forwardRef } from 'react';
import { Button as RadixButton } from '@radix-ui/themes';

interface Props extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: 'default' | 'ghost' | 'export' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'default', className = '', ...props }, ref) {
  return <RadixButton
    ref={ref}
    type="button"
    size="2"
    variant={variant === 'export' ? 'solid' : variant === 'ghost' ? 'ghost' : variant === 'danger' ? 'soft' : 'surface'}
    color={variant === 'danger' ? 'red' : variant === 'export' ? undefined : 'gray'}
    className={`ui-button ${className}`}
    {...props}
  />;
});
