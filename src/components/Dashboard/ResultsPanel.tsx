import { useMemo, useState } from 'react';

import { performanceBaselines } from '@/data/benchmarkData';
import { useConfigStore, useOptimizationStore } from '@/store';
import { setVehicleCountry } from '@/utils';

import { MetricsStrip } from './results/MetricsStrip';
import { ParallelJobsCard } from './results/ParallelJobsCard';
import { RoutesCard } from './results/RoutesCard';
import { WarningsSection, buildRecoverySuggestions } from './results/WarningsSection';

function getBaselineForStops(numStops: number): number {
  const sorted = [...performanceBaselines].sort((a, b) => a.stopCount - b.stopCount);
  if (numStops <= sorted[0].stopCount) return sorted[0].solveTimeSeconds;
  if (numStops >= sorted[sorted.length - 1].stopCount) return sorted[sorted.length - 1].solveTimeSeconds;

  for (let i = 0; i < sorted.length - 1; i++) {
    if (numStops >= sorted[i].stopCount && numStops <= sorted[i + 1].stopCount) {
      const ratio = (numStops - sorted[i].stopCount) / (sorted[i + 1].stopCount - sorted[i].stopCount);
      return sorted[i].solveTimeSeconds + ratio * (sorted[i + 1].solveTimeSeconds - sorted[i].solveTimeSeconds);
    }
  }
  return sorted[0].solveTimeSeconds;
}

export function ResultsPanel() {
  const {
    result,
    routes,
    totalDistance,
    totalDuration,
    vehiclesUsed,
    stopsServed,
    solveTime,
    stops,
    parallelJobs,
    config,
  } = useOptimizationStore();
  const { config: appConfig } = useConfigStore();

  setVehicleCountry(appConfig.countryCode);

  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [visibleRoutesCount, setVisibleRoutesCount] = useState(20);

  const expectedBaseline = stops.length > 0 ? getBaselineForStops(stops.length) : 0;
  const performanceVsBaseline = solveTime > 0 && expectedBaseline > 0
    ? ((expectedBaseline - solveTime) / expectedBaseline) * 100
    : 0;
  const isBetterThanBaseline = performanceVsBaseline > 0;

  const shiftLimitMinutes = config.enableTimeWindows ? 480 : 720;
  const shiftLimitLabel = config.enableTimeWindows ? '8h' : '12h';

  const routeWarnings = useMemo(() => {
    const warnings = new Map<number, string[]>();
    routes.forEach((route) => {
      const routeWarns: string[] = [];
      if (route.route_duration > shiftLimitMinutes) {
        routeWarns.push(`Duration exceeds ${shiftLimitLabel} shift limit (PARTIAL solution)`);
      }
      if (route.route_distance > 500) routeWarns.push('Distance exceeds 500km threshold');
      if (route.route.length - 2 > 30) routeWarns.push(`${route.route.length - 2} stops may be operationally challenging`);
      if (routeWarns.length > 0) warnings.set(route.vehicle_id, routeWarns);
    });
    return warnings;
  }, [routes, shiftLimitMinutes, shiftLimitLabel]);

  const droppedStopsCount = stops.length - stopsServed;
  const hasDroppedStops = Boolean(result && droppedStopsCount > 0);
  const recoverySuggestions = useMemo(
    () =>
      buildRecoverySuggestions({
        hasDroppedStops,
        droppedStopsCount,
        stops,
        config: {
          numVehicles: config.numVehicles,
          vehicleCapacity: config.vehicleCapacity,
          enableTimeWindows: config.enableTimeWindows,
          defaultServiceTime: config.defaultServiceTime,
        },
      }),
    [hasDroppedStops, droppedStopsCount, stops, config]
  );

  const toggleRoute = (vehicleId: number) => {
    const next = new Set(expandedRoutes);
    if (next.has(vehicleId)) next.delete(vehicleId);
    else next.add(vehicleId);
    setExpandedRoutes(next);
  };

  const handleExport = (format: 'json' | 'csv') => {
    let data: string;
    if (format === 'json') {
      data = JSON.stringify(
        {
          routes,
          metrics: { totalDistance, totalDuration, vehiclesUsed, stopsServed, solveTime },
          status: result?.status || 'SUCCESS',
        },
        null,
        2
      );
    } else {
      const headers = ['Vehicle ID', 'Plate', 'Name', 'Stops Count', 'Route Sequence', 'Distance (km)', 'Duration (min)', 'Status'];
      const rows = routes.map((r) => {
        const vehicle = appConfig.vehicleLabelType === 'license_plate'
          ? `${r.vehicle_id}`
          : `${r.vehicle_id}`;
        const stopsCount = r.route.length - 2;
        const routeSequence = r.route.join(' → ');
        const status = r.route_duration > shiftLimitMinutes ? 'SHIFT VIOLATION' : 'OK';
        return [r.vehicle_id, vehicle, `Vehicle ${r.vehicle_id}`, stopsCount, `"${routeSequence}"`, r.route_distance.toFixed(2), r.route_duration, status].join(',');
      });
      data = [headers.join(','), ...rows].join('\n');
    }

    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routes_${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full p-4 overflow-y-auto flex flex-col gap-4">
      <MetricsStrip
        resultExists={Boolean(result)}
        totalDistance={totalDistance}
        totalDuration={totalDuration}
        vehiclesUsed={vehiclesUsed}
        numVehicles={config.numVehicles}
        stopsServed={stopsServed}
        totalStops={stops.length}
        solveTimeSeconds={solveTime}
        performanceVsBaseline={performanceVsBaseline}
        isBetterThanBaseline={isBetterThanBaseline}
        expectedBaseline={expectedBaseline}
      />

      <WarningsSection
        routeWarningsSize={routeWarnings.size}
        routesLength={routes.length}
        shiftLimitLabel={shiftLimitLabel}
        shiftLimitMinutes={shiftLimitMinutes}
        totalDuration={totalDuration}
        vehiclesUsed={vehiclesUsed}
        configuredVehicles={config.numVehicles}
        parallelJobsCount={parallelJobs.length}
        resultStatus={result?.status}
        hasDroppedStops={hasDroppedStops}
        droppedStopsCount={droppedStopsCount}
        totalStops={stops.length}
        recoverySuggestions={recoverySuggestions}
      />

      <ParallelJobsCard parallelJobs={parallelJobs} />

      <div className="flex-1 min-h-[320px]">
        <RoutesCard
          routes={routes}
          stops={stops}
          totalDistance={totalDistance}
          totalDuration={totalDuration}
          vehiclesUsed={vehiclesUsed}
          stopsServed={stopsServed}
          solveTime={solveTime}
          resultStatus={result?.status}
          routeWarnings={routeWarnings}
          shiftLimitMinutes={shiftLimitMinutes}
          expandedRoutes={expandedRoutes}
          visibleRoutesCount={visibleRoutesCount}
          onToggleRoute={toggleRoute}
          onShowMore={() => setVisibleRoutesCount((prev) => Math.min(prev + 20, routes.length))}
          onShowLess={() => setVisibleRoutesCount(20)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
