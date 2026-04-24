import { AlertTriangle, Clock, Lightbulb, Package, Plus, Timer } from 'lucide-react';

import { Badge } from '@/components/shared/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { formatDuration } from '@/utils';

import type { RecoverySuggestion } from './types';

interface WarningsSectionProps {
  routeWarningsSize: number;
  routesLength: number;
  shiftLimitLabel: string;
  shiftLimitMinutes: number;
  totalDuration: number;
  vehiclesUsed: number;
  configuredVehicles: number;
  parallelJobsCount: number;
  resultStatus?: string;
  hasDroppedStops: boolean;
  droppedStopsCount: number;
  totalStops: number;
  recoverySuggestions: RecoverySuggestion[];
}

export function buildRecoverySuggestions(params: {
  hasDroppedStops: boolean;
  droppedStopsCount: number;
  stops: Array<{ demand: number }>;
  config: {
    numVehicles: number;
    vehicleCapacity: number;
    enableTimeWindows: boolean;
    defaultServiceTime?: number;
  };
}): RecoverySuggestion[] {
  const { hasDroppedStops, droppedStopsCount, stops, config } = params;
  if (!hasDroppedStops) return [];

  const suggestions: RecoverySuggestion[] = [];
  const totalDemand = stops.reduce((sum, s) => sum + s.demand, 0);
  const avgDemandPerStop = totalDemand / stops.length;
  const totalCapacity = config.numVehicles * config.vehicleCapacity;
  const capacityUtilization = (totalDemand / totalCapacity) * 100;

  if (capacityUtilization > 90) {
    const additionalVehiclesNeeded = Math.ceil((droppedStopsCount * avgDemandPerStop) / config.vehicleCapacity);
    suggestions.push({
      icon: <Plus className="w-4 h-4 text-green-400" />,
      title: 'Add More Vehicles',
      description: `Adding ${additionalVehiclesNeeded} vehicle${additionalVehiclesNeeded > 1 ? 's' : ''} could serve the dropped stops.`,
      impact: `+${droppedStopsCount} stops recovered`,
      action: `Increase fleet to ${config.numVehicles + additionalVehiclesNeeded} vehicles`,
    });
  }

  if (capacityUtilization > 80) {
    const requiredCapacity = Math.ceil(totalDemand / config.numVehicles);
    suggestions.push({
      icon: <Package className="w-4 h-4 text-blue-400" />,
      title: 'Increase Vehicle Capacity',
      description: `Current capacity is ${config.vehicleCapacity} units. Consider larger vehicles.`,
      impact: `Capacity utilization: ${capacityUtilization.toFixed(0)}%`,
      action: `Increase capacity to ${requiredCapacity} units/vehicle`,
    });
  }

  if (config.enableTimeWindows) {
    suggestions.push({
      icon: <Timer className="w-4 h-4 text-yellow-400" />,
      title: 'Extend Time Windows',
      description: 'Some stops may be outside their time windows.',
      impact: `${droppedStopsCount} stops missed windows`,
      action: 'Extend shift hours or adjust stop time windows',
    });
  }

  if (config.defaultServiceTime && config.defaultServiceTime > 30) {
    suggestions.push({
      icon: <Clock className="w-4 h-4 text-purple-400" />,
      title: 'Reduce Service Time',
      description: `Current dwell time: ${config.defaultServiceTime} min/stop.`,
      impact: 'More stops per route possible',
      action: 'Consider shorter service durations',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      icon: <Lightbulb className="w-4 h-4 text-[#C74634]" />,
      title: 'Review Constraints',
      description: 'Check vehicle capacity, time windows, and fleet size.',
      impact: `${droppedStopsCount} stops need attention`,
    });
  }

  return suggestions;
}

export function WarningsSection({
  routeWarningsSize,
  routesLength,
  shiftLimitLabel,
  shiftLimitMinutes,
  totalDuration,
  vehiclesUsed,
  configuredVehicles,
  parallelJobsCount,
  resultStatus,
  hasDroppedStops,
  droppedStopsCount,
  totalStops,
  recoverySuggestions,
}: WarningsSectionProps) {
  return (
    <>
      {routeWarningsSize > 0 && (
        <Card
          variant="bordered"
          className={`${
            routeWarningsSize >= routesLength * 0.5 ? 'border-red-500/50 bg-red-500/5' : 'border-orange-500/50 bg-orange-500/5'
          }`}
        >
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  routeWarningsSize >= routesLength * 0.5 ? 'text-red-400' : 'text-orange-400'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium ${routeWarningsSize >= routesLength * 0.5 ? 'text-red-400' : 'text-orange-400'}`}>
                    {routeWarningsSize} of {routesLength} Routes Have Constraint Violations
                  </h4>
                  <Badge variant={routeWarningsSize >= routesLength * 0.5 ? 'error' : 'warning'}>
                    {Math.round((routeWarningsSize / routesLength) * 100)}% affected
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  These routes exceed the {shiftLimitLabel} shift limit. Stops are assigned but <strong>cannot be practically served</strong> within working hours.
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Problem:</strong> Total service time + travel time = {formatDuration(totalDuration)} across {vehiclesUsed} vehicles (avg {formatDuration(Math.round(totalDuration / vehiclesUsed))}/vehicle)</p>
                  <p><strong>Available:</strong> {vehiclesUsed} vehicles × {shiftLimitLabel} shift = {formatDuration(vehiclesUsed * shiftLimitMinutes)} total vehicle-hours</p>
                  <p><strong>Required:</strong> ~{Math.ceil(totalDuration / shiftLimitMinutes)} vehicles needed for {shiftLimitLabel} shifts</p>
                  {vehiclesUsed < configuredVehicles && (
                    <p className="text-yellow-400">
                      <strong>Note:</strong> Only {vehiclesUsed} of {configuredVehicles} configured vehicles used. {parallelJobsCount > 0 ? 'Parallel clustering may limit vehicle distribution - try single optimization for better utilization.' : 'Some vehicles may be unused due to constraint satisfaction.'}
                    </p>
                  )}
                  <p>
                    <strong>Fix:</strong> {vehiclesUsed < configuredVehicles
                      ? 'Try single optimization (not parallel) to use all vehicles, or reduce service times'
                      : 'Add more vehicles, reduce service times, or increase shift duration'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {resultStatus === 'PARTIAL' && routeWarningsSize === 0 && (
        <Card variant="bordered" className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-400 mb-1">Partial Solution - Some Constraints Relaxed</h4>
                <p className="text-sm text-gray-400 mb-2">
                  cuOPT couldn&apos;t find a fully feasible solution. Time window or capacity constraints may be violated.
                  This typically means the workload exceeds available vehicle-hours.
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Why this happens:</strong> Total service time + travel time exceeds combined vehicle shift limits</p>
                  <p><strong>To fix:</strong> Add more vehicles, extend shift hours, reduce service times, or accept dropped stops</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasDroppedStops && (
        <Card variant="bordered" className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              {droppedStopsCount} Stop{droppedStopsCount > 1 ? 's' : ''} Not Served
            </CardTitle>
            <Badge variant="warning">{((droppedStopsCount / totalStops) * 100).toFixed(1)}% dropped</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-3">
              Some stops couldn&apos;t be served due to constraints. Here are suggestions to recover them:
            </p>
            <div className="space-y-2">
              {recoverySuggestions.map((suggestion) => (
                <div key={suggestion.title} className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{suggestion.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white text-sm">{suggestion.title}</span>
                        <span className="text-xs text-[#C74634]">{suggestion.impact}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                      {suggestion.action && <p className="text-xs text-blue-400 mt-1 font-medium">→ {suggestion.action}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
