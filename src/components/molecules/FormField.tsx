interface Props {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: Props) {
  return (
    <div>
      <label className="sb-label">{label}</label>
      {children}
    </div>
  );
}
