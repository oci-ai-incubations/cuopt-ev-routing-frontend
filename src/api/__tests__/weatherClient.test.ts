import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authClient, weatherClient } from '@/api';
import type { Stop, WeatherData } from '@/types';

vi.mock('@/api/authClient', () => ({
  authClient: {
    get: vi.fn(),
  },
}));

function makeWeatherData(overrides: Partial<WeatherData> = {}): WeatherData {
  return {
    lat: 51.5,
    lng: -0.1,
    timestamp: new Date(),
    temperature: 15,
    feelsLike: 13,
    humidity: 60,
    windSpeed: 3,
    visibility: 10000,
    cloudCover: 30,
    conditions: [],
    pressure: 1013,
    ...overrides,
  };
}

function makeApiPayload(overrides = {}) {
  return {
    main: { temp: 15, feels_like: 13, humidity: 60, pressure: 1013 },
    wind: { speed: 3 },
    visibility: 10000,
    clouds: { all: 30 },
    weather: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  weatherClient.clearCache();
});

afterEach(() => {
  weatherClient.clearCache();
});

// ─── getWeatherForLocation ────────────────────────────────────────────────────

describe('getWeatherForLocation', () => {
  it('fetches weather for coordinates and transforms response', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });

    const result = await weatherClient.getWeatherForLocation(51.5, -0.1, 'London');

    expect(authClient.get).toHaveBeenCalledWith('/api/weather/current', {
      params: { lat: 51.5, lng: -0.1 },
      timeout: 30000,
    });
    expect(result.current.temperature).toBe(15);
    expect(result.location.name).toBe('London');
  });

  it('returns mock weather data when API call fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(authClient.get).mockRejectedValue(new Error('API down'));

    const result = await weatherClient.getWeatherForLocation(51.5, -0.1);

    consoleSpy.mockRestore();
    expect(result.current).toBeDefined();
    expect(result.forecast).toEqual([]);
  });

  it('returns cached result on second call without extra network request', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });

    await weatherClient.getWeatherForLocation(51.5, -0.1);
    await weatherClient.getWeatherForLocation(51.5, -0.1);

    expect(authClient.get).toHaveBeenCalledOnce();
  });

  it('makes separate requests for coordinates that differ beyond 2 decimal places', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });

    await weatherClient.getWeatherForLocation(51.5, -0.1);
    await weatherClient.getWeatherForLocation(51.51, -0.1);

    expect(authClient.get).toHaveBeenCalledTimes(2);
  });
});

// ─── getWeatherForStops ───────────────────────────────────────────────────────

describe('getWeatherForStops', () => {
  it('returns a map of stopId → LocationWeather', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });

    const stops: Stop[] = [
      { id: 1, lat: 51.5, lng: -0.1, demand: 2 },
      { id: 2, lat: 51.6, lng: -0.2, demand: 3 },
    ];

    const result = await weatherClient.getWeatherForStops(stops);

    expect(result.size).toBe(2);
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(true);
  });

  it('returns empty map for empty stops array', async () => {
    const result = await weatherClient.getWeatherForStops([]);

    expect(result.size).toBe(0);
    expect(authClient.get).not.toHaveBeenCalled();
  });
});

// ─── assessAdverseConditions ──────────────────────────────────────────────────

