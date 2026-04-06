import { create } from 'zustand';
import type {
  Stop,
  Vehicle,
  OptimizationConfig,
  CuOptResponse,
  ParallelJobResult,
  ClusterInfo,
  VehicleRoute,
} from '@/types';

// Haversine distance calculation
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate route distance from stop coordinates
function calculateRouteDistance(route: number[], stops: Stop[]): number {
  if (route.length < 2) return 0;

  let totalDistance = 0;
  // stops array: index 0 is depot, rest are delivery stops
  // route array contains indices into the combined [depot, ...stops] array

  for (let i = 0; i < route.length - 1; i++) {
    const fromIdx = route[i];
    const toIdx = route[i + 1];

    // Get coordinates - route indices map to stops array (0 = first stop which is depot)
    const fromStop = fromIdx === 0 ? stops[0] : stops[fromIdx - 1] || stops[0];
    const toStop = toIdx === 0 ? stops[0] : stops[toIdx - 1] || stops[0];

    if (fromStop && toStop) {
      totalDistance += haversineDistance(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng);
    }
  }

  return totalDistance;
}

interface OptimizationState {
  // Input data
  stops: Stop[];
  vehicles: Vehicle[];
  config: OptimizationConfig;

  // Results
  result: CuOptResponse | null;
  routes: VehicleRoute[];
  unservedStops: number[];

  // Parallel execution
  clusters: ClusterInfo[];
  parallelJobs: ParallelJobResult[];

  // Performance metrics
  solveTime: number;
  totalDistance: number;
  totalDuration: number;
  vehiclesUsed: number;
  stopsServed: number;

  // Actions - Input
  setStops: (stops: Stop[]) => void;
  addStop: (stop: Stop) => void;
  removeStop: (id: number) => void;
  clearStops: () => void;

  setVehicles: (vehicles: Vehicle[]) => void;
  setConfig: (config: Partial<OptimizationConfig>) => void;

  // Actions - Results
  setResult: (result: CuOptResponse) => void;
  clearResult: () => void;

  // Actions - Parallel
  setClusters: (clusters: ClusterInfo[]) => void;
  updateParallelJob: (job: ParallelJobResult) => void;
  clearParallelJobs: () => void;

  // Actions - Metrics
  updateMetrics: (metrics: Partial<{
    solveTime: number;
    totalDistance: number;
    totalDuration: number;
    vehiclesUsed: number;
    stopsServed: number;
  }>) => void;

  // Reset
  reset: () => void;
}

const defaultConfig: OptimizationConfig = {
  numVehicles: 10,
  vehicleCapacity: 100,
  timeLimit: 30,
  objective: 'minimize_distance',
  enableTimeWindows: false,
  enableCapacity: true,
  parallelJobs: 1,
  solverMode: 'balanced',
  defaultServiceTime: 0, // No default service time
};

export const useOptimizationStore = create<OptimizationState>((set) => ({
  // Initial state
  stops: [],
  vehicles: [],
  config: defaultConfig,
  result: null,
  routes: [],
  unservedStops: [],
  clusters: [],
  parallelJobs: [],
  solveTime: 0,
  totalDistance: 0,
  totalDuration: 0,
  vehiclesUsed: 0,
  stopsServed: 0,

  // Input actions
  setStops: (stops) => set({ stops }),
  addStop: (stop) => set((state) => ({ stops: [...state.stops, stop] })),
  removeStop: (id) => set((state) => ({ stops: state.stops.filter((s) => s.id !== id) })),
  clearStops: () => set({ stops: [] }),

  setVehicles: (vehicles) => set({ vehicles }),
  setConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),

  // Result actions
  setResult: (result) =>
    set((state) => {
      // Calculate distances for each route using stop coordinates
      const routesWithDistance = (result.vehicle_data || []).map((vehicle) => {
        const routeDistance = calculateRouteDistance(vehicle.route, state.stops);
        return {
          ...vehicle,
          route_distance: routeDistance,
        };
      });

      const totalDistance = routesWithDistance.reduce((acc, v) => acc + v.route_distance, 0);
      const totalDuration = routesWithDistance.reduce((acc, v) => acc + (v.route_duration || 0), 0);
      const stopsServed = routesWithDistance.reduce((acc, v) => acc + Math.max(0, v.route.length - 2), 0);

      return {
        result: { ...result, vehicle_data: routesWithDistance },
        routes: routesWithDistance,
        unservedStops: [],
        solveTime: result.solve_time || 0,
        vehiclesUsed: result.num_vehicles || routesWithDistance.length || 0,
        totalDistance,
        totalDuration,
        stopsServed,
      };
    }),
  clearResult: () =>
    set({
      result: null,
      routes: [],
      unservedStops: [],
      solveTime: 0,
      totalDistance: 0,
      totalDuration: 0,
      vehiclesUsed: 0,
      stopsServed: 0,
    }),

  // Parallel actions
  setClusters: (clusters) => set({ clusters }),
  updateParallelJob: (job) =>
    set((state) => {
      const existingIndex = state.parallelJobs.findIndex((j) => j.jobId === job.jobId);
      if (existingIndex >= 0) {
        const updated = [...state.parallelJobs];
        updated[existingIndex] = job;
        return { parallelJobs: updated };
      }
      return { parallelJobs: [...state.parallelJobs, job] };
    }),
  clearParallelJobs: () => set({ parallelJobs: [], clusters: [] }),

  // Metrics actions
  updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),

  // Reset
  reset: () =>
    set({
      stops: [],
      vehicles: [],
      config: defaultConfig,
      result: null,
      routes: [],
      unservedStops: [],
      clusters: [],
      parallelJobs: [],
      solveTime: 0,
      totalDistance: 0,
      totalDuration: 0,
      vehiclesUsed: 0,
      stopsServed: 0,
    }),
}));
