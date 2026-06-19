interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'export';
}

export function Button({ variant = 'default', className = '', children, ...props }: Props) {
  const base =
    variant === 'ghost' ? 'sb-btn sb-btn-ghost'
    : variant === 'export' ? 'sb-btn-export'
    : 'sb-btn';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
