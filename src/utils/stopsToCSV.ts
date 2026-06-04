import type { Stop } from '@/types';

/**
 * Serialize stops to a CSV string in the `label,lat,lng,demand` format that
 * {@link parseCSVToStops} (and the Upload CSV handler) reads back. This makes
 * the current input dataset downloadable, editable, and re-uploadable without
 * losing the columns the upload path supports.
 *
 * Label values are CSV-escaped (wrapped in double quotes with inner quotes
 * doubled) when they contain a comma, double quote, or newline, so labels like
 * `"Depot, North"` round-trip intact.
 */
export function stopsToCSV(stops: Stop[]): string {
  const header = 'label,lat,lng,demand';
  const rows = stops.map((stop) => {
    const label = escapeCSVField(stop.label ?? `Stop ${stop.id}`);

    return `${label},${stop.lat},${stop.lng},${stop.demand}`;
  });

  return [header, ...rows].join('\n');
}

function escapeCSVField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
