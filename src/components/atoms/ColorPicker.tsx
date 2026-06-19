interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="color-row">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="hex-label">{value}</span>
    </div>
  );
}
