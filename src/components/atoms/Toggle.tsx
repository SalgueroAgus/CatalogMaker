import { useId } from 'react';
import * as Switch from '@radix-ui/react-switch';

interface Props {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function Toggle({ label, active, onToggle }: Props) {
  const id = useId();
  return (
    <div className="toggle-row">
      <label className="toggle-label" htmlFor={id}>{label}</label>
      <Switch.Root
        className="toggle-track"
        id={id}
        checked={active}
        onCheckedChange={onToggle}
      >
        <Switch.Thumb className="toggle-thumb" />
      </Switch.Root>
    </div>
  );
}
