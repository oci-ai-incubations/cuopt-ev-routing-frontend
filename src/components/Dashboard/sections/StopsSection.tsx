import { Battery, FileText, MapPin, Upload } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Toggle } from '@/components/shared/Toggle';
import { Tooltip, HelpText } from '@/components/shared/Tooltip';
import { generateDynamicScenarios, type DynamicBenchmarkScenario } from '@/data/locationData';

import type { AppConfig } from '@/store/configStore';
import type { OptimizationConfig, Stop } from '@/types';
import type { ChangeEvent, RefObject } from 'react';

interface StopsSectionProps {
  config: OptimizationConfig;
  stops: Stop[];
  appConfig: AppConfig;
  payloadSize: number;
  recommendedClusters: number;
  fileInputRef: RefObject<HTMLInputElement>;
  setConfig: (config: Partial<OptimizationConfig>) => void;
  onGenerateStops: () => void;
  onLoadEVData: () => void;
  onLoadDynamicScenario: (scenario: DynamicBenchmarkScenario) => void;
  onCSVUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function StopsSection({
  config,
  stops,
  appConfig,
  payloadSize,
  recommendedClusters,
  fileInputRef,
  setConfig,
  onGenerateStops,
  onLoadEVData,
  onLoadDynamicScenario,
  onCSVUpload,
}: StopsSectionProps) {
  return (
    <>
      <div className="bg-dark-bg rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Current Stops</span>
          <span className="text-xl font-bold text-[#C74634] font-mono">{stops.length}</span>
        </div>
        <div className="text-xs text-gray-500">
          Payload: ~{payloadSize.toFixed(1)} MB
          {payloadSize > 2000 && <span className="text-red-400 ml-2">(Exceeds 2GB limit)</span>}
        </div>
        {recommendedClusters > 1 && (
          <div className="text-xs text-yellow-400 mt-1">Recommended: {recommendedClusters} clusters</div>
        )}
      </div>

      <Button
        variant="primary"
        className="w-full"
        leftIcon={<Battery className="w-4 h-4" />}
        onClick={onLoadEVData}
      >
        Load EV Stations
      </Button>

      <Button
        variant="secondary"
        className="w-full"
        leftIcon={<MapPin className="w-4 h-4" />}
        onClick={onGenerateStops}
      >
        Generate Random Stops
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onCSVUpload}
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
        {generateDynamicScenarios(appConfig.countryCode, appConfig.cityId, appConfig.activeScenario).map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onLoadDynamicScenario(scenario)}
            className="w-full text-left p-3 bg-dark-bg rounded-lg hover:bg-dark-hover transition-colors"
          >
            <div className="font-medium text-sm text-white">{scenario.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {scenario.stops} stops • {scenario.vehicles} vehicles
            </div>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-1">
          <Toggle
            className="items-center"
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
          <HelpText>Stops outside time windows will be dropped. Check results for unserved stops.</HelpText>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1">
          <Toggle
            className="items-center"
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
  );
}
