interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: Props) {
  return <input className={`sb-input ${className}`} {...props} />;
}
