import type { AdverseConditionLevel } from '@/types';

interface SeverityBadgeProps {
  level: AdverseConditionLevel;
}

const colors: Record<AdverseConditionLevel, string> = {
  none: 'bg-green-500/20 text-green-400 border-green-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  severe: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const labels: Record<AdverseConditionLevel, string> = {
  none: 'Good',
  low: 'Minor',
  moderate: 'Moderate',
  high: 'Adverse',
  severe: 'Severe',
};

export function SeverityBadge({ level }: SeverityBadgeProps) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[level]}`}>
      {labels[level]}
    </span>
  );
}
