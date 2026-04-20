import { Info, XCircle } from 'lucide-react';

interface TimeFactorInfoProps {
  onClose: () => void;
}

export function TimeFactorInfo({ onClose }: TimeFactorInfoProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-lg p-4 max-w-md shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Time Factor Calculation
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-gray-300">
          <div>
            <p className="font-medium text-white mb-1">What is the Time Factor?</p>
            <p>A multiplier applied to estimated travel times based on weather conditions. E.g., 1.15x means 15% longer travel time.</p>
          </div>

          <div>
            <p className="font-medium text-white mb-1">How is it calculated?</p>
            <p className="text-gray-400">Based on a lookup table derived from UK transport research:</p>
            <ul className="mt-1 space-y-1 text-xs text-gray-400">
              <li>• <span className="text-green-400">Clear/Sunny:</span> 1.00x (no impact)</li>
              <li>• <span className="text-blue-400">Light rain:</span> 1.05x - 1.10x</li>
              <li>• <span className="text-yellow-400">Heavy rain:</span> 1.15x - 1.25x</li>
              <li>• <span className="text-blue-200">Snow/Ice:</span> 1.30x - 1.50x</li>
              <li>• <span className="text-gray-400">Fog (visibility &lt;1km):</span> 1.20x - 1.40x</li>
              <li>• <span className="text-orange-400">High winds (&gt;40mph):</span> +0.05x additional</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-white mb-1">Scope of Application</p>
            <p className="text-gray-300 mb-2">Weather impacts are calculated <span className="text-[#C74634] font-medium">per stop location</span>, then combined:</p>
            <ul className="mt-1 space-y-1 text-xs text-gray-400">
              <li>• <span className="text-blue-400">Per-Stop:</span> Each delivery location gets its own weather assessment</li>
              <li>• <span className="text-green-400">Overall Factor:</span> Average of all stop factors, shown in summary</li>
              <li>• <span className="text-yellow-400">Affected Areas:</span> Stops with severe weather are flagged for review</li>
            </ul>
            <p className="text-gray-400 text-xs mt-2">
              This means routes through different weather zones will see varying impacts. Check individual stops for location-specific conditions.
            </p>
          </div>

          <div className="pt-2 border-t border-dark-border">
            <p className="text-xs text-gray-500">
              <strong>Data Source:</strong> OpenWeatherMap API (mock data when API key not configured).
              Factors based on UK Highways Agency research on weather impact to journey times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
