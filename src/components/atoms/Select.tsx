import { useEffect, useState } from 'react';
import { Select as RadixSelect } from '@radix-ui/themes';

interface Option { value: string; label: string; group?: string }
interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ value, onValueChange, options, label, disabled, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const groups = [...new Set(options.map((option) => option.group))];
  return <RadixSelect.Root open={open && !disabled} onOpenChange={setOpen} value={value} onValueChange={onValueChange} disabled={disabled} size="3">
    <RadixSelect.Trigger aria-label={label} className={`ui-select ${className}`} />
    <RadixSelect.Content className="editor-ui">
      {groups.map((group) => <RadixSelect.Group key={group ?? 'options'}>
        {group && <RadixSelect.Label>{group}</RadixSelect.Label>}
        {options.filter((option) => option.group === group).map((option) => <RadixSelect.Item disabled={disabled} key={option.value} value={option.value}>{option.label}</RadixSelect.Item>)}
      </RadixSelect.Group>)}
    </RadixSelect.Content>
  </RadixSelect.Root>;
}
