import { clsx } from 'clsx';

interface RadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function RadioGroup({ label, value, onChange, options }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex gap-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
              value === opt.value ? 'border-oracle-red bg-oracle-red/10 text-oracle-red' : 'border-dark-border text-gray-400 hover:border-gray-500'
            )}
          >
            <div className={clsx('w-4 h-4 rounded-full border-2 flex items-center justify-center', value === opt.value ? 'border-oracle-red' : 'border-gray-500')}>
              {value === opt.value && <div className="w-2 h-2 rounded-full bg-oracle-red" />}
            </div>
            <span className="text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
