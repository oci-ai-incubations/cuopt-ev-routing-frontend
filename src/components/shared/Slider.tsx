import { clsx } from 'clsx';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      showValue = true,
      valueFormatter = (v) => String(v),
      className,
      value,
      ...props
    },
    ref
  ) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value as number);

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <label className="text-sm font-medium text-gray-300">{label}</label>
            )}
            {showValue && (
              <span className="text-sm font-mono text-[#C74634]">
                {valueFormatter(numValue || 0)}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          value={value}
          className={clsx(
            'slider-input w-full h-3 appearance-none cursor-pointer rounded-full border border-[#C74634]/45 bg-[#101827]',
            'transition-colors hover:border-[#C74634]/70',
            'focus:outline-none focus:ring-2 focus:ring-[#C74634] focus:ring-offset-0 focus-visible:ring-offset-0',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
