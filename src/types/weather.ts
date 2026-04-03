// Weather Types for Adverse Condition Planning

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherData {
  lat: number;
  lng: number;
  timestamp: Date;
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // %
  windSpeed: number; // m/s
  windGust?: number; // m/s
  visibility: number; // meters
  cloudCover: number; // %
  conditions: WeatherCondition[];
  rain1h?: number; // mm
  snow1h?: number; // mm
  pressure: number; // hPa
}

export interface WeatherAlert {
  id: string;
  event: string;
  sender: string;
  start: Date;
  end: Date;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  areas: string[];
}

export interface WeatherForecast {
  timestamp: Date;
  temperature: number;
  conditions: WeatherCondition[];
  windSpeed: number;
  precipitation: number; // mm
  precipitationProbability: number; // %
}

export interface LocationWeather {
  location: {
    lat: number;
    lng: number;
    name?: string;
    postcode?: string;
  };
  current: WeatherData;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
}

// Adverse condition severity levels
export type AdverseConditionLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';

export interface AdverseConditionAssessment {
  level: AdverseConditionLevel;
  factors: AdverseConditionFactor[];
  travelTimeMultiplier: number; // 1.0 = normal, 1.5 = 50% longer
  safetyScore: number; // 0-100, 100 = safest
  recommendations: string[];
}

export interface AdverseConditionFactor {
  type: 'rain' | 'snow' | 'ice' | 'wind' | 'fog' | 'storm' | 'heat' | 'flood';
  severity: AdverseConditionLevel;
  description: string;
  impact: string;
}

// Weather impact on routing
export interface WeatherRoutingImpact {
  stopId: number;
  stopName: string;
  postcode: string;
  weather: WeatherData;
  assessment: AdverseConditionAssessment;
  estimatedDelay: number; // minutes
  skipRecommended: boolean;
}

// Weather impact scope - how weather adjustments are applied
export type WeatherImpactScope = 'per_stop' | 'per_route' | 'global';

// Weather config
export interface WeatherConfig {
  enabled: boolean;
  apiKey?: string;
  updateIntervalMs: number;
  forecastHours: number;
  // Impact scope: 'per_stop' = each stop gets its own weather adjustment
  //               'per_route' = average weather conditions across each vehicle's route
  //               'global' = same adjustment applied to all routes
  impactScope: WeatherImpactScope;
  adverseConditionThresholds: {
    windSpeedHigh: number; // m/s
    windSpeedSevere: number;
    visibilityLow: number; // meters
    visibilityPoor: number;
    rainHeavy: number; // mm/h
    snowHeavy: number;
    temperatureFreeze: number; // Celsius
    temperatureHeat: number;
  };
}

// Default thresholds for UK conditions
export const DEFAULT_WEATHER_CONFIG: WeatherConfig = {
  enabled: true,
  updateIntervalMs: 15 * 60 * 1000, // 15 minutes
  forecastHours: 24,
  impactScope: 'per_stop', // Default: calculate weather impact for each stop location
  adverseConditionThresholds: {
    windSpeedHigh: 10, // ~22 mph
    windSpeedSevere: 17, // ~38 mph (gale force)
    visibilityLow: 1000, // 1km
    visibilityPoor: 200, // 200m (fog)
    rainHeavy: 4, // mm/h
    snowHeavy: 2, // mm/h
    temperatureFreeze: 2, // Celsius (ice risk)
    temperatureHeat: 30, // Celsius (heat advisory)
  },
};

// Map weather condition codes to adverse levels
export const WEATHER_CONDITION_SEVERITY: Record<string, AdverseConditionLevel> = {
  // Thunderstorm
  '2xx': 'severe',
  // Drizzle
  '3xx': 'low',
  // Rain
  '500': 'low', // light rain
  '501': 'moderate', // moderate rain
  '502': 'high', // heavy rain
  '503': 'severe', // very heavy rain
  '504': 'severe', // extreme rain
  '511': 'severe', // freezing rain
  // Snow
  '600': 'moderate', // light snow
  '601': 'high', // snow
  '602': 'severe', // heavy snow
  '611': 'high', // sleet
  '615': 'high', // light rain and snow
  '616': 'severe', // rain and snow
  // Atmosphere
  '701': 'low', // mist
  '711': 'moderate', // smoke
  '721': 'low', // haze
  '731': 'moderate', // dust
  '741': 'high', // fog
  '751': 'moderate', // sand
  '761': 'moderate', // dust
  '762': 'severe', // volcanic ash
  '771': 'severe', // squalls
  '781': 'severe', // tornado
  // Clear/Clouds
  '800': 'none', // clear
  '801': 'none', // few clouds
  '802': 'none', // scattered clouds
  '803': 'none', // broken clouds
  '804': 'none', // overcast
};
