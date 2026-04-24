import { Select } from '@/components/shared/Select';
import { Slider } from '@/components/shared/Slider';
import { HelpText, Tooltip } from '@/components/shared/Tooltip';

import type { OptimizationConfig, Stop } from '@/types';

interface SolverSectionProps {
  config: OptimizationConfig;
  stops: Stop[];
  setConfig: (config: Partial<OptimizationConfig>) => void;
}

export function SolverSection({ config, stops, setConfig }: SolverSectionProps) {
  return (
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
          onChange={(e) => setConfig({ timeLimit: parseInt(e.target.value) })}
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
                <p className="text-yellow-400 text-xs">
                  Recommendation: Use single job for &lt;500 stops unless payload size is a concern.
                </p>
              </div>
            }
            position="right"
          />
        </div>
        <Slider
          min={1}
          max={8}
          value={config.parallelJobs}
          onChange={(e) => setConfig({ parallelJobs: parseInt(e.target.value) })}
          valueFormatter={(v) => (v === 1 ? '1 job (single solve)' : `${v} parallel jobs`)}
        />
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
          onChange={(e) => setConfig({ solverMode: e.target.value as OptimizationConfig['solverMode'] })}
        />
      </div>

      <div className="pt-2 border-t border-dark-border">
        <div className="text-xs text-gray-400 mb-2">Expected solve time ({config.solverMode} mode):</div>
        <div className="text-lg font-mono text-[#C74634]">
          ~{(() => {
            const modeMultipliers: Record<string, number> = { quality: 1.5, speed: 0.7 };
            return Math.ceil((stops.length / 20) * (modeMultipliers[config.solverMode] ?? 1));
          })()}s
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {stops.length} stops × {config.numVehicles} vehicles
        </div>
      </div>

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
          {stops.length > 5000 && <span className="text-yellow-400 ml-1">(Consider clustering)</span>}
        </div>
      </div>
    </>
  );
}