describe('assessAdverseConditions', () => {
  it('returns level=none with multiplier=1 for normal conditions', () => {
    const weather = makeWeatherData();
    const result = weatherClient.assessAdverseConditions(weather);

    expect(result.level).toBe('none');
    expect(result.travelTimeMultiplier).toBe(1.0);
    expect(result.safetyScore).toBe(100);
  });

  it('detects severe wind and sets level=severe', () => {
    const weather = makeWeatherData({ windSpeed: 30 }); // ≥ severe threshold
    const result = weatherClient.assessAdverseConditions(weather);

    const windFactor = result.factors.find((f) => f.type === 'wind');

    expect(windFactor?.severity).toBe('severe');
    expect(result.level).toBe('severe');
    expect(result.travelTimeMultiplier).toBe(2.0);
    expect(result.safetyScore).toBe(15);
  });

  it('detects dense fog when visibility is very low', () => {
    const weather = makeWeatherData({ visibility: 50 }); // ≤ 100 m
    const result = weatherClient.assessAdverseConditions(weather);

    const fogFactor = result.factors.find((f) => f.type === 'fog');

    expect(fogFactor).toBeDefined();
    expect(fogFactor?.severity).toBe('severe');
  });

  it('detects heavy rain', () => {
    const weather = makeWeatherData({ rain1h: 10 }); // ≥ heavy threshold
    const result = weatherClient.assessAdverseConditions(weather);

    const rainFactor = result.factors.find((f) => f.type === 'rain');

    expect(rainFactor).toBeDefined();
    expect(rainFactor?.severity).toBe('high');
  });

  it('detects heavy snow', () => {
    const weather = makeWeatherData({ snow1h: 5 }); // ≥ heavy threshold
    const result = weatherClient.assessAdverseConditions(weather);

    const snowFactor = result.factors.find((f) => f.type === 'snow');

    expect(snowFactor).toBeDefined();
  });

  it('detects ice risk near freezing temperature', () => {
    const weather = makeWeatherData({ temperature: 1 });
    const result = weatherClient.assessAdverseConditions(weather);

    const iceFactor = result.factors.find((f) => f.type === 'ice');

    expect(iceFactor).toBeDefined();
  });

  it('detects heat advisory at high temperature', () => {
    const weather = makeWeatherData({ temperature: 38 });
    const result = weatherClient.assessAdverseConditions(weather);

    const heatFactor = result.factors.find((f) => f.type === 'heat');

    expect(heatFactor).toBeDefined();
  });

  it('detects thunderstorm from weather condition code', () => {
    const weather = makeWeatherData({
      conditions: [{ id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' }],
    });
    const result = weatherClient.assessAdverseConditions(weather);

    const stormFactor = result.factors.find((f) => f.type === 'storm');

    expect(stormFactor).toBeDefined();
    expect(stormFactor?.severity).toBe('severe');
  });

  it('generates skip recommendation for severe conditions', () => {
    const weather = makeWeatherData({ windSpeed: 30 });
    const result = weatherClient.assessAdverseConditions(weather);

    expect(result.recommendations.some((r) => /postponing/i.test(r))).toBe(true);
  });

  it('generates fog-specific recommendations', () => {
    const weather = makeWeatherData({ visibility: 50 });
    const result = weatherClient.assessAdverseConditions(weather);

    expect(result.recommendations.some((r) => /fog/i.test(r))).toBe(true);
  });

  it('generates snow/ice recommendations for cold conditions', () => {
    const weather = makeWeatherData({ snow1h: 5, temperature: -2 });
    const result = weatherClient.assessAdverseConditions(weather);

    expect(result.recommendations.some((r) => /winter/i.test(r))).toBe(true);
  });
});

// ─── getRoutingImpact ─────────────────────────────────────────────────────────

describe('getRoutingImpact', () => {
  it('returns routing impacts for each stop', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });

    const stops: Stop[] = [{ id: 1, lat: 51.5, lng: -0.1, demand: 2, label: 'Stop A' }];

    const impacts = await weatherClient.getRoutingImpact(stops);

    expect(impacts).toHaveLength(1);
    expect(impacts[0].stopId).toBe(1);
    expect(impacts[0].stopName).toBe('Stop A');
    expect(impacts[0].assessment).toBeDefined();
    expect(typeof impacts[0].estimatedDelay).toBe('number');
    expect(typeof impacts[0].skipRecommended).toBe('boolean');
  });
});

// ─── setConfig / clearCache ───────────────────────────────────────────────────

describe('setConfig', () => {
  it('merges partial config without overwriting other values', async () => {
    weatherClient.setConfig({ cacheTimeout: 5 * 60 * 1000 } as never);

    // No error thrown means config merge succeeded
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });
    await expect(weatherClient.getWeatherForLocation(51.0, -0.5)).resolves.toBeDefined();
  });
});

describe('clearCache', () => {
  it('forces a fresh API call after clearing the cache', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ data: makeApiPayload() });

    await weatherClient.getWeatherForLocation(51.5, -0.1);
    weatherClient.clearCache();
    await weatherClient.getWeatherForLocation(51.5, -0.1);

    expect(authClient.get).toHaveBeenCalledTimes(2);
  });
});
