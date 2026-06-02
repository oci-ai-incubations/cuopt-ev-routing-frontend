import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cuoptClient, authClient } from '@/api';
import type { OptimizationConfig, Stop, Vehicle } from '@/types';

vi.mock('@/api/authClient', () => ({
  authClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  // Skip actual polling delay in all tests
  vi.spyOn(cuoptClient as unknown as { delay: () => Promise<void> }, 'delay').mockResolvedValue();
});

// ─── healthCheck ──────────────────────────────────────────────────────────────

describe('healthCheck', () => {
  it('returns true when API responds with 200', async () => {
    vi.mocked(authClient.get).mockResolvedValue({ status: 200 });

    expect(await cuoptClient.healthCheck()).toBe(true);
    expect(authClient.get).toHaveBeenCalledWith('/api/cuopt/health', expect.any(Object));
  });

  it('returns false on network error', async () => {
    vi.mocked(authClient.get).mockRejectedValue(new Error('ECONNREFUSED'));

    expect(await cuoptClient.healthCheck()).toBe(false);
  });
});

// ─── solveVRP ─────────────────────────────────────────────────────────────────

const mockSolverResponse = {
  vehicle_data: {
    '0': { route: [0, 1, 2, 0], arrival_stamp: [0, 10, 20, 30] },
  },
  solution_cost: 42,
};

function makeSolutionPayload(overrides = {}) {
  return {
    data: {
      response: {
        solver_response: mockSolverResponse,
        total_solve_time: 1.5,
      },
      ...overrides,
    },
  };
}

describe('solveVRP', () => {
  it('submits job, polls for solution, and returns transformed vehicle data', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: { reqId: 'req-1' } });
    vi.mocked(authClient.get).mockResolvedValue(makeSolutionPayload());

    const result = await cuoptClient.solveVRP({} as never);

    expect(authClient.post).toHaveBeenCalledWith(
      '/api/cuopt/request',
      expect.anything(),
      expect.any(Object),
    );
    expect(authClient.get).toHaveBeenCalledWith('/api/cuopt/solution/req-1', expect.any(Object));
    expect(result.status).toBe('SUCCESS');
    expect(result.vehicle_data).toHaveLength(1);
    expect(result.vehicle_data[0].vehicle_id).toBe(0);
    expect(result.vehicle_data[0].route).toEqual([0, 1, 2, 0]);
  });

  it('returns PARTIAL status when only infeasible_response is present', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: { reqId: 'req-2' } });
    vi.mocked(authClient.get).mockResolvedValue({
      data: {
        response: {
          solver_infeasible_response: mockSolverResponse,
          total_solve_time: 2,
        },
      },
    });

    const result = await cuoptClient.solveVRP({} as never);

    expect(result.status).toBe('PARTIAL');
  });

  it('returns FAILED status when vehicle_data is empty', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: { reqId: 'req-3' } });
    vi.mocked(authClient.get).mockResolvedValue({
      data: {
        response: {
          solver_response: { vehicle_data: {}, solution_cost: 0 },
          total_solve_time: 0,
        },
      },
    });

    const result = await cuoptClient.solveVRP({} as never);

    expect(result.status).toBe('FAILED');
  });

  it('throws when no reqId is returned', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: {} });

    await expect(cuoptClient.solveVRP({} as never)).rejects.toThrow(
      'No request ID returned from cuOPT',
    );
  });

  it('wraps axios error with descriptive message', async () => {
    // axios.isAxiosError checks the `isAxiosError: true` property on the thrown object
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { data: { error: 'GPU OOM' } },
    });

    vi.mocked(authClient.post).mockRejectedValue(axiosError);

    await expect(cuoptClient.solveVRP({} as never)).rejects.toThrow('cuOPT API Error: GPU OOM');
  });

  it('throws infeasibility error when notes contain the infeasible message', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: { reqId: 'req-inf' } });
    vi.mocked(authClient.get).mockResolvedValue({
      data: {
        response: {
          solver_response: { vehicle_data: {}, solution_cost: 0 },
          total_solve_time: 0,
        },
        notes: ['Feasible solutions could not be found for all tasks.'],
      },
    });

    // Notes + solver_response (no partial) → throws before vehicle data processing
    await expect(cuoptClient.solveVRP({} as never)).rejects.toThrow('Optimization infeasible');
  });
});

// ─── buildPayload ─────────────────────────────────────────────────────────────

const sampleStops: Stop[] = [
  { id: 1, lat: 51.5, lng: -0.1, demand: 5 },
  { id: 2, lat: 51.6, lng: -0.2, demand: 3 },
];

const sampleVehicles: Vehicle[] = [
  { id: 0, capacity: 50, startLat: 0, startLng: 0 },
  { id: 1, capacity: 50, startLat: 0, startLng: 0 },
];

const baseConfig: OptimizationConfig = {
  numVehicles: 2,
  vehicleCapacity: 50,
  timeLimit: 30,
  objective: 'minimize_distance',
  enableTimeWindows: false,
  enableCapacity: true,
  parallelJobs: 1,
  solverMode: 'balanced',
};

