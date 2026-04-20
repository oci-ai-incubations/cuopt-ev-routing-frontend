import { create } from 'zustand';

import { weatherClient } from '@/api/weatherClient';
import {
  DEFAULT_WEATHER_CONFIG,
  type AdverseConditionAssessment,
  type LocationWeather,
  type Stop,
  type WeatherConfig,
  type WeatherRoutingImpact,
} from '@/types';

interface WeatherState {
  // Weather data
  weatherByStop: Map<number, LocationWeather>;
  routingImpacts: WeatherRoutingImpact[];
  overallAssessment: AdverseConditionAssessment | null;

  // Loading states
  isLoading: boolean;
  lastUpdate: Date | null;
  error: string | null;

  // Config
  config: WeatherConfig;
  enabled: boolean;

  // Actions
  fetchWeatherForStops: (stops: Stop[]) => Promise<void>;
  fetchRoutingImpacts: (stops: Stop[]) => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  setConfig: (config: Partial<WeatherConfig>) => void;
  clearWeather: () => void;
  getWeatherForStop: (stopId: number) => LocationWeather | undefined;
  getImpactForStop: (stopId: number) => WeatherRoutingImpact | undefined;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  // Initial state
  weatherByStop: new Map(),
  routingImpacts: [],
  overallAssessment: null,
  isLoading: false,
  lastUpdate: null,
  error: null,
  config: { ...DEFAULT_WEATHER_CONFIG },
  enabled: true,

  // Fetch weather for all stops
  fetchWeatherForStops: async (stops: Stop[]) => {
    if (!get().enabled || stops.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const weatherMap = await weatherClient.getWeatherForStops(stops);
      set({
        weatherByStop: weatherMap,
        lastUpdate: new Date(),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch weather',
        isLoading: false,
      });
    }
  },

  // Fetch routing impacts with adverse condition assessment
  fetchRoutingImpacts: async (stops: Stop[]) => {
    if (!get().enabled || stops.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const impacts = await weatherClient.getRoutingImpact(stops);

      // Calculate overall assessment
      let worstLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe' = 'none';
      const levelOrder = ['none', 'low', 'moderate', 'high', 'severe'];

      impacts.forEach((impact) => {
        const currentIndex = levelOrder.indexOf(impact.assessment.level);
        const worstIndex = levelOrder.indexOf(worstLevel);
        if (currentIndex > worstIndex) {
          worstLevel = impact.assessment.level;
        }
      });

      // Aggregate all factors
      const allFactors = impacts.flatMap((i) => i.assessment.factors);
      const uniqueFactors = allFactors.filter(
        (f, i, arr) => arr.findIndex((x) => x.type === f.type && x.severity === f.severity) === i
      );

      // Calculate average multiplier
      const avgMultiplier =
        impacts.length > 0
          ? impacts.reduce((sum, i) => sum + i.assessment.travelTimeMultiplier, 0) / impacts.length
          : 1.0;

      // Calculate average safety score
      const avgSafety =
        impacts.length > 0
          ? impacts.reduce((sum, i) => sum + i.assessment.safetyScore, 0) / impacts.length
          : 100;

      // Aggregate recommendations
      const allRecommendations = [...new Set(impacts.flatMap((i) => i.assessment.recommendations))];

      const overallAssessment: AdverseConditionAssessment = {
        level: worstLevel,
        factors: uniqueFactors,
        travelTimeMultiplier: Math.round(avgMultiplier * 100) / 100,
        safetyScore: Math.round(avgSafety),
        recommendations: allRecommendations.slice(0, 5),
      };

      set({
        routingImpacts: impacts,
        overallAssessment,
        lastUpdate: new Date(),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to assess conditions',
        isLoading: false,
      });
    }
  },

  setEnabled: (enabled: boolean) => {
    set({ enabled });
    if (!enabled) {
      set({
        weatherByStop: new Map(),
        routingImpacts: [],
        overallAssessment: null,
      });
    }
  },

  setConfig: (config: Partial<WeatherConfig>) => {
    set({ config: { ...get().config, ...config } });
    weatherClient.setConfig(config);
  },

  clearWeather: () => {
    set({
      weatherByStop: new Map(),
      routingImpacts: [],
      overallAssessment: null,
      lastUpdate: null,
      error: null,
    });
    weatherClient.clearCache();
  },

  getWeatherForStop: (stopId: number) => {
    return get().weatherByStop.get(stopId);
  },

  getImpactForStop: (stopId: number) => {
    return get().routingImpacts.find((i) => i.stopId === stopId);
  },
}));
