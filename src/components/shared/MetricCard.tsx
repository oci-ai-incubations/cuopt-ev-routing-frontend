import { clsx } from 'clsx';
import { type LucideIcon } from 'lucide-react';

import { Card } from './Card';
import { Skeleton } from './Skeleton';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  variant?: 'default' | 'highlight';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isLoading = false,
  variant = 'default',
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card variant="bordered" padding="md">
        <div className="space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={32} />
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="bordered"
      padding="sm"
      className={clsx(
        'transition-all duration-200 hover:border-dark-hover',
        variant === 'highlight' && 'border-oracle-red/30 bg-oracle-red/5'
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          <p className="text-[11px] sm:text-xs lg:text-sm text-gray-400 flex-1 min-w-0 leading-tight break-normal">
            {title}
          </p>
          {Icon && (
            <div
              className={clsx(
                'p-1.5 rounded-lg shrink-0',
                variant === 'highlight'
                  ? 'bg-oracle-red/20 text-oracle-red'
                  : 'bg-dark-hover text-gray-400'
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p
            className={clsx(
              'text-base sm:text-lg lg:text-xl font-bold mt-1 animate-count-up font-mono',
              'leading-tight break-words whitespace-normal',
              variant === 'highlight' ? 'text-oracle-red' : 'text-white'
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs leading-tight"
              style={{ color: '#C74634' }}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span className="truncate">{Math.abs(trend.value)}% vs baseline</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
