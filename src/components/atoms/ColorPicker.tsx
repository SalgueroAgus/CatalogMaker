import { GradientPickerPopover } from './GradientPickerPopover';

interface Props {
  value: string;
  onChange: (value: string) => void;
  solidOnly?: boolean;
  idSuffix?: string;
}

export function ColorPicker({ value, onChange, solidOnly, idSuffix }: Props) {
  return (
    <GradientPickerPopover
      value={value}
      onChange={onChange}
      solidOnly={solidOnly}
      idSuffix={idSuffix}
    />
  );
}
