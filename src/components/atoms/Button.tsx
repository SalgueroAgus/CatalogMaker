interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'export' | 'danger' | 'reset';
}

export function Button({ variant = 'default', className = '', children, ...props }: Props) {
  const base =
    variant === 'ghost'  ? 'sb-btn sb-btn-ghost'
    : variant === 'export' ? 'sb-btn-export'
    : variant === 'danger' ? 'sb-btn-danger'
    : variant === 'reset'  ? 'sb-btn-reset'
    : 'sb-btn';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
