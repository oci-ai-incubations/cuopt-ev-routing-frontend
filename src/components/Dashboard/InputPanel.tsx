import { useState, useRef } from 'react';
import {
  Truck,
  MapPin,
  Settings,
  Zap,
  Upload,
  RotateCcw,
  Play,
  Layers,
  FileText,
  Battery,
  Briefcase,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Slider } from '@/components/shared/Slider';
import { Select } from '@/components/shared/Select';
import { Toggle } from '@/components/shared/Toggle';
import { Tooltip, HelpText } from '@/components/shared/Tooltip';
import { useOptimizationStore, useAppStore, useConfigStore } from '@/store';
import { benchmarkScenarios, generateRandomStops, generateBelronStops } from '@/data/benchmarkData';
import { skyEVStations, evStationsToStops, getUtilisationStats } from '@/data/skyEVData';
import { estimatePayloadSize, recommendClusterCount } from '@/utils';
import type { Stop, JobType, JobTypeMix } from '@/types';
import { JOB_TYPE_CONFIGS, DEFAULT_JOB_TYPE_MIX } from '@/types/cuopt';
import { formatCurrency, generateDynamicScenarios, type DynamicBenchmarkScenario } from '@/data/locationData';

interface InputPanelProps {
  onRunOptimization: () => void;
  onRunParallel: () => void;
}

