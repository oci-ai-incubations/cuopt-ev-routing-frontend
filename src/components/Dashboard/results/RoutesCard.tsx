import { AlertTriangle, Car, ChevronDown, ChevronRight, ChevronUp, Download, Route, Wrench } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { formatDistance, formatDuration, getVehicleColor, formatVehicleName, getVehiclePlate } from '@/utils';

import { calculateRouteSegments } from './calculateRouteSegments';

import type { Stop, VehicleRoute } from '@/types';


interface RoutesCardProps {
  routes: VehicleRoute[];
  stops: Stop[];
  totalDistance: number;
  totalDuration: number;
  vehiclesUsed: number;
  stopsServed: number;
  solveTime: number;
  resultStatus?: string;
  routeWarnings: Map<number, string[]>;
  shiftLimitMinutes: number;
  expandedRoutes: Set<number>;
  visibleRoutesCount: number;
  onToggleRoute: (vehicleId: number) => void;
  onShowMore: () => void;
  onShowLess: () => void;
  onExport: (format: 'json' | 'csv') => void;
}

export function RoutesCard({
  routes,
  stops,
  routeWarnings,
  shiftLimitMinutes,
  expandedRoutes,
  visibleRoutesCount,
  onToggleRoute,
  onShowMore,
  onShowLess,
  onExport,
}: RoutesCardProps) {
  const visibleRoutes = routes.slice(0, visibleRoutesCount);
  const hasMoreRoutes = routes.length > visibleRoutesCount;
  const remainingRoutes = routes.length - visibleRoutesCount;

  return (
    <Card variant="bordered" className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Routes</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => onExport('json')}
            disabled={routes.length === 0}
          >
            JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => onExport('csv')}
            disabled={routes.length === 0}
          >
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {routes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 flex-1 flex flex-col items-center justify-center">
            <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No routes generated yet</p>
            <p className="text-sm mt-1">Configure your fleet and stops, then run optimization</p>
          </div>
        ) : (
          <div className="space-y-2 h-full">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Showing {visibleRoutes.length} of {routes.length} routes</span>
              {routeWarnings.size > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <AlertTriangle className="w-3 h-3" />
                  {routeWarnings.size} routes with warnings
                </span>
              )}
            </div>

            {visibleRoutes.map((route) => {
              const color = getVehicleColor(route.vehicle_id);
              const isExpanded = expandedRoutes.has(route.vehicle_id);
              const warnings = routeWarnings.get(route.vehicle_id);

              return (
                <div
                  key={route.vehicle_id}
                  className={`bg-dark-bg rounded-lg border overflow-hidden ${
                    warnings ? 'border-yellow-500/50' : 'border-dark-border'
                  }`}
                >
                  <button
                    onClick={() => onToggleRoute(route.vehicle_id)}
                    className="w-full p-3 flex items-center gap-4 hover:bg-dark-hover transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.color }} />
                    <div className="flex-1 text-left">
                      <span className="font-medium text-white font-mono">{formatVehicleName(route.vehicle_id)}</span>
                      <span className="text-gray-500 ml-2 text-xs">{getVehiclePlate(route.vehicle_id).name}</span>
                      <span className="text-gray-400 ml-3 text-sm">{route.route.length - 2} stops</span>
                      {warnings && <AlertTriangle className="w-3 h-3 text-yellow-400 inline ml-2" />}
                    </div>
                    <div className="text-sm text-gray-400 space-x-4">
                      <span className={route.route_distance > 500 ? 'text-yellow-400' : ''}>
                        {formatDistance(route.route_distance)}
                      </span>
                      <span className={route.route_duration > shiftLimitMinutes ? 'text-yellow-400' : ''}>
                        {formatDuration(route.route_duration)}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-dark-border">
                      {warnings && (
                        <div className="mt-2 mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                          <div className="flex items-center gap-1 font-medium mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            Route Warnings
                          </div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {warnings.map((w) => (
                              <li key={w}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(() => {
                        const segments = calculateRouteSegments(route.route, route.arrival_times || [], stops);
                        const totalDriveTime = segments.filter((s) => s.type === 'drive').reduce((sum, s) => sum + s.duration, 0);
                        const totalJobTime = segments.filter((s) => s.type === 'job').reduce((sum, s) => sum + s.duration, 0);

                        return segments.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Car className="w-3 h-3 text-blue-400" />
                                <span className="text-gray-400">Drive:</span>
                                <span className="text-blue-400 font-medium">{formatDuration(totalDriveTime)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Wrench className="w-3 h-3 text-[#C74634]" />
                                <span className="text-gray-400">Jobs:</span>
                                <span className="text-[#C74634] font-medium">{formatDuration(totalJobTime)}</span>
                              </div>
                              <div className="text-gray-500">
                                ({Math.round((totalJobTime / (totalDriveTime + totalJobTime)) * 100) || 0}% productive)
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1 text-xs">
                              <span className="px-2 py-1 rounded bg-[#C74634]/20 text-[#C74634]">Depot</span>
                              {(() => {
                                const segmentKeyCounts = new Map<string, number>();
                                return segments.map((segment) => {
                                  const baseSegmentKey = [
                                    route.vehicle_id,
                                    segment.type,
                                    segment.stopId ?? 'no-stop',
                                    segment.label,
                                    segment.duration,
                                    segment.color ?? 'no-color',
                                  ].join('-');
                                  const seenCount = segmentKeyCounts.get(baseSegmentKey) ?? 0;
                                  segmentKeyCounts.set(baseSegmentKey, seenCount + 1);
                                  const segmentKey = `${baseSegmentKey}-${seenCount}`;

                                  return (
                                    <div key={segmentKey} className="flex items-center gap-1">
                                      <span className="text-gray-500">→</span>
                                      {segment.type === 'drive' ? (
                                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 whitespace-nowrap">
                                          <Car className="w-3 h-3 inline mr-1" />
                                          {formatDuration(segment.duration)}
                                        </span>
                                      ) : (
                                        <span
                                          className="px-2 py-1 rounded whitespace-nowrap"
                                          style={{ backgroundColor: `${segment.color}20`, color: segment.color }}
                                        >
                                          <Wrench className="w-3 h-3 inline mr-1" />
                                          {segment.label} ({formatDuration(segment.duration)})
                                        </span>
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {route.route.map((stopId, idx) => {
                              let stopLabel: string;
                              if (idx === 0) stopLabel = 'Depot';
                              else if (idx === route.route.length - 1) stopLabel = 'Return';
                              else stopLabel = `Stop ${stopId}`;
                              let stopKey: string;
                              if (idx === 0) {
                                stopKey = `route-${route.vehicle_id}-depot-start`;
                              } else if (idx === route.route.length - 1) {
                                stopKey = `route-${route.vehicle_id}-depot-return`;
                              } else {
                                stopKey = `route-${route.vehicle_id}-stop-${stopId}`;
                              }
                              return (
                                <div key={stopKey} className="flex items-center gap-1 text-xs">
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      idx === 0 || idx === route.route.length - 1
                                        ? 'bg-[#C74634]/20 text-[#C74634]'
                                        : 'bg-dark-card text-gray-300'
                                    }`}
                                  >
                                    {stopLabel}
                                  </span>
                                  {idx < route.route.length - 1 && <span className="text-gray-500">→</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {route.arrival_times && route.arrival_times.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Arrival times: {route.arrival_times.map((t) => formatDuration(t)).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-center gap-2 pt-2">
              {hasMoreRoutes && (
                <button
                  onClick={onShowMore}
                  className="px-4 py-2 text-sm text-[#C74634] hover:bg-[#C74634]/10 rounded-lg transition-colors"
                >
                  Load More ({remainingRoutes} remaining)
                </button>
              )}
              {visibleRoutesCount > 20 && (
                <button
                  onClick={onShowLess}
                  className="px-4 py-2 text-sm text-gray-400 hover:bg-dark-hover rounded-lg transition-colors flex items-center gap-1"
                >
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
