import axios, { AxiosInstance } from 'axios';
import type {
  WeatherData,
  LocationWeather,
  AdverseConditionAssessment,
  AdverseConditionFactor,
  AdverseConditionLevel,
  WeatherRoutingImpact,
  WeatherConfig,
} from '@/types/weather';
import {
  DEFAULT_WEATHER_CONFIG,
  WEATHER_CONDITION_SEVERITY,
} from '@/types/weather';
import type { Stop } from '@/types';

class WeatherClient {
  private client: AxiosInstance;
  private cache: Map<string, { data: LocationWeather; timestamp: number }> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes
  private config: WeatherConfig;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/weather',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.config = { ...DEFAULT_WEATHER_CONFIG };
  }

  setConfig(config: Partial<WeatherConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private getCacheKey(lat: number, lng: number): string {
    // Round to 2 decimal places for caching (about 1km precision)
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  async getWeatherForLocation(lat: number, lng: number, name?: string): Promise<LocationWeather> {
    const cacheKey = this.getCacheKey(lat, lng);

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const response = await this.client.get('/current', {
        params: { lat, lng },
      });

      const data = response.data;
      const locationWeather = this.transformApiResponse(data, lat, lng, name);

      // Cache the result
      this.cache.set(cacheKey, {
        data: locationWeather,
        timestamp: Date.now(),
      });

      return locationWeather;
    } catch (error) {
      console.error('Weather API error:', error);
      // Return mock data if API fails
      return this.getMockWeather(lat, lng, name);
    }
  }

  async getWeatherForStops(stops: Stop[]): Promise<Map<number, LocationWeather>> {
    const weatherMap = new Map<number, LocationWeather>();

    // Batch requests with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < stops.length; i += batchSize) {
      const batch = stops.slice(i, i + batchSize);
      const promises = batch.map((stop) =>
        this.getWeatherForLocation(stop.lat, stop.lng, stop.label).then((weather) => ({
          stopId: stop.id,
          weather,
        }))
      );

      const results = await Promise.allSettled(promises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          weatherMap.set(result.value.stopId, result.value.weather);
        }
      });
    }

    return weatherMap;
  }

  assessAdverseConditions(weather: WeatherData): AdverseConditionAssessment {
    const factors: AdverseConditionFactor[] = [];
    const thresholds = this.config.adverseConditionThresholds;

    // Check wind conditions
    if (weather.windSpeed >= thresholds.windSpeedSevere) {
      factors.push({
        type: 'wind',
        severity: 'severe',
        description: `Severe winds: ${Math.round(weather.windSpeed * 2.237)} mph`,
        impact: 'High vehicle instability risk. Consider postponing non-essential routes.',
      });
    } else if (weather.windSpeed >= thresholds.windSpeedHigh) {
      factors.push({
        type: 'wind',
        severity: 'moderate',
        description: `Strong winds: ${Math.round(weather.windSpeed * 2.237)} mph`,
        impact: 'Reduced vehicle stability. Extra caution on exposed roads.',
      });
    }

    // Check visibility
    if (weather.visibility <= thresholds.visibilityPoor) {
      factors.push({
        type: 'fog',
        severity: 'severe',
        description: `Dense fog: ${weather.visibility}m visibility`,
        impact: 'Severely reduced visibility. Significant delays expected.',
      });
    } else if (weather.visibility <= thresholds.visibilityLow) {
      factors.push({
        type: 'fog',
        severity: 'moderate',
        description: `Reduced visibility: ${weather.visibility}m`,
        impact: 'Poor visibility conditions. Drive with extra caution.',
      });
    }

    // Check rain
    if (weather.rain1h) {
      if (weather.rain1h >= thresholds.rainHeavy) {
        factors.push({
          type: 'rain',
          severity: 'high',
          description: `Heavy rain: ${weather.rain1h}mm/h`,
          impact: 'Risk of flooding and aquaplaning. Avoid low-lying routes.',
        });
      } else if (weather.rain1h >= 1) {
        factors.push({
          type: 'rain',
          severity: 'moderate',
          description: `Moderate rain: ${weather.rain1h}mm/h`,
          impact: 'Wet road surfaces. Increased stopping distances.',
        });
      }
    }

    // Check snow
    if (weather.snow1h) {
      if (weather.snow1h >= thresholds.snowHeavy) {
        factors.push({
          type: 'snow',
          severity: 'severe',
          description: `Heavy snow: ${weather.snow1h}mm/h`,
          impact: 'Hazardous driving conditions. Routes may be impassable.',
        });
      } else if (weather.snow1h > 0) {
        factors.push({
          type: 'snow',
          severity: 'high',
          description: `Snowfall: ${weather.snow1h}mm/h`,
          impact: 'Slippery roads. Significant delays expected.',
        });
      }
    }

    // Check ice risk
    if (weather.temperature <= thresholds.temperatureFreeze) {
      factors.push({
        type: 'ice',
        severity: weather.temperature <= 0 ? 'high' : 'moderate',
        description: `Near freezing: ${weather.temperature}°C`,
        impact: 'Risk of ice on roads. Extra caution required, especially on bridges.',
      });
    }

    // Check heat
    if (weather.temperature >= thresholds.temperatureHeat) {
      factors.push({
        type: 'heat',
        severity: 'moderate',
        description: `High temperature: ${weather.temperature}°C`,
        impact: 'Heat advisory. Ensure vehicle AC is functional. Watch for overheating.',
      });
    }

    // Check weather condition codes
    weather.conditions.forEach((condition) => {
      const codePrefix = condition.id.toString().substring(0, 1) + 'xx';
      const severity = WEATHER_CONDITION_SEVERITY[condition.id.toString()] ||
                       WEATHER_CONDITION_SEVERITY[codePrefix];

      if (severity === 'severe' && condition.id >= 200 && condition.id < 300) {
        factors.push({
          type: 'storm',
          severity: 'severe',
          description: `Thunderstorm: ${condition.description}`,
          impact: 'Lightning risk. Avoid outdoor activities during stops.',
        });
      }
    });

    // Calculate overall level
    let level: AdverseConditionLevel = 'none';
    if (factors.some((f) => f.severity === 'severe')) {
      level = 'severe';
    } else if (factors.some((f) => f.severity === 'high')) {
      level = 'high';
    } else if (factors.some((f) => f.severity === 'moderate')) {
      level = 'moderate';
    } else if (factors.length > 0) {
      level = 'low';
    }

    // Calculate travel time multiplier
    const multipliers: Record<AdverseConditionLevel, number> = {
      none: 1.0,
      low: 1.1,
      moderate: 1.25,
      high: 1.5,
      severe: 2.0,
    };
    const travelTimeMultiplier = multipliers[level];

    // Calculate safety score
    const safetyScores: Record<AdverseConditionLevel, number> = {
      none: 100,
      low: 85,
      moderate: 65,
      high: 40,
      severe: 15,
    };
    const safetyScore = safetyScores[level];

    // Generate recommendations
    const recommendations = this.generateRecommendations(level, factors);

    return {
      level,
      factors,
      travelTimeMultiplier,
      safetyScore,
      recommendations,
    };
  }

  private generateRecommendations(
    level: AdverseConditionLevel,
    factors: AdverseConditionFactor[]
  ): string[] {
    const recommendations: string[] = [];

    if (level === 'severe') {
      recommendations.push('Consider postponing non-critical routes');
      recommendations.push('Ensure all drivers have emergency contact information');
    }

    if (level === 'high' || level === 'severe') {
      recommendations.push('Add buffer time to all scheduled appointments');
      recommendations.push('Brief drivers on current conditions before departure');
    }

    if (factors.some((f) => f.type === 'ice' || f.type === 'snow')) {
      recommendations.push('Ensure vehicles have winter tyres or chains');
      recommendations.push('Avoid steep hills and exposed elevated roads');
    }

    if (factors.some((f) => f.type === 'fog')) {
      recommendations.push('Use fog lights and reduce speed');
      recommendations.push('Maintain larger following distances');
    }

    if (factors.some((f) => f.type === 'rain' || f.type === 'flood')) {
      recommendations.push('Avoid routes known for flooding');
      recommendations.push('Do not drive through standing water');
    }

    if (factors.some((f) => f.type === 'wind')) {
      recommendations.push('Extra caution on bridges and open roads');
      recommendations.push('Watch for debris on roads');
    }

    if (recommendations.length === 0) {
      recommendations.push('Conditions are suitable for normal operations');
    }

    return recommendations;
  }

  async getRoutingImpact(stops: Stop[]): Promise<WeatherRoutingImpact[]> {
    const weatherMap = await this.getWeatherForStops(stops);
    const impacts: WeatherRoutingImpact[] = [];

    stops.forEach((stop) => {
      const weather = weatherMap.get(stop.id);
      if (weather) {
        const assessment = this.assessAdverseConditions(weather.current);
        impacts.push({
          stopId: stop.id,
          stopName: stop.label || `Stop ${stop.id}`,
          postcode: stop.postcode || '',
          weather: weather.current,
          assessment,
          estimatedDelay: Math.round((assessment.travelTimeMultiplier - 1) * 30), // Base 30 min per stop
          skipRecommended: assessment.level === 'severe',
        });
      }
    });

    return impacts;
  }

  private transformApiResponse(
    data: any,
    lat: number,
    lng: number,
    name?: string
  ): LocationWeather {
    const current: WeatherData = {
      lat,
      lng,
      timestamp: new Date(),
      temperature: data.main?.temp || 15,
      feelsLike: data.main?.feels_like || 15,
      humidity: data.main?.humidity || 50,
      windSpeed: data.wind?.speed || 0,
      windGust: data.wind?.gust,
      visibility: data.visibility || 10000,
      cloudCover: data.clouds?.all || 0,
      conditions: data.weather || [],
      rain1h: data.rain?.['1h'],
      snow1h: data.snow?.['1h'],
      pressure: data.main?.pressure || 1013,
    };

    return {
      location: { lat, lng, name },
      current,
      forecast: [],
      alerts: data.alerts || [],
    };
  }

  private getMockWeather(lat: number, lng: number, name?: string): LocationWeather {
    // Generate realistic mock weather based on geographic location
    const absLat = Math.abs(lat);
    const now = new Date();
    const month = now.getMonth(); // 0-11

    // Determine if it's summer or winter in this hemisphere
    const isSouthernHemisphere = lat < 0;
    const isSummerMonths = month >= 4 && month <= 9; // May-Oct
    const isLocalSummer = isSouthernHemisphere ? !isSummerMonths : isSummerMonths;

    // Base temperature by latitude zone (annual average)
    let baseTemp: number;
    let humidity: number;
    let conditions: Array<{ id: number; main: string; description: string; icon: string }>;

    if (absLat < 15) {
      // Tropical (0-15°): Hot and humid year-round
      baseTemp = 28 + Math.random() * 5;
      humidity = 70 + Math.floor(Math.random() * 20);
      conditions = Math.random() > 0.6
        ? [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }]
        : [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }];
    } else if (absLat < 30) {
      // Subtropical (15-30°): Warm, seasonal variation
      baseTemp = isLocalSummer ? 30 + Math.random() * 5 : 18 + Math.random() * 6;
      humidity = 50 + Math.floor(Math.random() * 25);
      conditions = [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }];
    } else if (absLat < 45) {
      // Mediterranean/Temperate warm (30-45°): Distinct seasons
      baseTemp = isLocalSummer ? 25 + Math.random() * 8 : 8 + Math.random() * 8;
      humidity = 45 + Math.floor(Math.random() * 30);
      conditions = isLocalSummer
        ? [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }]
        : [{ id: 803, main: 'Clouds', description: 'broken clouds', icon: '04d' }];
    } else if (absLat < 60) {
      // Temperate (45-60°): Cool, often cloudy (UK, Northern Europe, Canada)
      baseTemp = isLocalSummer ? 18 + Math.random() * 8 : 2 + Math.random() * 8;
      humidity = 60 + Math.floor(Math.random() * 25);
      conditions = Math.random() > 0.5
        ? [{ id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' }]
        : [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }];
    } else {
      // Subarctic/Arctic (60°+): Cold
      baseTemp = isLocalSummer ? 10 + Math.random() * 8 : -10 + Math.random() * 10;
      humidity = 70 + Math.floor(Math.random() * 20);
      conditions = isLocalSummer
        ? [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }]
        : [{ id: 600, main: 'Snow', description: 'light snow', icon: '13d' }];
    }

    // Add slight random variation
    const tempVariation = (Math.random() - 0.5) * 4;
    const finalTemp = baseTemp + tempVariation;

    const current: WeatherData = {
      lat,
      lng,
      timestamp: new Date(),
      temperature: Math.round(finalTemp * 10) / 10,
      feelsLike: Math.round((finalTemp - 2) * 10) / 10,
      humidity,
      windSpeed: 2 + Math.random() * 6,
      visibility: 10000,
      cloudCover: 20 + Math.floor(Math.random() * 50),
      conditions,
      pressure: 1013 + Math.floor(Math.random() * 20) - 10,
    };

    return {
      location: { lat, lng, name },
      current,
      forecast: [],
      alerts: [],
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const weatherClient = new WeatherClient();
export default weatherClient;
