interface Option {
  value: string;
  label: string;
  fontFamily?: string;
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
}

export function Select({ options, ...props }: Props) {
  return (
    <div className="select-wrap">
      <select className="sb-select" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ fontFamily: o.fontFamily }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
