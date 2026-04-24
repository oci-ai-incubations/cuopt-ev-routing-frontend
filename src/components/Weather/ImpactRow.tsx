import { AlertTriangle, Clock, Thermometer, Wind } from 'lucide-react';

import { SeverityBadge } from './SeverityBadge';
import { WeatherIcon } from './WeatherIcon';

import type { WeatherRoutingImpact } from '@/types';

interface ImpactRowProps {
  impact: WeatherRoutingImpact;
}

export function ImpactRow({ impact }: ImpactRowProps) {
  const temp = impact.weather.temperature;
  const wind = Math.round(impact.weather.windSpeed * 2.237);
  const condition = impact.weather.conditions[0];

  return (
    <div
      className={`p-3 rounded-lg border ${
        impact.skipRecommended
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-dark-bg border-dark-border'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {condition && <WeatherIcon conditionId={condition.id} size={16} />}
          <span className="text-sm font-medium text-white truncate max-w-[150px]">
            {impact.stopName}
          </span>
        </div>
        <SeverityBadge level={impact.assessment.level} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Thermometer className="w-3 h-3" />
          <span>{Math.round(temp)}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{wind} mph</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>+{impact.estimatedDelay}m</span>
        </div>
      </div>

      {impact.skipRecommended && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3" />
          <span>Consider postponing this stop</span>
        </div>
      )}
    </div>
  );
}
