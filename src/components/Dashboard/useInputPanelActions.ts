import { useRef } from 'react';

import { generateRandomStops } from '@/data/benchmarkData';
import { getUtilisationStats, skyEVStations, evStationsToStops } from '@/data/skyEVData';
import {
  DEFAULT_JOB_TYPE_MIX,
  JOB_TYPE_CONFIGS,
  type JobType,
  type JobTypeMix,
  type OptimizationConfig,
  type Stop,
  type Toast,
} from '@/types';
import { estimatePayloadSize, recommendClusterCount } from '@/utils';

import type { DynamicBenchmarkScenario } from '@/data/locationData';
import type { AppConfig } from '@/store/configStore';

interface UseInputPanelActionsParams {
  config: OptimizationConfig;
  stops: Stop[];
  appConfig: AppConfig;
  isBelron: boolean;
  setConfig: (config: Partial<OptimizationConfig>) => void;
  setStops: (stops: Stop[]) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

export function useInputPanelActions({
  config,
  stops,
  appConfig,
  isBelron,
  setConfig,
  setStops,
  addToast,
}: UseInputPanelActionsParams) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobTypeMix = config.jobTypeMix || DEFAULT_JOB_TYPE_MIX;
  const useJobTypes = config.useJobTypes ?? false;
  const payloadSize = estimatePayloadSize(stops.length);
  const recommendedClusters = recommendClusterCount(stops.length);

  const assignJobTypes = (baseStops: Stop[], mix: JobTypeMix): Stop[] => {
    const totalPercentage = Object.values(mix).reduce((a, b) => a + b, 0);
    if (totalPercentage === 0) return baseStops;

    const types = Object.keys(mix) as JobType[];
    const cumulative: Array<{ type: JobType; threshold: number }> = [];
    let sum = 0;
    for (const type of types) {
      sum += mix[type];
      if (mix[type] > 0) {
        cumulative.push({ type, threshold: sum / totalPercentage });
      }
    }

    return baseStops.map((stop) => {
      const rand = Math.random();
      const selectedType = cumulative.find((c) => rand <= c.threshold)?.type || 'delivery';
      const typeConfig = JOB_TYPE_CONFIGS[selectedType];
      const serviceDuration = Math.floor(
        typeConfig.minDuration + Math.random() * (typeConfig.maxDuration - typeConfig.minDuration)
      );
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

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.trim().split('\n');
        const firstLine = lines[0].toLowerCase();
        const hasHeader =
          firstLine.includes('lat') ||
          firstLine.includes('lng') ||
          firstLine.includes('longitude') ||
          firstLine.includes('latitude');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        const parsedStops: Stop[] = dataLines
          .map((line, index) => {
            const values = line.split(',').map((v) => v.trim());
            let lat: number;
            let lng: number;
            let demand: number;
            let label: string;

            if (values.length >= 5) {
              lat = parseFloat(values[1]);
              lng = parseFloat(values[2]);
              demand = parseInt(values[3]) || 1;
              label = values[4] || `Stop ${index + 1}`;
            } else if (values.length === 4) {
              if (isNaN(parseFloat(values[0]))) {
                label = values[0];
                lat = parseFloat(values[1]);
                lng = parseFloat(values[2]);
                demand = parseInt(values[3]) || 1;
              } else {
                lat = parseFloat(values[1]);
                lng = parseFloat(values[2]);
                demand = parseInt(values[3]) || 1;
                label = `Stop ${index + 1}`;
              }
            } else if (values.length === 3) {
              lat = parseFloat(values[0]);
              lng = parseFloat(values[1]);
              demand = parseInt(values[2]) || 1;
              label = `Stop ${index + 1}`;
            } else {
              lat = parseFloat(values[0]);
              lng = parseFloat(values[1]);
              demand = 1;
              label = `Stop ${index + 1}`;
            }

            return { id: index + 1, lat, lng, demand, label };
          })
          .filter((stop) => !isNaN(stop.lat) && !isNaN(stop.lng));

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadDynamicScenario = (scenario: DynamicBenchmarkScenario) => {
    try {
      const randomStops = generateRandomStops(
        scenario.stops,
        scenario.centerLat,
        scenario.centerLng,
        scenario.radiusKm
      );

      if (isBelron && appConfig.scenarioJobTypes.length > 0) {
        const stopsWithJobTypes = randomStops.map((stop, idx) => {
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
        setStops(randomStops);
      }

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
    const numStops = config.numVehicles * 10;
    const baseStops = generateRandomStops(
      numStops,
      appConfig.defaultCenter.lat,
      appConfig.defaultCenter.lng,
      appConfig.serviceRadius
    );
    const nextStops = useJobTypes && jobTypeMix ? assignJobTypes(baseStops, jobTypeMix) : baseStops;
    setStops(nextStops);
  };

  const handleLoadEVData = () => {
    const evStops = evStationsToStops(skyEVStations);
    setStops(evStops);

    const stats = getUtilisationStats();
    const totalDemand = evStops.reduce((sum, s) => sum + s.demand, 0);
    const maxDemand = Math.max(...evStops.map((s) => s.demand));
    const numVehicles = Math.max(5, Math.ceil(evStops.length / 10));
    const capacityPerVehicle = Math.ceil(totalDemand / numVehicles) + 5;

    setConfig({
      numVehicles,
      vehicleCapacity: capacityPerVehicle,
    });

    addToast({
      type: 'success',
      title: 'EV Data Loaded',
      message: `${stats.totalStations} stations, ${numVehicles} vehicles, capacity: ${capacityPerVehicle}`,
    });
    addToast({
      type: 'info',
      title: 'Demand Calculated',
      message: `Total demand: ${totalDemand} units. Max single: ${maxDemand}. Avg utilisation: ${stats.avgUtilisationRate}%`,
    });
  };

  return {
    fileInputRef,
    jobTypeMix,
    useJobTypes,
    payloadSize,
    recommendedClusters,
    handleCSVUpload,
    handleGenerateStops,
    handleLoadEVData,
    handleLoadDynamicScenario,
  };
}
