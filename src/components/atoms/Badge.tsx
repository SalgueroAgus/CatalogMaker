interface Props {
  children: React.ReactNode;
  variant?: 'green';
}

export function Badge({ children, variant = 'green' }: Props) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
