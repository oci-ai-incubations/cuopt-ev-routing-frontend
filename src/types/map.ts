import type { AdverseConditionAssessment, LocationWeather } from '@/types/weather';

export type MapStyleId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export interface MapStyleOption {
  id: MapStyleId;
  name: string;
  description: string;
}

export interface RouteDirections {
  vehicleId: number;
  directions: google.maps.DirectionsResult | null;
  color: string;
  additionalSegments?: google.maps.DirectionsResult[];
}

export interface StopWeatherData {
  stopId: number;
  weather: LocationWeather;
  assessment: AdverseConditionAssessment;
}

export interface EvStopMetadata {
  networkName?: string;
  powerGroup?: string;
}
