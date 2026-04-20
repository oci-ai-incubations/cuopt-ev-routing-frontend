interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  unit?: string;
}

export function NumberField({ label, value, onChange, min, max, step = 1, hint, unit }: NumberFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-oracle-red transition-colors"
        />
        {unit && <span className="text-gray-400 text-sm">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
