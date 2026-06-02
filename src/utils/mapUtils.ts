import type { LocationWeather, EvStopMetadata } from '@/types';

export function getEvMetadata(metadata?: Record<string, unknown>): EvStopMetadata | null {
  if (!metadata) return null;
  const networkName = typeof metadata.networkName === 'string' ? metadata.networkName : undefined;
  const powerGroup = typeof metadata.powerGroup === 'string' ? metadata.powerGroup : undefined;

  if (!networkName && !powerGroup) return null;

  return { networkName, powerGroup };
}

export function getWeatherIcon(weather: LocationWeather): string {
  const condition = weather.current.conditions[0];

  if (!condition) return '☀️';

  const id = condition.id;

  if (id >= 200 && id < 300) return '⛈️';
  if (id >= 300 && id < 400) return '🌧️';
  if (id >= 500 && id < 600) return '🌧️';
  if (id >= 600 && id < 700) return '❄️';
  if (id >= 700 && id < 800) return '🌫️';
  if (id === 800) return '☀️';
  if (id > 800) return '☁️';

  return '☀️';
}
