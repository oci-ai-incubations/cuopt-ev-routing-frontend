import { Clock, MapPin, Route, Truck, Zap } from 'lucide-react';

import { MetricCard } from '@/components/shared/MetricCard';
import { formatDistance, formatDuration, formatSolveTime } from '@/utils';

interface MetricsStripProps {
  resultExists: boolean;
  totalDistance: number;
  totalDuration: number;
  vehiclesUsed: number;
  numVehicles: number;
  stopsServed: number;
  totalStops: number;
  solveTimeSeconds: number;
  performanceVsBaseline: number;
  isBetterThanBaseline: boolean;
  expectedBaseline: number;
}

export function MetricsStrip({
  resultExists,
  totalDistance,
  totalDuration,
  vehiclesUsed,
  numVehicles,
  stopsServed,
  totalStops,
  solveTimeSeconds,
  performanceVsBaseline,
  isBetterThanBaseline,
  expectedBaseline,
}: MetricsStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard
        title="Total Distance"
        value={formatDistance(totalDistance)}
        icon={Route}
        variant={resultExists ? 'highlight' : 'default'}
      />
      <MetricCard
        title="Total Duration"
        value={formatDuration(totalDuration)}
        icon={Clock}
        variant={resultExists ? 'highlight' : 'default'}
      />
      <MetricCard
        title="Vehicles Used"
        value={`${vehiclesUsed} / ${numVehicles}`}
        icon={Truck}
        variant={resultExists ? 'highlight' : 'default'}
        trend={
          vehiclesUsed > 0 && numVehicles > 0
            ? {
                value: Math.round((vehiclesUsed / numVehicles) * 100),
                isPositive: vehiclesUsed < numVehicles,
              }
            : undefined
        }
      />
      <MetricCard
        title="Stops Served"
        value={`${stopsServed} / ${totalStops}`}
        icon={MapPin}
        variant={resultExists ? 'highlight' : 'default'}
      />
      <MetricCard
        title="Solve Time"
        value={formatSolveTime(solveTimeSeconds * 1000)}
        icon={Zap}
        variant="highlight"
        trend={
          solveTimeSeconds > 0 && expectedBaseline > 0
            ? {
                value: Math.round(Math.abs(performanceVsBaseline)),
                isPositive: isBetterThanBaseline,
              }
            : undefined
        }
      />
    </div>
  );
}
