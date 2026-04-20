import { useCallback } from 'react';

import { cuoptClient } from '@/api';
import { useAppStore, useOptimizationStore } from '@/store';

export function useDashboardOptimization() {
  const { stops, config, setResult, updateParallelJob, clearParallelJobs } = useOptimizationStore();
  const { setIsOptimizing, addToast } = useAppStore();

  const handleRunOptimization = useCallback(async () => {
    if (stops.length === 0) {
      addToast({
        type: 'warning',
        title: 'No stops configured',
        message: 'Please add stops before running optimization',
      });
      return;
    }

    const maxDemand = Math.max(...stops.map((s) => s.demand));
    if (config.vehicleCapacity < maxDemand) {
      addToast({
        type: 'error',
        title: 'Invalid Configuration',
        message: `Vehicle capacity (${config.vehicleCapacity}) must be at least ${maxDemand} to handle largest stop demand`,
      });
      return;
    }

    setIsOptimizing(true);
    const startTime = Date.now();

    try {
      const vehicles = Array.from({ length: config.numVehicles }, (_, i) => ({
        id: i,
        capacity: config.vehicleCapacity,
        startLat: stops[0]?.lat || 54.5,
        startLng: stops[0]?.lng || -2.0,
      }));

      const payload = cuoptClient.buildPayload(stops, vehicles, config);
      const result = await cuoptClient.solveVRP(payload);
      const solveTime = (Date.now() - startTime) / 1000;

      setResult({ ...result, solve_time: solveTime });
      addToast({
        type: 'success',
        title: 'Optimization Complete',
        message: `Found solution with ${result.num_vehicles} vehicles in ${solveTime.toFixed(2)}s`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Optimization Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [stops, config, setResult, setIsOptimizing, addToast]);

  const handleRunParallel = useCallback(async () => {
    if (stops.length === 0) return;

    const maxDemand = Math.max(...stops.map((s) => s.demand));
    if (config.vehicleCapacity < maxDemand) {
      addToast({
        type: 'error',
        title: 'Invalid Configuration',
        message: `Vehicle capacity (${config.vehicleCapacity}) must be at least ${maxDemand} to handle largest stop demand`,
      });
      return;
    }

    setIsOptimizing(true);
    clearParallelJobs();

    try {
      const clusters = cuoptClient.clusterStops(stops, config.parallelJobs);

      clusters.forEach((cluster, idx) => {
        updateParallelJob({
          jobId: `job-${idx + 1}`,
          clusterId: idx + 1,
          status: 'queued',
          stops: cluster.length,
        });
      });

      const vehiclesPerCluster = Math.ceil(config.numVehicles / clusters.length);
      const payloads = clusters.map((cluster) => {
        const clusterCenterLat = cluster.reduce((sum, s) => sum + s.lat, 0) / cluster.length;
        const clusterCenterLng = cluster.reduce((sum, s) => sum + s.lng, 0) / cluster.length;

        const vehicles = Array.from({ length: vehiclesPerCluster }, (_, i) => {
          const homeOffset = 0.05;
          return {
            id: i,
            capacity: config.vehicleCapacity,
            startLat: config.enableHomeStart ? clusterCenterLat + (Math.random() - 0.5) * homeOffset * 2 : 0,
            startLng: config.enableHomeStart ? clusterCenterLng + (Math.random() - 0.5) * homeOffset * 2 : 0,
          };
        });

        return cuoptClient.buildPayload(cluster, vehicles, config);
      });

      const results = await cuoptClient.solveParallel(
        payloads,
        config.parallelJobs,
        (_completed, _total, partialResults) => {
          for (let idx = 0; idx < partialResults.length; idx++) {
            const result = partialResults[idx];
            if (!result) continue;
            updateParallelJob({
              jobId: `job-${idx + 1}`,
              clusterId: idx + 1,
              status: 'completed',
              stops: clusters[idx].length,
              solveTime: result.solve_time,
              result,
            });
          }
        },
        (jobIndex) => {
          updateParallelJob({
            jobId: `job-${jobIndex + 1}`,
            clusterId: jobIndex + 1,
            status: 'running',
            stops: clusters[jobIndex].length,
          });
        },
        (jobIndex, error) => {
          updateParallelJob({
            jobId: `job-${jobIndex + 1}`,
            clusterId: jobIndex + 1,
            status: 'failed',
            stops: clusters[jobIndex].length,
            error: error.message,
          });
        }
      );

      for (let idx = 0; idx < results.length; idx++) {
        const result = results[idx];
        updateParallelJob({
          jobId: `job-${idx + 1}`,
          clusterId: idx + 1,
          status: result ? 'completed' : 'failed',
          stops: clusters[idx].length,
          solveTime: result?.solve_time,
          result: result || undefined,
        });
      }

      const validResults = results.filter(Boolean);
      if (validResults.length > 0) {
        let globalVehicleId = 0;
        const mergedVehicleData = results.flatMap((r, clusterIdx) => {
          if (!r) return [];
          const clusterStops = clusters[clusterIdx];

          return (r.vehicle_data || []).map((v) => ({
            ...v,
            route: (v.route || []).map((idx: number) => {
              if (idx === 0) return 0;
              const clusterStopIndex = idx - 1;
              if (clusterStopIndex >= 0 && clusterStopIndex < clusterStops.length) {
                return clusterStops[clusterStopIndex].id;
              }
              return idx;
            }),
            vehicle_id: globalVehicleId++,
            cluster_id: clusterIdx,
            original_vehicle_id: v.vehicle_id,
          }));
        });

        setResult({
          status: 'SUCCESS',
          num_vehicles: mergedVehicleData.length,
          solution_cost: validResults.reduce((sum, r) => sum + (r?.solution_cost || 0), 0),
          solve_time: Math.max(...validResults.map((r) => r?.solve_time || 0)),
          vehicle_data: mergedVehicleData,
          clusters_used: clusters.length,
          parallel_execution: true,
        });
      }

      addToast({
        type: 'success',
        title: 'Parallel Optimization Complete',
        message: `Completed ${clusters.length} clusters with ${
          results.filter(Boolean).reduce((sum, r) => sum + (r?.num_vehicles || 0), 0)
        } vehicles`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Parallel Optimization Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [
    stops,
    config,
    clearParallelJobs,
    updateParallelJob,
    setResult,
    setIsOptimizing,
    addToast,
  ]);

  return { handleRunOptimization, handleRunParallel };
}