export function InputPanel({ onRunOptimization, onRunParallel }: InputPanelProps) {
  const { config, setConfig, setStops, stops, reset } = useOptimizationStore();
  const { isOptimizing, addToast } = useAppStore();
  const { config: appConfig, isBelronScenario } = useConfigStore();
  const isBelron = isBelronScenario();

  const [activeSection, setActiveSection] = useState<string>('fleet');
  const [showJobTypes, setShowJobTypes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job type mix state
  const jobTypeMix = config.jobTypeMix || DEFAULT_JOB_TYPE_MIX;
  const useJobTypes = config.useJobTypes ?? false;

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.trim().split('\n');

        // Check if first line is header
        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('lat') || firstLine.includes('lng') ||
                         firstLine.includes('longitude') || firstLine.includes('latitude');

        const dataLines = hasHeader ? lines.slice(1) : lines;

        const parsedStops: Stop[] = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim());

          // Support multiple CSV formats:
          // Format 1: lat,lng
          // Format 2: lat,lng,demand
          // Format 3: id,lat,lng,demand,label
          // Format 4: label,lat,lng,demand

          let lat: number, lng: number, demand: number, label: string;

          if (values.length >= 5) {
            // id,lat,lng,demand,label
            lat = parseFloat(values[1]);
            lng = parseFloat(values[2]);
            demand = parseInt(values[3]) || 1;
            label = values[4] || `Stop ${index + 1}`;
          } else if (values.length === 4) {
            // Could be id,lat,lng,demand or label,lat,lng,demand
            if (isNaN(parseFloat(values[0]))) {
              // label,lat,lng,demand
              label = values[0];
              lat = parseFloat(values[1]);
              lng = parseFloat(values[2]);
              demand = parseInt(values[3]) || 1;
            } else {
              // id,lat,lng,demand
              lat = parseFloat(values[1]);
              lng = parseFloat(values[2]);
              demand = parseInt(values[3]) || 1;
              label = `Stop ${index + 1}`;
            }
          } else if (values.length === 3) {
            // lat,lng,demand
            lat = parseFloat(values[0]);
            lng = parseFloat(values[1]);
            demand = parseInt(values[2]) || 1;
            label = `Stop ${index + 1}`;
          } else {
            // lat,lng
            lat = parseFloat(values[0]);
            lng = parseFloat(values[1]);
            demand = 1;
            label = `Stop ${index + 1}`;
          }

          return {
            id: index + 1,
            lat,
            lng,
            demand,
            label,
          };
        }).filter(stop => !isNaN(stop.lat) && !isNaN(stop.lng));

        if (parsedStops.length === 0) {
          addToast({
            type: 'error',
            title: 'Invalid CSV',
            message: 'No valid stops found in CSV file',
          });
          return;
        }

        setStops(parsedStops);
        addToast({
          type: 'success',
          title: 'CSV Uploaded',
          message: `Loaded ${parsedStops.length} stops from CSV`,
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'CSV Parse Error',
          message: error instanceof Error ? error.message : 'Failed to parse CSV',
        });
      }
    };

    reader.readAsText(file);
    // Reset file input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadScenario = (scenarioId: string) => {
    const scenario = benchmarkScenarios.find((s) => s.id === scenarioId);
    if (scenario) {
      // Special handling for EV Network scenario
      if (scenarioId === 'ev_network') {
        const evStops = evStationsToStops(skyEVStations);
        setStops(evStops);

        // Calculate total demand and set capacity to force multiple vehicles
        const totalDemand = evStops.reduce((sum, s) => sum + s.demand, 0);
        const numVehicles = scenario.vehicles; // 5 vehicles
        // Set capacity so that each vehicle can only carry ~1/5 of total demand
        const capacityPerVehicle = Math.ceil(totalDemand / numVehicles) + 5; // Small buffer

        setConfig({
          numVehicles: numVehicles,
          vehicleCapacity: capacityPerVehicle,
          timeLimit: Math.ceil(scenario.expectedSolveTime),
        });

        addToast({
          type: 'success',
          title: 'EV Network Loaded',
          message: `${evStops.length} stations, ${numVehicles} vehicles, capacity: ${capacityPerVehicle}`,
        });
      } else if (scenarioId === 'belron_london') {
        // Belron-specific scenario with job types and service durations
        try {
          const belronStops = generateBelronStops(scenario.stops, 'London');
          // Convert Belron job types to standard JobType format
          const jobTypeMap: Record<string, JobType> = {
            'CHIP_REPAIR': 'chip_repair',
            'REPLACEMENT': 'replacement',
            'RECALIBRATION': 'recalibration',
          };
          // Convert to standard Stop format while preserving metadata
          const stops: Stop[] = belronStops.map(s => ({
            ...s,
            serviceDuration: s.serviceDuration,
            priority: s.priority,
            jobType: jobTypeMap[s.jobType] || 'replacement',
            requiresEquipment: s.requiresRecalibration,
            metadata: {
              jobType: jobTypeMap[s.jobType] || 'replacement',
              requiresRecalibration: s.requiresRecalibration,
              revenue: s.revenue,
            },
          }));
          setStops(stops);

          // Belron: ~4 jobs per technician per day, 09:00-17:00 with lunch
          const numVehicles = scenario.vehicles;
          const capacityPerVehicle = 5; // Max 5 jobs per technician

          setConfig({
            numVehicles: numVehicles,
            vehicleCapacity: capacityPerVehicle,
            timeLimit: Math.ceil(scenario.expectedSolveTime),
            enableTimeWindows: true,
          });

          const replacements = belronStops.filter(s => s.jobType === 'REPLACEMENT').length;
          const repairs = belronStops.filter(s => s.jobType === 'CHIP_REPAIR').length;

          addToast({
            type: 'success',
            title: 'Belron Scenario Loaded',
            message: `${replacements} replacements, ${repairs} repairs, ${numVehicles} technicians`,
          });
        } catch (error) {
          addToast({
            type: 'error',
            title: 'Scenario Load Failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else {
        const newStops = generateRandomStops(
          scenario.stops,
          scenario.centerLat,
          scenario.centerLng,
          scenario.radiusKm
        );
        setStops(newStops);

        // Calculate appropriate capacity for the scenario
        // Avg demand is ~5.5 per stop, so total demand = stops * 5.5
        // Capacity per vehicle = (total_demand / vehicles) + buffer
        const avgDemand = 5.5;
        const totalDemand = Math.ceil(scenario.stops * avgDemand);
        const minCapacity = Math.ceil(totalDemand / scenario.vehicles) + 10; // +10 buffer
        const safeCapacity = Math.max(minCapacity, 50); // At least 50

        setConfig({
          numVehicles: scenario.vehicles,
          vehicleCapacity: safeCapacity,
          timeLimit: Math.ceil(scenario.expectedSolveTime),
        });

        addToast({
          type: 'info',
          title: 'Scenario Loaded',
          message: `${scenario.stops} stops, ${scenario.vehicles} vehicles, capacity: ${safeCapacity}`,
        });
      }
    }
  };
  // Mark as intentionally available for future use
  void handleLoadScenario;

  // Handle loading dynamic scenarios based on configured location
  const handleLoadDynamicScenario = (scenario: DynamicBenchmarkScenario) => {
    try {
      // Generate random stops based on the scenario's center and radius
      const newStops = generateRandomStops(
        scenario.stops,
        scenario.centerLat,
        scenario.centerLng,
        scenario.radiusKm
      );

      // Apply job types if Belron scenario
      if (isBelron && appConfig.scenarioJobTypes.length > 0) {
        // Assign Belron job types with their durations and revenues
        const stopsWithJobTypes = newStops.map((stop, idx) => {
          // Distribute job types based on default percentages
          const rand = Math.random() * 100;
          let cumulative = 0;
          let selectedJobType = appConfig.scenarioJobTypes[0];

          for (const jt of appConfig.scenarioJobTypes) {
            cumulative += jt.defaultPercentage;
            if (rand <= cumulative) {
              selectedJobType = jt;
              break;
            }
          }

          return {
            ...stop,
            serviceDuration: selectedJobType.duration,
            revenue: selectedJobType.revenue,
            label: `${selectedJobType.label} - Stop ${idx + 1}`,
            metadata: {
              jobType: selectedJobType.id,
              jobLabel: selectedJobType.label,
            },
          };
        });
        setStops(stopsWithJobTypes);
      } else {
        setStops(newStops);
      }

      // Set config for the scenario
      const avgDemand = 5.5;
      const totalDemand = Math.ceil(scenario.stops * avgDemand);
      const minCapacity = Math.ceil(totalDemand / scenario.vehicles) + 10;
      const safeCapacity = Math.max(minCapacity, 50);

      setConfig({
        numVehicles: scenario.vehicles,
        vehicleCapacity: safeCapacity,
        timeLimit: Math.ceil(scenario.expectedSolveTime),
        enableTimeWindows: isBelron,
      });

      addToast({
        type: 'success',
        title: 'Scenario Loaded',
        message: `${scenario.name}: ${scenario.stops} stops, ${scenario.vehicles} vehicles`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Scenario Load Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleGenerateStops = () => {
    // Generate stops using configured location
    const numStops = config.numVehicles * 10;
    const baseStops = generateRandomStops(
      numStops,
      appConfig.defaultCenter.lat,
      appConfig.defaultCenter.lng,
      appConfig.serviceRadius
    );

    // Apply job types if enabled
    if (useJobTypes && jobTypeMix) {
      const stopsWithJobTypes = assignJobTypes(baseStops, jobTypeMix);
      setStops(stopsWithJobTypes);
    } else {
      setStops(baseStops);
    }
  };

  // Assign job types to stops based on the mix percentages
  const assignJobTypes = (stops: Stop[], mix: JobTypeMix): Stop[] => {
    const totalPercentage = Object.values(mix).reduce((a, b) => a + b, 0);
    if (totalPercentage === 0) return stops;

    // Build cumulative distribution
    const types = Object.keys(mix) as JobType[];
    const cumulative: { type: JobType; threshold: number }[] = [];
    let sum = 0;
    for (const type of types) {
      sum += mix[type];
      if (mix[type] > 0) {
        cumulative.push({ type, threshold: sum / totalPercentage });
      }
    }

    return stops.map((stop) => {
      const rand = Math.random();
      const selectedType = cumulative.find((c) => rand <= c.threshold)?.type || 'delivery';
      const typeConfig = JOB_TYPE_CONFIGS[selectedType];

      // Calculate service duration within the type's range
      const serviceDuration = Math.floor(
        typeConfig.minDuration + Math.random() * (typeConfig.maxDuration - typeConfig.minDuration)
      );

      // Add some revenue variance (±20%)
      const revenueVariance = 1 + (Math.random() - 0.5) * 0.4;
      const revenue = Math.round(typeConfig.revenue * revenueVariance);

      return {
        ...stop,
        jobType: selectedType,
        serviceDuration,
        revenue,
        requiresEquipment: typeConfig.requiresEquipment,
      };
    });
  };

  const handleLoadEVData = () => {
    // Load EV charging station data with utilisation-based demand
    const evStops = evStationsToStops(skyEVStations);
    setStops(evStops);

    // Get utilisation statistics
    const stats = getUtilisationStats();

    // Calculate demand info and set appropriate vehicle capacity
    const totalDemand = evStops.reduce((sum, s) => sum + s.demand, 0);
    const maxDemand = Math.max(...evStops.map((s) => s.demand));

    // Set capacity to force multiple vehicles (5 vehicles for 50 stations)
    const numVehicles = Math.max(5, Math.ceil(evStops.length / 10)); // ~10 stops per vehicle
    const capacityPerVehicle = Math.ceil(totalDemand / numVehicles) + 5; // Small buffer

    setConfig({
      numVehicles: numVehicles,
      vehicleCapacity: capacityPerVehicle,
    });

    // Show detailed statistics
    addToast({
      type: 'success',
      title: 'EV Data Loaded',
      message: `${stats.totalStations} stations, ${numVehicles} vehicles, capacity: ${capacityPerVehicle}`,
    });

    // Additional toast with demand info
    addToast({
      type: 'info',
      title: 'Demand Calculated',
      message: `Total demand: ${totalDemand} units. Max single: ${maxDemand}. Avg utilisation: ${stats.avgUtilisationRate}%`,
    });
  };

  const payloadSize = estimatePayloadSize(stops.length);
  const recommendedClusters = recommendClusterCount(stops.length);

  return (
    <div className="w-80 bg-dark-card border-r border-dark-border overflow-y-auto">
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: '#C74634' }} />
          Configuration
        </h2>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-dark-border">
        {[
          { id: 'fleet', icon: Truck, label: 'Fleet' },
          { id: 'stops', icon: MapPin, label: 'Stops' },
          { id: 'solver', icon: Zap, label: 'Solver' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? 'border-b-2'
                : 'text-gray-400 hover:text-white'
            }`}
            style={activeSection === tab.id ? { color: '#C74634', borderColor: '#C74634' } : undefined}
          >
            <tab.icon className="w-4 h-4 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* Fleet Configuration */}
        {activeSection === 'fleet' && (
          <>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Number of Vehicles</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Available Fleet Size</p>
                      <p>Maximum number of vehicles/technicians available.</p>
                      <p className="text-gray-400">Solver will use only as many as needed.</p>
                      <p className="text-green-400">Results show: &quot;Used / Available&quot;</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Slider
                min={1}
                max={200}
                value={config.numVehicles}
                onChange={(e) =>
                  setConfig({ numVehicles: parseInt(e.target.value) })
                }
                valueFormatter={(v) => `${v} vehicles`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Vehicle Capacity</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Per-Vehicle Capacity</p>
                      <p>Maximum load each vehicle can carry.</p>
                      <p>Each stop has a demand value that consumes capacity.</p>
                      <p className="text-yellow-400">If capacity is too low, stops will be dropped!</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Slider
                min={1}
                max={500}
                step={1}
                value={config.vehicleCapacity}
                onChange={(e) =>
                  setConfig({ vehicleCapacity: parseInt(e.target.value) })
                }
                valueFormatter={(v) => `${v} units`}
              />
              {stops.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Total demand: {stops.reduce((sum, s) => sum + s.demand, 0)} units
                  {' | '}Max single: {Math.max(...stops.map(s => s.demand))} units
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Default Service Time</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Job Duration / Dwell Time</p>
                      <p>Time spent at each stop (delivery, repair, service call).</p>
                      <p className="text-gray-400">Examples:</p>
                      <ul className="text-gray-400 list-disc list-inside">
                        <li>Parcel delivery: 2-5 min</li>
                        <li>Chip repair: 30-60 min</li>
                        <li>Windscreen replacement: 90 min</li>
                      </ul>
                      <p className="text-green-400 mt-1">Per-stop times override this default.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Slider
                min={0}
                max={120}
                step={5}
                value={config.defaultServiceTime || 0}
                onChange={(e) =>
                  setConfig({ defaultServiceTime: parseInt(e.target.value) })
                }
                valueFormatter={(v) => v === 0 ? 'None (instant)' : `${v} minutes`}
              />
            </div>

            {/* Home-Start Routing */}
            <div className="pt-3 border-t border-dark-border space-y-2">
              <div className="flex items-center gap-1">
                <Toggle
                  label="Home-Start Routing"
                  checked={config.enableHomeStart ?? false}
                  onChange={(e) => setConfig({ enableHomeStart: e.target.checked })}
                />
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Field Service Mode</p>
                      <p>When enabled, technicians start from their home locations instead of a central depot.</p>
                      <p className="text-gray-400">Home locations are randomly generated within the service area.</p>
                      <p className="text-green-400 mt-1">Ideal for Belron-style field service operations.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              {config.enableHomeStart && (
                <div className="flex items-center gap-1 ml-4">
                  <Toggle
                    label="Return to Depot"
                    checked={config.returnToDepot ?? true}
                    onChange={(e) => setConfig({ returnToDepot: e.target.checked })}
                  />
                  <Tooltip
                    content={
                      <div className="space-y-1">
                        <p className="font-medium">End-of-Day Location</p>
                        <p><span className="text-green-400">Enabled:</span> Vehicles return to depot at end of shift.</p>
                        <p><span className="text-yellow-400">Disabled:</span> Vehicles end at their home location.</p>
                      </div>
                    }
                    position="right"
                  />
                </div>
              )}
            </div>

            {/* Revenue-Weighted Optimization */}
            {useJobTypes && (
              <div className="flex items-center gap-1">
                <Toggle
                  label="Prioritize by Revenue"
                  checked={config.prioritizeByRevenue ?? false}
                  onChange={(e) => setConfig({ prioritizeByRevenue: e.target.checked })}
                />
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Revenue-Based Priority</p>
                      <p>When enabled, the optimizer will prioritize higher-revenue jobs.</p>
                      <p className="text-gray-400">Useful when capacity is limited and not all jobs can be served.</p>
                      <p className="text-green-400 mt-1">Requires job types to be enabled.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Objective</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Optimization Goal</p>
                      <p><span className="text-blue-400">Distance:</span> Shortest total route length</p>
                      <p><span className="text-green-400">Time:</span> Fastest completion time</p>
                      <p><span className="text-yellow-400">Vehicles:</span> Use fewest vehicles (balanced routes)</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Select
                options={[
                  { value: 'minimize_distance', label: 'Minimize Distance' },
                  { value: 'minimize_time', label: 'Minimize Time' },
                  { value: 'minimize_vehicles', label: 'Minimize Vehicles' },
                ]}
                value={config.objective}
                onChange={(e) =>
                  setConfig({ objective: e.target.value as typeof config.objective })
                }
              />
            </div>

            {/* Job Type Configuration */}
            <div className="pt-3 border-t border-dark-border">
              <button
                onClick={() => setShowJobTypes(!showJobTypes)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C74634]" />
                  <span>Job Type Mix</span>
                  {isBelron && (
                    <span className="text-xs bg-oracle-red/20 text-oracle-red px-2 py-0.5 rounded">Belron</span>
                  )}
                </div>
                {showJobTypes ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {showJobTypes && (
                <div className="mt-3 space-y-3">
                  {/* Belron-specific job types */}
                  {isBelron ? (
                    <div className="space-y-2 bg-dark-bg rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-2">
                        Belron Job Types (with revenue)
                      </div>
                      {appConfig.scenarioJobTypes.map((jt) => (
                        <div
                          key={jt.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-dark-border"
                          style={{ borderLeftColor: jt.color, borderLeftWidth: 3 }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: jt.color }}
                            />
                            <span className="text-sm text-white">{jt.label}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono text-[#C74634]">
                              {formatCurrency(jt.revenue, appConfig.currency)}
                            </div>
                            <div className="text-xs text-gray-500">{jt.duration} min</div>
                          </div>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 mt-2 p-2 bg-dark-card rounded">
                        <div className="font-medium text-gray-400 mb-1">Default Mix:</div>
                        {appConfig.scenarioJobTypes.map((jt) => (
                          <span key={jt.id} className="mr-2">
                            {jt.label}: {jt.defaultPercentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <Toggle
                          label="Enable Job Types"
                          checked={useJobTypes}
                          onChange={(e) => setConfig({
                            useJobTypes: e.target.checked,
                            jobTypeMix: e.target.checked ? DEFAULT_JOB_TYPE_MIX : undefined,
                          })}
                        />
                        <Tooltip
                          content={
                            <div className="space-y-1">
                              <p className="font-medium">Job Type Differentiation</p>
                              <p>When enabled, stops are assigned different job types with varying service durations:</p>
                              <ul className="text-gray-400 list-disc list-inside mt-1">
                                <li>Chip Repair: 30-60 min</li>
                                <li>Replacement: 60-120 min</li>
                                <li>Recalibration: 60-90 min</li>
                                <li>Maintenance: 30-120 min</li>
                              </ul>
                            </div>
                          }
                          position="right"
                        />
                      </div>

                      {useJobTypes && (
                        <div className="space-y-2 bg-dark-bg rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-2">
                            Adjust job type distribution (total: {
                              Object.values(jobTypeMix).reduce((a, b) => a + b, 0)
                            }%)
                          </div>
                          {(Object.keys(JOB_TYPE_CONFIGS) as JobType[]).map((type) => {
                            const typeConfig = JOB_TYPE_CONFIGS[type];
                            return (
                              <div key={type} className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: typeConfig.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-300 truncate">{typeConfig.label}</span>
                                    <span className="text-[#C74634] font-mono">
                                      {formatCurrency(typeConfig.revenue, appConfig.currency)} | {jobTypeMix[type]}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={jobTypeMix[type]}
                                    onChange={(e) => {
                                      const newMix = {
                                        ...jobTypeMix,
                                        [type]: parseInt(e.target.value),
                                      };
                                      setConfig({ jobTypeMix: newMix });
                                    }}
                                    className="w-full h-1 bg-dark-border rounded-lg appearance-none cursor-pointer accent-[#C74634]"
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-16 shrink-0">
                                  ~{typeConfig.defaultDuration}min
                                </span>
                              </div>
                            );
                          })}
                          <div className="text-xs text-gray-500 mt-2">
                            Service times are assigned based on job type during stop generation.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Stops Configuration */}
        {activeSection === 'stops' && (
          <>
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Current Stops</span>
                <span className="text-xl font-bold text-[#C74634] font-mono">
                  {stops.length}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Payload: ~{payloadSize.toFixed(1)} MB
                {payloadSize > 2000 && (
                  <span className="text-red-400 ml-2">(Exceeds 2GB limit)</span>
                )}
              </div>
              {recommendedClusters > 1 && (
                <div className="text-xs text-yellow-400 mt-1">
                  Recommended: {recommendedClusters} clusters
                </div>
              )}
            </div>

            <Button
              variant="primary"
              className="w-full"
              leftIcon={<Battery className="w-4 h-4" />}
              onClick={handleLoadEVData}
            >
              Load EV Stations
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<MapPin className="w-4 h-4" />}
              onClick={handleGenerateStops}
            >
              Generate Random Stops
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCSVUpload}
              accept=".csv,.txt"
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>

            {/* CSV Format Help */}
            <div className="text-xs text-gray-500 bg-dark-bg rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3" />
                <span className="font-medium">CSV Format:</span>
              </div>
              <code className="text-gray-400">lat,lng,demand</code>
              <br />
              <span className="text-gray-600">or: label,lat,lng,demand</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Load Benchmark Scenario
                <span className="ml-2 text-xs text-gray-500">
                  ({appConfig.countryCode} - {appConfig.cityId})
                </span>
              </label>
              {/* Dynamic scenarios based on selected location */}
              {generateDynamicScenarios(appConfig.countryCode, appConfig.cityId, appConfig.activeScenario).map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleLoadDynamicScenario(scenario)}
                  className="w-full text-left p-3 bg-dark-bg rounded-lg hover:bg-dark-hover transition-colors"
                >
                  <div className="font-medium text-sm text-white">
                    {scenario.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {scenario.stops} stops • {scenario.vehicles} vehicles
                  </div>
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-1">
                <Toggle
                  label="Enable Time Windows"
                  checked={config.enableTimeWindows}
                  onChange={(e) => setConfig({ enableTimeWindows: e.target.checked })}
                />
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Time Window Constraints</p>
                      <p>When enabled, stops must be visited within their specified time windows.</p>
                      <p className="text-yellow-400">Stops that cannot be reached in time will be DROPPED from the solution.</p>
                      <p className="text-gray-400 mt-1">Default vehicle shift: 8 hours (480 min)</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              {config.enableTimeWindows && (
                <HelpText>
                  Stops outside time windows will be dropped. Check results for unserved stops.
                </HelpText>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1">
                <Toggle
                  label="Enable Capacity Constraints"
                  checked={config.enableCapacity}
                  onChange={(e) => setConfig({ enableCapacity: e.target.checked })}
                />
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Vehicle Capacity Limits</p>
                      <p>Each vehicle has a maximum capacity. Stops have demand that consumes capacity.</p>
                      <p className="text-yellow-400">If total demand exceeds fleet capacity, some stops will be DROPPED.</p>
                      <p className="text-gray-400 mt-1">Set capacity in Fleet tab.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
            </div>
          </>
        )}

        {/* Solver Configuration */}
        {activeSection === 'solver' && (
          <>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Time Limit</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Solver Time Limit</p>
                      <p>Maximum time the solver will spend optimizing.</p>
                      <p className="text-gray-400">Longer time = better solution quality.</p>
                      <p className="text-yellow-400">Note: This is a soft limit. Solver may slightly exceed it.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Slider
                min={10}
                max={300}
                step={10}
                value={config.timeLimit}
                onChange={(e) =>
                  setConfig({ timeLimit: parseInt(e.target.value) })
                }
                valueFormatter={(v) => `${v} seconds`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Parallel Jobs</span>
                <Tooltip
                  content={
                    <div className="space-y-2 max-w-xs">
                      <p className="font-medium">Geographic Clustering</p>
                      <p>Splits stops into N geographic clusters, solving each independently.</p>

                      <div className="pt-1 border-t border-dark-border">
                        <p className="text-green-400 font-medium text-xs">When to use:</p>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          <li>Large datasets (1000+ stops)</li>
                          <li>Payload exceeds GPU memory</li>
                          <li>Need faster initial results</li>
                        </ul>
                      </div>

                      <div className="pt-1 border-t border-dark-border">
                        <p className="text-red-400 font-medium text-xs">Why it can worsen results:</p>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          <li>Cluster boundaries break optimal routes</li>
                          <li>Cross-cluster deliveries become impossible</li>
                          <li>Each cluster has fewer vehicles, less flexibility</li>
                          <li>Global optimization sees the full picture; clustering cannot</li>
                        </ul>
                      </div>

                      <p className="text-yellow-400 text-xs">Recommendation: Use single job for &lt;500 stops unless payload size is a concern.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Slider
                min={1}
                max={8}
                value={config.parallelJobs}
                onChange={(e) =>
                  setConfig({ parallelJobs: parseInt(e.target.value) })
                }
                valueFormatter={(v) => v === 1 ? '1 job (single solve)' : `${v} parallel jobs`}
              />
              {/* Parallel jobs warnings */}
              {config.parallelJobs > 1 && stops.length < 500 && (
                <HelpText variant="warning">
                  Parallel mode may increase total distance by 10-30% for small datasets.
                  Cluster boundaries prevent optimal cross-region routing.
                  Use single optimization for best quality.
                </HelpText>
              )}
              {config.parallelJobs > 1 && config.numVehicles < config.parallelJobs * 2 && (
                <HelpText variant="warning">
                  Too few vehicles for {config.parallelJobs} clusters. Each cluster needs 2+ vehicles.
                  Reduce parallel jobs to {Math.max(1, Math.floor(config.numVehicles / 2))} or add more vehicles.
                </HelpText>
              )}
              {config.parallelJobs > 1 && stops.length >= 500 && config.numVehicles >= config.parallelJobs * 2 && (
                <HelpText variant="success">
                  Good configuration: ~{Math.ceil(stops.length / config.parallelJobs)} stops, ~{Math.floor(config.numVehicles / config.parallelJobs)} vehicles per cluster.
                </HelpText>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-300">Solver Mode</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium">Optimization Intensity</p>
                      <p><span className="text-blue-400">Quality:</span> More parallel searches (256 climbers). Best solution, slower.</p>
                      <p><span className="text-green-400">Balanced:</span> Moderate searches (128 climbers). Good tradeoff.</p>
                      <p><span className="text-yellow-400">Speed:</span> Fewer searches (64 climbers). Faster, may miss optimal.</p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <Select
                options={[
                  { value: 'quality', label: 'Quality (slower, best solution)' },
                  { value: 'balanced', label: 'Balanced (recommended)' },
                  { value: 'speed', label: 'Speed (faster, good solution)' },
                ]}
                value={config.solverMode}
                onChange={(e) =>
                  setConfig({ solverMode: e.target.value as typeof config.solverMode })
                }
              />
            </div>

            {/* Expected solve time based on mode */}
            <div className="pt-2 border-t border-dark-border">
              <div className="text-xs text-gray-400 mb-2">
                Expected solve time ({config.solverMode} mode):
              </div>
              <div className="text-lg font-mono text-[#C74634]">
                ~{Math.ceil(
                  stops.length / 20 *
                  (config.solverMode === 'quality' ? 1.5 : config.solverMode === 'speed' ? 0.7 : 1)
                )}s
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stops.length} stops × {config.numVehicles} vehicles
              </div>
            </div>

            {/* Hardware Scalability Info */}
            <div className="pt-2 border-t border-dark-border">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Hardware Scalability</span>
                <Tooltip
                  content={
                    <div className="space-y-2 max-w-xs">
                      <p className="font-medium text-white">cuOPT Performance Scaling</p>

                      <div>
                        <p className="text-gray-300 text-xs font-medium">GPU Memory Impact:</p>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          <li>8GB VRAM: Up to ~3,000 stops</li>
                          <li>16GB VRAM: Up to ~5,000 stops</li>
                          <li>24GB VRAM: Up to ~7,500 stops</li>
                          <li>40GB+ VRAM: 10,000+ stops</li>
                        </ul>
                      </div>

                      <div>
                        <p className="text-gray-300 text-xs font-medium">Multi-GPU Scaling:</p>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          <li>Near-linear scaling for parallel jobs</li>
                          <li>4 GPUs can run 4x more clusters</li>
                          <li>Recommended: 1 cluster per GPU</li>
                        </ul>
                      </div>

                      <div>
                        <p className="text-gray-300 text-xs font-medium">Payload Size Formula:</p>
                        <p className="text-xs text-gray-400 font-mono">~43.2 × N² bytes</p>
                        <p className="text-xs text-gray-500">(N = stops + 1 for depot)</p>
                      </div>

                      <p className="text-xs text-gray-500 pt-1 border-t border-dark-border">
                        Current config: ~{(43.2 * Math.pow(stops.length + 1, 2) / (1024 * 1024)).toFixed(1)} MB payload
                      </p>
                    </div>
                  }
                  position="right"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Payload: ~{(43.2 * Math.pow(stops.length + 1, 2) / (1024 * 1024)).toFixed(1)} MB
                {stops.length > 5000 && (
                  <span className="text-yellow-400 ml-1">(Consider clustering)</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-dark-border space-y-2">
        <Button
          variant="primary"
          className="w-full"
          size="lg"
          leftIcon={<Play className="w-5 h-5" />}
          onClick={onRunOptimization}
          isLoading={isOptimizing}
          disabled={stops.length === 0 || isOptimizing}
        >
          {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
        </Button>

        {config.parallelJobs > 1 && (
          <Button
            variant="secondary"
            className="w-full"
            leftIcon={<Layers className="w-4 h-4" />}
            onClick={onRunParallel}
            disabled={stops.length === 0 || isOptimizing}
            isLoading={isOptimizing}
          >
            {isOptimizing ? 'Processing...' : `Run Parallel (${config.parallelJobs} jobs)`}
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={reset}
          disabled={isOptimizing}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
