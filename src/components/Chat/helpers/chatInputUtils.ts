import type { Stop } from '@/types';

export function parseCSVToStops(csvContent: string): Stop[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map((header) => header.trim());
  const latIdx = headers.findIndex((header) => header === 'lat' || header === 'latitude');
  const lngIdx = headers.findIndex(
    (header) => header === 'lng' || header === 'lon' || header === 'longitude'
  );
  const demandIdx = headers.findIndex(
    (header) => header === 'demand' || header === 'weight' || header === 'quantity'
  );
  const labelIdx = headers.findIndex(
    (header) =>
      header === 'label' || header === 'name' || header === 'address' || header === 'location'
  );

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error('CSV must contain lat/latitude and lng/lon/longitude columns');
  }

  const stops: Stop[] = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const values = lines[lineIdx].split(',').map((value) => value.trim());
    if (values.length <= Math.max(latIdx, lngIdx)) continue;

    const lat = parseFloat(values[latIdx]);
    const lng = parseFloat(values[lngIdx]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    stops.push({
      id: lineIdx,
      lat,
      lng,
      demand: demandIdx !== -1 ? parseInt(values[demandIdx], 10) || 1 : 1,
      label: labelIdx !== -1 ? values[labelIdx] : `Stop ${lineIdx}`,
    });
  }

  return stops;
}
