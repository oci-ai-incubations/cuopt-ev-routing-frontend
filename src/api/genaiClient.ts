import axios, { type AxiosInstance } from 'axios';

import {
  CUOPT_SCHEMA_PROMPT,
  CUOPT_RESPONSE_PROMPT,
  type ChatResponse,
  type CuOptRequest,
  type CuOptResponse,
  type Message,
  type ModelId,
  type ModelInfo,
  type Stop,
} from '@/types';

class GenAIClient {
  private client: AxiosInstance;
  private model: ModelId = '';
  private maxTokens = 4096;
  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setModel(model: ModelId): void {
    this.model = model;
  }

  async fetchModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.get<{ data: ModelInfo[] }>('/models');
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/genai/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async chat(
    messages: Message[],
    systemPrompt?: string
  ): Promise<{ content: string; tokensUsed: number }> {
    const payload = this.buildPayloadForChat(messages, systemPrompt);

    const response = await this.client.post<ChatResponse>('/genai/chat', payload);
    const data = response.data;

    let content = '';
    if (data.chatResponse.text) {
      content = data.chatResponse.text;
    } else if (data.chatResponse.choices?.[0]?.message?.content) {
      content = data.chatResponse.choices[0].message.content
        .filter((c) => c.type === 'TEXT')
        .map((c) => c.text)
        .join('');
    }

    return {
      content,
      tokensUsed:
        (data.usageMetadata?.inputTokenCount || 0) +
        (data.usageMetadata?.outputTokenCount || 0),
    };
  }

  // Intent classification - determine if message is a question or optimization request
  async classifyIntent(userMessage: string): Promise<{
    intent: 'optimization' | 'question' | 'greeting' | 'unclear';
    confidence: number;
    answer?: string;
  }> {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Only intercept obvious greetings locally
    const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|greetings)\s*[!.]?\s*$/i;
    if (greetingPatterns.test(lowerMessage)) {
      return { intent: 'greeting', confidence: 0.95 };
    }

    // If it has numbers + optimization keywords, it's clearly an optimization request
    const optimizationKeywords = /(optimize|deliver|route|vehicle|stop|location|cluster|parallel|dispatch|schedule|pickup|drop|fleet|driver|technician|job|service)/i;
    if (optimizationKeywords.test(lowerMessage) && /\d+/.test(lowerMessage)) {
      return { intent: 'optimization', confidence: 0.9 };
    }

    // If it has numbers + location terms, likely optimization
    if (/\d+/.test(lowerMessage) && /(uk|london|manchester|birmingham|city|region|area|across)/i.test(lowerMessage)) {
      return { intent: 'optimization', confidence: 0.8 };
    }

