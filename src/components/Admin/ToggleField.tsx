import { clsx } from 'clsx';

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-white">{label}</div>
        {description && <div className="text-xs text-gray-500">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={clsx('relative w-11 h-6 rounded-full transition-colors', checked ? 'bg-oracle-red' : 'bg-dark-border')}
      >
        <div className={clsx('absolute top-1 w-4 h-4 rounded-full bg-white transition-transform', checked ? 'left-6' : 'left-1')} />
      </button>
    </div>
  );
}
