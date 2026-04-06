import { useCallback, useState } from 'react';
import { InputPanel } from './InputPanel';
import { ResultsPanel } from './ResultsPanel';
import { RouteMap } from '@/components/Map/RouteMap';
import { GoogleRouteMap } from '@/components/Map/GoogleRouteMap';
import { PerformanceChart } from '@/components/Metrics/PerformanceChart';
import { OperationalImpactPanel } from '@/components/Metrics/OperationalImpactPanel';
import { WeatherPanel } from '@/components/Weather/WeatherPanel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { useOptimizationStore, useAppStore } from '@/store';
import { BarChart3, Cloud, MapPin, Target } from 'lucide-react';
import { cuoptClient } from '@/api';

export function Dashboard() {
  const {
    stops,
    config,
    setResult,
    updateParallelJob,
    clearParallelJobs,
  } = useOptimizationStore();

  const { setIsOptimizing, addToast, mapProvider, setMapProvider, googleMapsApiKey } = useAppStore();
  const [rightPanelView, setRightPanelView] = useState<'weather' | 'impact' | 'performance'>('weather');

  const handleRunOptimization = useCallback(async () => {
    if (stops.length === 0) {
      addToast({
        type: 'warning',
        title: 'No stops configured',
        message: 'Please add stops before running optimization',
      });
      return;
    }

    // Validate capacity is sufficient for max demand
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
      // Build vehicles array based on config
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

    // Validate capacity is sufficient for max demand
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
      // Cluster stops
      const clusters = cuoptClient.clusterStops(stops, config.parallelJobs);

      // Initialize parallel jobs (1-indexed for user display)
      clusters.forEach((cluster, idx) => {
        updateParallelJob({
          jobId: `job-${idx + 1}`,
          clusterId: idx + 1,
          status: 'queued',
          stops: cluster.length,
        });
      });

      // Build vehicles for each cluster
      const vehiclesPerCluster = Math.ceil(config.numVehicles / clusters.length);

      const payloads = clusters.map((cluster) => {
        // Calculate cluster center for home-start mode
        const clusterCenterLat = cluster.reduce((sum, s) => sum + s.lat, 0) / cluster.length;
        const clusterCenterLng = cluster.reduce((sum, s) => sum + s.lng, 0) / cluster.length;

        const vehicles = Array.from({ length: vehiclesPerCluster }, (_, i) => {
          // Only set home locations if home-start is enabled
          // Generate random home locations spread around the cluster center
          const homeOffset = 0.05; // ~5km spread
          return {
            id: i,
            capacity: config.vehicleCapacity,
            // Only set startLat/startLng if home-start is explicitly enabled
            startLat: config.enableHomeStart ? clusterCenterLat + (Math.random() - 0.5) * homeOffset * 2 : 0,
            startLng: config.enableHomeStart ? clusterCenterLng + (Math.random() - 0.5) * homeOffset * 2 : 0,
          };
        });
        return cuoptClient.buildPayload(cluster, vehicles, config);
      });

      // Run parallel
      const results = await cuoptClient.solveParallel(
        payloads,
        config.parallelJobs,
        (_completed, _total, partialResults) => {
          // Use for loop to iterate through all indices (avoids sparse array issues)
          for (let idx = 0; idx < partialResults.length; idx++) {
            const result = partialResults[idx];
            if (result) {
              updateParallelJob({
                jobId: `job-${idx + 1}`,
                clusterId: idx + 1,
                status: 'completed',
                stops: clusters[idx].length,
                solveTime: result.solve_time,
                result,
              });
            }
          }
        },
        (jobIndex) => {
          // Update job status to running when it starts (1-indexed)
          updateParallelJob({
            jobId: `job-${jobIndex + 1}`,
            clusterId: jobIndex + 1,
            status: 'running',
            stops: clusters[jobIndex].length,
          });
        },
        (jobIndex, error) => {
          // Update job status to failed when error occurs (1-indexed)
          updateParallelJob({
            jobId: `job-${jobIndex + 1}`,
            clusterId: jobIndex + 1,
            status: 'failed',
            stops: clusters[jobIndex].length,
            error: error.message,
          });
        }
      );

      // Final cleanup: ensure all jobs are marked as completed or failed (1-indexed)
      // Use for loop to iterate through all indices (avoids sparse array issues with forEach)
      for (let idx = 0; idx < results.length; idx++) {
        const result = results[idx];
        if (result) {
          updateParallelJob({
            jobId: `job-${idx + 1}`,
            clusterId: idx + 1,
            status: 'completed',
            stops: clusters[idx].length,
            solveTime: result.solve_time,
            result,
          });
        } else {
          // Job failed - mark as failed
          updateParallelJob({
            jobId: `job-${idx + 1}`,
            clusterId: idx + 1,
            status: 'failed',
            stops: clusters[idx].length,
          });
        }
      }

      // Merge all parallel results into a single result
      const validResults = results.filter(Boolean);
      if (validResults.length > 0) {
        // Create unique vehicle IDs across all clusters
        // IMPORTANT: Remap route indices from cluster-relative to original stop IDs
        let globalVehicleId = 0;
        const mergedVehicleData = results.flatMap((r, clusterIdx) => {
          if (!r) return [];

          // Get the original stops for this cluster
          const clusterStops = clusters[clusterIdx];

          return (r.vehicle_data || []).map((v: any) => {
            // Remap route indices to original stop IDs
            // cuOPT returns: 0 = depot, 1 = first stop in cluster, 2 = second stop, etc.
            // We need to convert these to original stop IDs
            const remappedRoute = (v.route || []).map((idx: number) => {
              if (idx === 0) {
                // Depot - keep as 0
                return 0;
              }
              // idx is 1-based index into cluster stops
              // Convert to original stop ID
              const clusterStopIndex = idx - 1;
              if (clusterStopIndex >= 0 && clusterStopIndex < clusterStops.length) {
                return clusterStops[clusterStopIndex].id;
              }
              return idx; // Fallback
            });

            return {
              ...v,
              route: remappedRoute,
              vehicle_id: globalVehicleId++,
              cluster_id: clusterIdx,
              original_vehicle_id: v.vehicle_id,
            };
          });
        });

        const mergedResult = {
          status: 'SUCCESS' as const,
          num_vehicles: mergedVehicleData.length,
          solution_cost: validResults.reduce((sum, r) => sum + (r?.solution_cost || 0), 0),
          solve_time: Math.max(...validResults.map(r => r?.solve_time || 0)),
          vehicle_data: mergedVehicleData,
          clusters_used: clusters.length,
          parallel_execution: true,
        };

        // Set the merged result to update the main view
        setResult(mergedResult);
      }

      addToast({
        type: 'success',
        title: 'Parallel Optimization Complete',
        message: `Completed ${clusters.length} clusters with ${results.filter(Boolean).reduce((sum, r) => sum + (r?.num_vehicles || 0), 0)} vehicles`,
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

  return (
    <div className="flex h-full">
      {/* Left Panel - Input */}
      <InputPanel
        onRunOptimization={handleRunOptimization}
        onRunParallel={handleRunParallel}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top - Map */}
        <div className="h-1/2 p-4 pb-2">
          <Card variant="bordered" padding="none" className="h-full overflow-hidden relative">
            {/* Map Provider Toggle - z-[1001] to be above Leaflet controls */}
            <div className="absolute top-3 left-3 z-[1001] flex bg-dark-card border border-dark-border rounded-lg overflow-hidden shadow-lg">
              <button
                onClick={() => setMapProvider('google')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  mapProvider === 'google'
                    ? 'bg-[#C74634] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
                title="Google Maps with Traffic & Directions"
              >
                <MapPin className="w-3.5 h-3.5" />
                Google
              </button>
              <button
                onClick={() => setMapProvider('leaflet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  mapProvider === 'leaflet'
                    ? 'bg-[#C74634] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
                title="OpenStreetMap (Free)"
              >
                <MapPin className="w-3.5 h-3.5" />
                Leaflet
              </button>
            </div>

            {/* Render Google map only when API key is available */}
            <div className={`h-full w-full ${mapProvider === 'google' ? 'block' : 'hidden'}`}>
              {googleMapsApiKey ? <GoogleRouteMap /> : (
                <div className="h-full w-full flex items-center justify-center bg-dark-bg text-gray-500 text-sm">
                  Google Maps API key not configured
                </div>
              )}
            </div>
            <div className={`h-full w-full ${mapProvider === 'leaflet' ? 'block' : 'hidden'}`}>
              <RouteMap isActive={mapProvider === 'leaflet'} />
            </div>
          </Card>
        </div>

        {/* Bottom - Results and Charts */}
        <div className="h-1/2 flex overflow-hidden">
          <div className="w-1/2 h-full overflow-hidden">
            <ResultsPanel />
          </div>
          <div className="w-1/2 p-4 pl-2">
            <div className="h-full flex flex-col">
              {/* Tab Buttons */}
              <div className="flex border-b border-dark-border mb-2">
                <button
                  onClick={() => setRightPanelView('weather')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    rightPanelView === 'weather'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-4 h-4" />
                  Weather
                </button>
                <button
                  onClick={() => setRightPanelView('impact')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    rightPanelView === 'impact'
                      ? 'text-green-400 border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Field service efficiency metrics"
                >
                  <Target className="w-4 h-4" />
                  Impact
                </button>
                <button
                  onClick={() => setRightPanelView('performance')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    rightPanelView === 'performance'
                      ? 'text-[#C74634] border-b-2 border-[#C74634]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Solver speed & planning efficiency"
                >
                  <BarChart3 className="w-4 h-4" />
                  Performance
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {rightPanelView === 'weather' && <WeatherPanel />}
                {rightPanelView === 'impact' && (
                  <Card variant="bordered" className="h-full">
                    <CardHeader>
                      <CardTitle>Operational Impact</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-60px)] overflow-hidden">
                      <OperationalImpactPanel />
                    </CardContent>
                  </Card>
                )}
                {rightPanelView === 'performance' && (
                  <Card variant="bordered" className="h-full">
                    <CardHeader>
                      <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-60px)]">
                      <PerformanceChart />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