describe('buildPayload', () => {
  it('produces valid cuOPT request structure', () => {
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, baseConfig);

    expect(payload).toHaveProperty('cost_matrix_data.data.0');
    expect(payload).toHaveProperty('travel_time_matrix_data.data.0');
    expect(payload.task_data.task_locations).toEqual([1, 2]);
    expect(payload.fleet_data.vehicle_locations).toHaveLength(2);
    expect(payload.solver_config.time_limit).toBeGreaterThan(0);
  });

  it('includes service_times when stops have serviceDuration', () => {
    const stops: Stop[] = [{ id: 1, lat: 51.5, lng: -0.1, demand: 2, serviceDuration: 15 }];
    const payload = cuoptClient.buildPayload(stops, [sampleVehicles[0]], baseConfig);

    expect(payload.task_data.service_times).toEqual([15]);
  });

  it('omits service_times when all durations are zero', () => {
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, baseConfig);

    expect(payload.task_data.service_times).toBeUndefined();
  });

  it('includes task_time_windows when time windows are enabled', () => {
    const stops: Stop[] = [
      { id: 1, lat: 51.5, lng: -0.1, demand: 2, timeWindowStart: 60, timeWindowEnd: 180 },
    ];
    const config = { ...baseConfig, enableTimeWindows: true };
    const payload = cuoptClient.buildPayload(stops, [sampleVehicles[0]], config);

    expect(payload.task_data.task_time_windows).toEqual([[60, 180]]);
  });

  it('applies speed solver mode — halves time limit', () => {
    const config = { ...baseConfig, solverMode: 'speed' as const, timeLimit: 60 };
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, config);

    expect(payload.solver_config.time_limit).toBe(30);
  });

  it('applies quality solver mode — keeps full time limit', () => {
    const config = { ...baseConfig, solverMode: 'quality' as const, timeLimit: 60 };
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, config);

    expect(payload.solver_config.time_limit).toBe(60);
  });

  it('applies minimize_distance objective', () => {
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, {
      ...baseConfig,
      objective: 'minimize_distance',
    });

    expect(payload.solver_config.objectives?.cost).toBe(1);
    expect(payload.solver_config.objectives?.travel_time).toBe(0);
  });

  it('applies minimize_time objective', () => {
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, {
      ...baseConfig,
      objective: 'minimize_time',
    });

    expect(payload.solver_config.objectives?.cost).toBe(0);
    expect(payload.solver_config.objectives?.travel_time).toBe(1);
  });

  it('cost matrix is n×n where n = stops + 1 (depot)', () => {
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, baseConfig);
    const matrix = payload.cost_matrix_data.data['0'];
    const expectedSize = sampleStops.length + 1;

    expect(matrix).toHaveLength(expectedSize);
    matrix.forEach((row) => expect(row).toHaveLength(expectedSize));
  });

  it('diagonal of cost matrix is all zeros', () => {
    const payload = cuoptClient.buildPayload(sampleStops, sampleVehicles, baseConfig);
    const matrix = payload.cost_matrix_data.data['0'];

    matrix.forEach((row, i) => expect(row[i]).toBe(0));
  });
});

// ─── clusterStops ─────────────────────────────────────────────────────────────

describe('clusterStops', () => {
  it('returns all stops in a single cluster when stops ≤ numClusters', () => {
    const clusters = cuoptClient.clusterStops(sampleStops, 5);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(sampleStops.length);
  });

  it('returns requested number of non-empty clusters', () => {
    const stops: Stop[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      lat: 51 + i * 0.01,
      lng: -0.1 + i * 0.01,
      demand: 1,
    }));

    const clusters = cuoptClient.clusterStops(stops, 3);

    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters.length).toBeLessThanOrEqual(3);
    const total = clusters.reduce((sum, c) => sum + c.length, 0);

    expect(total).toBe(stops.length);
  });
});

// ─── estimatePayloadSize ──────────────────────────────────────────────────────

describe('estimatePayloadSize', () => {
  it('returns positive MB value for any positive stop count', () => {
    expect(cuoptClient.estimatePayloadSize(10)).toBeGreaterThan(0);
    expect(cuoptClient.estimatePayloadSize(100)).toBeGreaterThan(0);
  });

  it('follows quadratic growth — 10× more stops ≈ 100× larger payload', () => {
    const small = cuoptClient.estimatePayloadSize(10);
    const large = cuoptClient.estimatePayloadSize(100);

    expect(large / small).toBeGreaterThan(50); // rough quadratic check
  });
});

// ─── solveParallel ────────────────────────────────────────────────────────────

describe('solveParallel', () => {
  it('resolves all payloads and returns results array of same length', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: { reqId: 'req-p' } });
    vi.mocked(authClient.get).mockResolvedValue(makeSolutionPayload());

    const payloads = Array(3).fill({} as never);
    const results = await cuoptClient.solveParallel(payloads, 2);

    expect(results).toHaveLength(3);
    results.forEach((r) => expect(r).not.toBeNull());
  });

  it('calls onProgress after each completed job', async () => {
    vi.mocked(authClient.post).mockResolvedValue({ data: { reqId: 'req-p' } });
    vi.mocked(authClient.get).mockResolvedValue(makeSolutionPayload());

    const onProgress = vi.fn();

    await cuoptClient.solveParallel([{} as never], 1, onProgress);

    expect(onProgress).toHaveBeenCalled();
  });

  it('stores null for failed jobs and calls onJobError', async () => {
    vi.mocked(authClient.post).mockRejectedValue(new Error('fail'));

    const onJobError = vi.fn();
    const results = await cuoptClient.solveParallel(
      [{} as never],
      1,
      undefined,
      undefined,
      onJobError,
    );

    expect(results[0]).toBeNull();
    expect(onJobError).toHaveBeenCalledWith(0, expect.any(Error));
  });
});
