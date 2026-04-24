import { Select } from '@/components/shared/Select';

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: string }>;
  hint?: string;
  placeholder?: string;
}

export function SelectField({ label, value, onChange, options, hint, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <Select
        label={label}
        value={value}
        placeholder={placeholder}
        options={options.map((option) => ({
          value: option.value,
          label: option.icon ? `${option.icon} ${option.label}` : option.label,
        }))}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
