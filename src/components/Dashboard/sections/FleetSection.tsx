import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';

import { Select } from '@/components/shared/Select';
import { Slider } from '@/components/shared/Slider';
import { Toggle } from '@/components/shared/Toggle';
import { Tooltip } from '@/components/shared/Tooltip';
import { formatCurrency } from '@/data/locationData';
import {
  DEFAULT_JOB_TYPE_MIX,
  JOB_TYPE_CONFIGS,
  type JobType,
  type JobTypeMix,
  type OptimizationConfig,
  type Stop,
} from '@/types';

import type { AppConfig } from '@/store/configStore';
import type { Dispatch, SetStateAction } from 'react';


interface FleetSectionProps {
  config: OptimizationConfig;
  stops: Stop[];
  setConfig: (config: Partial<OptimizationConfig>) => void;
  appConfig: AppConfig;
  isBelron: boolean;
  showJobTypes: boolean;
  setShowJobTypes: Dispatch<SetStateAction<boolean>>;
  useJobTypes: boolean;
  jobTypeMix: JobTypeMix;
}

export function FleetSection({
  config,
  stops,
  setConfig,
  appConfig,
  isBelron,
  showJobTypes,
  setShowJobTypes,
  useJobTypes,
  jobTypeMix,
}: FleetSectionProps) {
  return (
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
          onChange={(e) => setConfig({ numVehicles: parseInt(e.target.value) })}
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
          onChange={(e) => setConfig({ vehicleCapacity: parseInt(e.target.value) })}
          valueFormatter={(v) => `${v} units`}
        />
        {stops.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Total demand: {stops.reduce((sum, s) => sum + s.demand, 0)} units
            {' | '}Max single: {Math.max(...stops.map((s) => s.demand))} units
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
          onChange={(e) => setConfig({ defaultServiceTime: parseInt(e.target.value) })}
          valueFormatter={(v) => (v === 0 ? 'None (instant)' : `${v} minutes`)}
        />
      </div>

      <div className="pt-3 border-t border-dark-border space-y-2">
        <div className="flex items-center gap-1">
          <Toggle
            label="Home-Start Routing"
            className="items-center [&>div:first-child]:mt-0"
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
              className="items-center [&>div:first-child]:mt-0"
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
          id="fleet-objective"
          name="objective"
          options={[
            { value: 'minimize_distance', label: 'Minimize Distance' },
            { value: 'minimize_time', label: 'Minimize Time' },
            { value: 'minimize_vehicles', label: 'Minimize Vehicles' },
          ]}
          value={config.objective}
          onChange={(e) => setConfig({ objective: e.target.value as OptimizationConfig['objective'] })}
        />
      </div>

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
          {showJobTypes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {showJobTypes && (
          <div className="mt-3 space-y-3">
            {isBelron ? (
              <div className="space-y-2 bg-dark-bg rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">Belron Job Types (with revenue)</div>
                {appConfig.scenarioJobTypes.map((jt) => (
                  <div
                    key={jt.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-dark-border"
                    style={{ borderLeftColor: jt.color, borderLeftWidth: 3 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: jt.color }} />
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
                    onChange={(e) =>
                      setConfig({
                        useJobTypes: e.target.checked,
                        jobTypeMix: e.target.checked ? DEFAULT_JOB_TYPE_MIX : undefined,
                      })
                    }
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
                      Adjust job type distribution (total: {Object.values(jobTypeMix).reduce((a, b) => a + b, 0)}%)
                    </div>
                    {(Object.keys(JOB_TYPE_CONFIGS) as JobType[]).map((type) => {
                      const typeConfig = JOB_TYPE_CONFIGS[type];
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: typeConfig.color }} />
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
                                const newMix = { ...jobTypeMix, [type]: parseInt(e.target.value) };
                                setConfig({ jobTypeMix: newMix });
                              }}
                              className="w-full h-1 bg-dark-border rounded-lg appearance-none cursor-pointer accent-[#C74634]"
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-16 shrink-0">~{typeConfig.defaultDuration}min</span>
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
  );
}