    // For everything else, ask the LLM to classify and answer
    try {
      const response = await this.chat(
        [{ id: '1', role: 'user', content: userMessage, timestamp: new Date() }],
        `You are a cuOPT route optimization assistant. The user has sent a message.
Determine if it is:
1. An optimization request (wants to run a route optimization with stops/vehicles/locations) — respond with exactly: INTENT:optimization
2. A general question — answer it directly and helpfully. Focus on route optimization, logistics, cuOPT, and VRP topics but answer any reasonable question.

If it is a question, just answer it naturally. Do NOT prefix your answer with "INTENT:question".
If it is an optimization request, respond with exactly "INTENT:optimization" and nothing else.`
      );

      const text = response.content.trim();
      if (text.startsWith('INTENT:optimization')) {
        return { intent: 'optimization', confidence: 0.85 };
      }

      // LLM answered the question directly
      return { intent: 'question', confidence: 0.9, answer: text };
    } catch {
      // If LLM call fails, default to optimization attempt
      return { intent: 'optimization', confidence: 0.6 };
    }
  }

  async convertPromptToCuOpt(userMessage: string): Promise<{
    request: CuOptRequest | null;
    interpretation: string;
    error?: string;
    numStops?: number;
    numVehicles?: number;
    useParallel?: boolean;
    numClusters?: number;
    stops?: Stop[];
    location?: string;
  }> {
    const systemPrompt = CUOPT_SCHEMA_PROMPT;

    try {
      const response = await this.chat(
        [{ id: '1', role: 'user', content: userMessage, timestamp: new Date() }],
        systemPrompt
      );

      const content = response.content;

      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          request: null,
          interpretation: content,
          error: 'Could not extract parameters from response',
        };
      }

      const params = JSON.parse(jsonMatch[0]);

      // Extract parameters with defaults
      const numStops = params.num_stops || 50;
      const numVehicles = params.num_vehicles || 5;
      const timeLimit = params.time_limit || 30;
      const location = params.location || 'United Kingdom';
      const forceAllVehicles = params.force_all_vehicles || false;
      const balanceWorkload = params.balance_workload || false;
      const maxRouteHours = params.max_route_hours || 8;

      // Calculate capacity - ensure it's sufficient for the problem
      let vehicleCapacity = params.vehicle_capacity || 100;

      // Calculate minimum required capacity:
      // - Max single stop demand is ~10
      // - Total demand = numStops * avg_demand (~5.5)
      // - Each vehicle must handle at least (total_demand / num_vehicles)
      const avgDemand = 5.5; // Average demand per stop (range 1-10)
      const maxSingleDemand = 10;
      const totalDemand = Math.ceil(numStops * avgDemand);
      const minCapacityPerVehicle = Math.ceil(totalDemand / numVehicles) + 5; // +5 buffer
      const minCapacity = Math.max(maxSingleDemand, minCapacityPerVehicle);

      // Ensure capacity is sufficient
      if (vehicleCapacity < minCapacity) {
        vehicleCapacity = minCapacity;
      }

      // For service/maintenance tasks or when user wants balanced workload,
      // set capacity to force distribution across vehicles
      const shouldBalance = forceAllVehicles || balanceWorkload;
      if (shouldBalance) {
        // Set capacity so stops are distributed across all vehicles
        // This forces the optimizer to use multiple vehicles
        vehicleCapacity = minCapacityPerVehicle;
      }

      // Extract parallel processing parameters
      // Auto-enable parallel if explicitly requested or if stops >= 500
      const useParallel = params.use_parallel === true || numStops >= 500;
      const numClusters = params.num_clusters || (useParallel ? Math.min(Math.ceil(numStops / 500), 8) : null);

      // Generate interpretation with parallel info
      const parallelInfo = useParallel ? ` Using parallel processing with ${numClusters} clusters.` : '';
      const distributeInfo = shouldBalance ? ` Balancing workload across all ${numVehicles} vehicles (max ${maxRouteHours}h per driver).` : '';
      const interpretation = `Optimizing ${numStops} deliveries with ${numVehicles} vehicles in ${location}. Vehicle capacity: ${vehicleCapacity} units. Solver time limit: ${timeLimit}s.${parallelInfo}${distributeInfo}`;

      // Location coordinates lookup for cities/regions worldwide
      const locationCoords: Record<string, { lat: number; lng: number; radius: number }> = {
        // UK Cities
        'london': { lat: 51.5074, lng: -0.1278, radius: 30 },
        'greater london': { lat: 51.5074, lng: -0.1278, radius: 40 },
        'manchester': { lat: 53.4808, lng: -2.2426, radius: 25 },
        'birmingham': { lat: 52.4862, lng: -1.8904, radius: 25 },
        'leeds': { lat: 53.8008, lng: -1.5491, radius: 20 },
        'glasgow': { lat: 55.8642, lng: -4.2518, radius: 25 },
        'edinburgh': { lat: 55.9533, lng: -3.1883, radius: 20 },
        'liverpool': { lat: 53.4084, lng: -2.9916, radius: 20 },
        'bristol': { lat: 51.4545, lng: -2.5879, radius: 20 },
        'sheffield': { lat: 53.3811, lng: -1.4701, radius: 20 },
        'newcastle': { lat: 54.9783, lng: -1.6178, radius: 20 },
        'nottingham': { lat: 52.9548, lng: -1.1581, radius: 20 },
        'cardiff': { lat: 51.4816, lng: -3.1791, radius: 20 },
        'belfast': { lat: 54.5973, lng: -5.9301, radius: 20 },
        'midlands': { lat: 52.6369, lng: -1.1398, radius: 60 },
        'scotland': { lat: 56.4907, lng: -4.2026, radius: 150 },
        'wales': { lat: 52.1307, lng: -3.7837, radius: 100 },
        'south east': { lat: 51.3, lng: 0.5, radius: 80 },
        'north west': { lat: 53.8, lng: -2.6, radius: 80 },
        'united kingdom': { lat: 54.5, lng: -2.0, radius: 300 },
        'uk': { lat: 54.5, lng: -2.0, radius: 300 },
        // France
        'paris': { lat: 48.8566, lng: 2.3522, radius: 25 },
        'lyon': { lat: 45.7640, lng: 4.8357, radius: 20 },
        'marseille': { lat: 43.2965, lng: 5.3698, radius: 20 },
        'toulouse': { lat: 43.6047, lng: 1.4442, radius: 20 },
        'nice': { lat: 43.7102, lng: 7.2620, radius: 15 },
        'bordeaux': { lat: 44.8378, lng: -0.5792, radius: 20 },
        'lille': { lat: 50.6292, lng: 3.0573, radius: 20 },
        'france': { lat: 46.6034, lng: 1.8883, radius: 400 },
        // Germany
        'berlin': { lat: 52.5200, lng: 13.4050, radius: 30 },
        'munich': { lat: 48.1351, lng: 11.5820, radius: 25 },
        'frankfurt': { lat: 50.1109, lng: 8.6821, radius: 25 },
        'hamburg': { lat: 53.5511, lng: 9.9937, radius: 25 },
        'cologne': { lat: 50.9375, lng: 6.9603, radius: 20 },
        'düsseldorf': { lat: 51.2277, lng: 6.7735, radius: 20 },
        'germany': { lat: 51.1657, lng: 10.4515, radius: 400 },
        // USA
        'new york': { lat: 40.7128, lng: -74.0060, radius: 30 },
        'nyc': { lat: 40.7128, lng: -74.0060, radius: 30 },
        'los angeles': { lat: 34.0522, lng: -118.2437, radius: 40 },
        'chicago': { lat: 41.8781, lng: -87.6298, radius: 30 },
        'houston': { lat: 29.7604, lng: -95.3698, radius: 35 },
        'phoenix': { lat: 33.4484, lng: -112.0740, radius: 35 },
        'san francisco': { lat: 37.7749, lng: -122.4194, radius: 25 },
        'seattle': { lat: 47.6062, lng: -122.3321, radius: 25 },
        'miami': { lat: 25.7617, lng: -80.1918, radius: 25 },
        'usa': { lat: 39.8283, lng: -98.5795, radius: 2000 },
        'united states': { lat: 39.8283, lng: -98.5795, radius: 2000 },
        // Spain
        'madrid': { lat: 40.4168, lng: -3.7038, radius: 25 },
        'barcelona': { lat: 41.3851, lng: 2.1734, radius: 25 },
        'valencia': { lat: 39.4699, lng: -0.3763, radius: 20 },
        'seville': { lat: 37.3891, lng: -5.9845, radius: 20 },
        'spain': { lat: 40.4637, lng: -3.7492, radius: 400 },
        // India
        'mumbai': { lat: 19.05, lng: 72.88, radius: 12 }, // Tighter radius to keep stops in urban core
        'delhi': { lat: 28.7041, lng: 77.1025, radius: 30 },
        'bangalore': { lat: 12.9716, lng: 77.5946, radius: 25 },
        'chennai': { lat: 13.0827, lng: 80.2707, radius: 25 },
        'hyderabad': { lat: 17.3850, lng: 78.4867, radius: 25 },
        'kolkata': { lat: 22.5726, lng: 88.3639, radius: 25 },
        'india': { lat: 20.5937, lng: 78.9629, radius: 1500 },
        // Australia
        'sydney': { lat: -33.8688, lng: 151.2093, radius: 35 },
        'melbourne': { lat: -37.8136, lng: 144.9631, radius: 35 },
        'brisbane': { lat: -27.4698, lng: 153.0251, radius: 30 },
        'perth': { lat: -31.9505, lng: 115.8605, radius: 30 },
        'australia': { lat: -25.2744, lng: 133.7751, radius: 2000 },
        // Netherlands
        'amsterdam': { lat: 52.3676, lng: 4.9041, radius: 20 },
        'rotterdam': { lat: 51.9244, lng: 4.4777, radius: 20 },
        'netherlands': { lat: 52.1326, lng: 5.2913, radius: 150 },
        // Italy
        'rome': { lat: 41.9028, lng: 12.4964, radius: 25 },
        'milan': { lat: 45.4642, lng: 9.1900, radius: 25 },
        'naples': { lat: 40.8518, lng: 14.2681, radius: 20 },
        'italy': { lat: 41.8719, lng: 12.5674, radius: 400 },
        // Canada
        'toronto': { lat: 43.6532, lng: -79.3832, radius: 30 },
        'vancouver': { lat: 49.2827, lng: -123.1207, radius: 25 },
        'montreal': { lat: 45.5017, lng: -73.5673, radius: 25 },
        'canada': { lat: 56.1304, lng: -106.3468, radius: 2000 },
      };

      // Find matching location (case-insensitive)
      const locationKey = location.toLowerCase();
      const coords = Object.entries(locationCoords).find(([key]) =>
        locationKey.includes(key) || key.includes(locationKey)
      )?.[1] || locationCoords['united kingdom'];

      // Generate random stops in the specified location
      const { generateRandomStops } = await import('@/data/benchmarkData');
      const stops = generateRandomStops(numStops, coords.lat, coords.lng, coords.radius);

      // Build vehicles array
      // Note: Set startLat/startLng to 0 to avoid triggering home-start mode
      // Home-start mode should only be enabled explicitly via config
      const vehicles = Array.from({ length: numVehicles }, (_, i) => ({
        id: i,
        capacity: vehicleCapacity,
        startLat: 0,
        startLng: 0,
      }));

      // Build cuOPT payload using the existing buildPayload method
      const { cuoptClient } = await import('@/api/cuoptClient');
      const request = cuoptClient.buildPayload(stops, vehicles, {
        numVehicles,
        vehicleCapacity,
        timeLimit,
        objective: 'minimize_distance',
        enableTimeWindows: false,
        enableCapacity: true,
        enableHomeStart: false, // Disable home-start mode for AI-generated requests
        parallelJobs: 1,
        solverMode: 'balanced',
      });

      return { request, interpretation, numStops, numVehicles, useParallel, numClusters, stops, location };
    } catch (error) {
      return {
        request: null,
        interpretation: '',
        error: `Failed to convert prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async convertResponseToNaturalLanguage(
    cuoptResult: CuOptResponse,
    originalPrompt: string,
    weatherContext?: string,
    stops?: Stop[]
  ): Promise<string> {
    // Include weather context if available
    const weatherSection = weatherContext
      ? `\n\nWeather Data Available:\n${weatherContext}\n(Note: Weather details will be shown separately - do not state that weather data was not provided)`
      : '';

    // Calculate operational impact metrics
    const vehicleData = cuoptResult.vehicle_data || [];
    const vehiclesUsed = vehicleData.filter(v => v.route && v.route.length > 2).length;
    const stopsServed = vehicleData.reduce((sum, v) => sum + Math.max(0, (v.route?.length || 2) - 2), 0);
    const totalDuration = vehicleData.reduce((sum, v) => sum + (v.route_duration || 0), 0);

    // Calculate job time from stops (if available)
    const totalJobTime = stops?.reduce((sum, s) => sum + (s.serviceDuration || 0), 0) || 0;
    const totalDriveTime = Math.max(0, totalDuration - totalJobTime);
    const productiveRatio = totalDuration > 0 ? (totalJobTime / totalDuration) * 100 : 0;

    // Calculate business metrics (Belron-calibrated)
    const jobsPerTechPerDay = vehiclesUsed > 0 ? stopsServed / vehiclesUsed : 0;
    const baselineJobsPerTech = 3.2;
    const efficiencyImprovement = baselineJobsPerTech > 0
      ? ((jobsPerTechPerDay - baselineJobsPerTech) / baselineJobsPerTech) * 100
      : 0;

    // Calculate savings (simplified Belron model)
    const totalDistance = cuoptResult.solution_cost || 0;
    const fuelCostPerKm = 0.15; // GBP
    const avgRevenuePerJob = 185; // GBP
    const distanceReduction = totalDistance * 0.15; // 15% assumed optimization benefit
    const fuelSavingsDaily = distanceReduction * fuelCostPerKm;
    const additionalJobsPerDay = Math.max(0, jobsPerTechPerDay - baselineJobsPerTech) * vehiclesUsed;
    const additionalRevenueDaily = additionalJobsPerDay * avgRevenuePerJob;
    const totalDailySavings = fuelSavingsDaily + additionalRevenueDaily;
    const annualSavings = totalDailySavings * 250; // 250 working days

    const operationalMetrics = `
Operational Impact Metrics (Belron-calibrated):
- Jobs per Tech per Day: ${jobsPerTechPerDay.toFixed(1)} (industry baseline: 3.2)
- Efficiency vs Baseline: ${efficiencyImprovement >= 0 ? '+' : ''}${efficiencyImprovement.toFixed(0)}%
- Productive Time: ${productiveRatio.toFixed(0)}% on jobs, ${(100 - productiveRatio).toFixed(0)}% driving
- Total Job Time: ${Math.round(totalJobTime)} min, Total Drive Time: ${Math.round(totalDriveTime)} min
- Estimated Daily Savings: £${Math.round(totalDailySavings).toLocaleString()} (fuel + productivity)
- Estimated Annual Potential: £${Math.round(annualSavings).toLocaleString()} (scaled to 250 days)
`;

    const systemPrompt = `${CUOPT_RESPONSE_PROMPT}

Original user question: "${originalPrompt}"${weatherSection}

${operationalMetrics}

cuOPT Result:
${JSON.stringify(cuoptResult, null, 2)}`;

    const response = await this.chat(
      [
        {
          id: '1',
          role: 'user',
          content: 'Explain this optimization result to me.',
          timestamp: new Date(),
        },
      ],
      systemPrompt
    );

    return response.content;
  }

  async *streamChat(
    messages: Message[],
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    // For now, simulate streaming with chunked response
    // In production, this would use Server-Sent Events
    const response = await this.chat(messages, systemPrompt);
    const words = response.content.split(' ');

    for (const word of words) {
      yield `${word  } `;
      await this.delay(30); // Simulate typing
    }
  }

  private buildPayloadForChat(messages: Message[], systemPrompt?: string) {
    const formattedMessages: Array<{
      role: string;
      content: Array<{ type: string; text: string }>;
    }> = [];

    if (systemPrompt) {
      formattedMessages.push({
        role: 'SYSTEM',
        content: [{ type: 'TEXT', text: systemPrompt }],
      });
    }

    messages.forEach((m) => {
      formattedMessages.push({
        role: m.role === 'assistant' ? 'ASSISTANT' : 'USER',
        content: [{ type: 'TEXT', text: m.content }],
      });
    });

    return {
      chatRequest: {
        messages: formattedMessages,
        model: this.model,
        maxTokens: this.maxTokens,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const genaiClient = new GenAIClient();
export default genaiClient;
