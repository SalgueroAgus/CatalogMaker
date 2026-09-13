interface Props {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: Props) {
  return (
    <label className="sb-form-field">
      <span className="sb-label">{label}</span>
      {children}
    </label>
  );
}
