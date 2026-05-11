/**
 * Minimal inline UI primitives for the auth admin panels.
 *
 * Replaces redbull's `Card / Button / Badge / Modal / Toggle` UI library
 * (not available in cuopt FE) with small Tailwind-only components keyed
 * to the existing cuopt theme (`dark-bg`, `dark-card`, `dark-border`,
 * `oracle-red`, `oracle-red-hover`).
 */

import { clsx } from 'clsx';
import { X } from 'lucide-react';
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
} from 'react';

// ─── Card ─────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-dark-card border border-dark-border rounded-xl', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-b border-dark-border">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {title}
      </div>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx('p-4', className)}>{children}</div>;
}

// ─── Button ───────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
  };
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-oracle-red text-white hover:bg-oracle-red-hover',
    secondary: 'bg-dark-hover text-white border border-dark-border hover:bg-dark-card',
    ghost: 'text-gray-300 hover:text-white hover:bg-dark-hover',
  };
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : iconPosition === 'left' ? (
        icon
      ) : null}
      {children}
      {!loading && iconPosition === 'right' ? icon : null}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'oracle' | 'success' | 'warning' | 'error' | 'info';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-dark-hover text-gray-300 border-dark-border',
  oracle: 'bg-oracle-red/10 text-oracle-red border-oracle-red/30',
  success: 'bg-green-500/10 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/10 text-red-400 border-red-500/30',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

export function Badge({
  variant = 'default',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        'inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium',
        BADGE_VARIANTS[variant],
      )}
    >
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'w-3.5 h-3.5 border' : 'w-6 h-6 border-2';
  return (
    <div
      className={clsx(
        dims,
        'border-oracle-red/30 border-t-oracle-red rounded-full animate-spin',
      )}
    />
  );
}

export function PanelLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, description, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const w = size === 'sm' ? 'max-w-md' : 'max-w-xl';
  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx('w-full mx-4 bg-dark-card border border-dark-border rounded-xl', w)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 py-3 border-b border-dark-border">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded p-1 hover:bg-dark-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}) {
  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-oracle-red' : 'bg-dark-hover border border-dark-border',
      )}
    >
      <span
        className={clsx(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  );
  if (!label && !description) return switchEl;
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      {switchEl}
      <div className="flex flex-col">
        {label && <span className="text-sm text-white">{label}</span>}
        {description && <span className="text-xs text-gray-400">{description}</span>}
      </div>
    </label>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────
export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        'w-full bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-oracle-red',
        className,
      )}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────
export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={clsx(
        'bg-dark-bg border border-dark-border text-white text-sm rounded-lg px-2.5 py-2 focus:outline-none focus:border-oracle-red',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
