import { JOB_TYPE_CONFIGS } from '@/types';

import type { RouteSegment } from './types';

export function calculateRouteSegments(
  route: number[],
  arrivalTimes: number[],
  stops: Array<{ id: number; serviceDuration?: number; jobType?: string; label?: string; metadata?: Record<string, unknown> }>
): RouteSegment[] {
  const segments: RouteSegment[] = [];

  if (route.length < 2 || arrivalTimes.length < 2) return segments;

  for (let i = 0; i < route.length; i++) {
    const stopIdx = route[i];
    const isDepot = i === 0 || i === route.length - 1;

    if (i > 0) {
      const prevArrival = arrivalTimes[i - 1] || 0;
      const prevServiceTime = i === 1 ? 0 : (stops[route[i - 1] - 1]?.serviceDuration || 0);
      const driveTime = (arrivalTimes[i] || 0) - prevArrival - prevServiceTime;

      if (driveTime > 0) {
        const toLabel = isDepot && i === route.length - 1 ? 'Depot' : `Stop ${stopIdx}`;
        segments.push({
          type: 'drive',
          duration: Math.max(0, driveTime),
          label: `Drive to ${toLabel}`,
        });
      }
    }

    if (!isDepot && stopIdx > 0) {
      const stop = stops[stopIdx - 1];
      const serviceDuration = stop?.serviceDuration || 0;

      if (serviceDuration > 0) {
        const jobType = (stop?.metadata?.jobType as string) || stop?.jobType || 'service';
        const jobConfig = JOB_TYPE_CONFIGS[jobType as keyof typeof JOB_TYPE_CONFIGS];
        const jobLabel = jobConfig?.label || (stop?.metadata?.jobLabel as string) || stop?.label || `Stop ${stopIdx}`;

        segments.push({
          type: 'job',
          duration: serviceDuration,
          label: jobLabel,
          stopId: stopIdx,
          jobType,
          color: jobConfig?.color || '#C74634',
        });
      }
    }
  }

  return segments;
}
