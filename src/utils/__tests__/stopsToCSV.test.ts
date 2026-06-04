import { describe, expect, it } from 'vitest';

import type { Stop } from '@/types';

import { parseCSVToStops } from '../parseCSV';
import { stopsToCSV } from '../stopsToCSV';

describe('stopsToCSV', () => {
  it('emits the label,lat,lng,demand header', () => {
    expect(stopsToCSV([]).split('\n')[0]).toBe('label,lat,lng,demand');
  });

  it('returns only the header for an empty stop list', () => {
    expect(stopsToCSV([])).toBe('label,lat,lng,demand');
  });

  it('serializes a stop row in order', () => {
    const stops: Stop[] = [{ id: 1, lat: 54.5, lng: -1.2, demand: 3, label: 'Depot' }];

    expect(stopsToCSV(stops)).toBe('label,lat,lng,demand\nDepot,54.5,-1.2,3');
  });

  it('falls back to "Stop {id}" when a stop has no label', () => {
    const stops: Stop[] = [{ id: 7, lat: 1, lng: 2, demand: 1 }];

    expect(stopsToCSV(stops)).toContain('Stop 7,1,2,1');
  });

  it('CSV-escapes labels containing commas, quotes, or newlines', () => {
    const stops: Stop[] = [
      { id: 1, lat: 1, lng: 2, demand: 1, label: 'Depot, North' },
      { id: 2, lat: 3, lng: 4, demand: 2, label: 'Say "hi"' },
    ];
    const lines = stopsToCSV(stops).split('\n');

    expect(lines[1]).toBe('"Depot, North",1,2,1');
    expect(lines[2]).toBe('"Say ""hi""",3,4,2');
  });

  it('round-trips through parseCSVToStops (lat/lng/demand/label preserved)', () => {
    const stops: Stop[] = [
      { id: 1, lat: 54.5, lng: -1.2, demand: 3, label: 'Alpha' },
      { id: 2, lat: 40.71, lng: -74.01, demand: 5, label: 'Bravo' },
    ];
    const parsed = parseCSVToStops(stopsToCSV(stops));

    expect(parsed).toHaveLength(2);
    expect(parsed.map((s) => [s.lat, s.lng, s.demand, s.label])).toEqual([
      [54.5, -1.2, 3, 'Alpha'],
      [40.71, -74.01, 5, 'Bravo'],
    ]);
  });
});
