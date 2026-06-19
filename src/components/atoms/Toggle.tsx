interface Props {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function Toggle({ label, active, onToggle }: Props) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">{label}</span>
      <div className={`toggle-track ${active ? 'active' : ''}`} onClick={onToggle}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}
