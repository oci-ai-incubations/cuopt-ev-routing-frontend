import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { type SelectHTMLAttributes, forwardRef, useEffect, useRef, useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className, value, defaultValue, onChange, id, name, disabled, ...props }, ref) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLUListElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const hasPlaceholder = Boolean(placeholder);
    const getInitialValue = () => {
      if (typeof defaultValue === 'string') return defaultValue;
      if (hasPlaceholder) return '';
      return options[0]?.value ?? '';
    };
    const [internalValue, setInternalValue] = useState<string>(getInitialValue);

    const isControlled = value !== undefined;
    const selectedValue = isControlled ? String(value ?? '') : internalValue;
    const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0];

    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }, []);

    const assignSelectRef = (node: HTMLSelectElement | null) => {
      selectRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref).current = node;
      }
    };

    const handleOptionSelect = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (selectRef.current) {
        selectRef.current.value = nextValue;
        selectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }

      setIsOpen(false);
    };

    useEffect(() => {
      if (!isOpen) return;

      const updateDropdownDirection = () => {
        if (!triggerRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const fallbackMenuHeight = Math.min(options.length * 42, 280);
        const menuHeight = menuRef.current?.offsetHeight ?? fallbackMenuHeight;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        setOpenUpward(spaceBelow < menuHeight && spaceAbove > spaceBelow);
      };

      updateDropdownDirection();
      window.addEventListener('resize', updateDropdownDirection);
      window.addEventListener('scroll', updateDropdownDirection, true);

      return () => {
        window.removeEventListener('resize', updateDropdownDirection);
        window.removeEventListener('scroll', updateDropdownDirection, true);
      };
    }, [isOpen, options.length]);

    return (
      <div ref={wrapperRef} className={clsx('w-full relative', isOpen && 'z-[70]')}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={assignSelectRef}
          id={id}
          name={name}
          value={selectedValue}
          onChange={(event) => {
            if (!isControlled) {
              setInternalValue(event.target.value);
            }
            onChange?.(event);
          }}
          disabled={disabled}
          tabIndex={-1}
          className="sr-only"
          {...props}
        >
          {hasPlaceholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            id={id ? `${id}-trigger` : undefined}
            disabled={disabled}
            onClick={() => setIsOpen((current) => !current)}
            className={clsx(
              'w-full bg-dark-bg border border-dark-border rounded-lg',
              'text-left text-sm',
              'pl-4 pr-12 py-2.5',
              'focus:outline-none focus:ring-2 focus:ring-[#C74634] focus:border-transparent',
              'transition-all duration-200',
              'cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
              isOpen && 'ring-2 ring-[#C74634] border-transparent',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={clsx(selectedOption ? 'text-white' : 'text-gray-400')}>
              {selectedOption?.label ?? placeholder ?? ''}
            </span>
          </button>
          <ChevronDown
            className={clsx(
              'w-4 h-4 text-white pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
          {isOpen && !disabled && (
            <ul
              ref={menuRef}
              className={clsx(
                'absolute w-full bg-dark-bg border border-dark-border rounded-lg shadow-xl z-[80] overflow-hidden text-sm',
                openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
              )}
            >
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleOptionSelect(option.value)}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 transition-colors',
                      option.value === selectedValue
                        ? 'bg-white/10 text-white'
                        : 'text-gray-200 hover:bg-white/10'
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
