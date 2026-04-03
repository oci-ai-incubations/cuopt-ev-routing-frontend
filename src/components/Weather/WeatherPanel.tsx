import { useEffect } from 'react';
import { useState } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toggle } from '@/components/shared/Toggle';
import { useWeatherStore, useOptimizationStore } from '@/store';
import type { AdverseConditionLevel, WeatherRoutingImpact } from '@/types/weather';

// Weather icon component
function WeatherIcon({ conditionId, size = 20 }: { conditionId: number; size?: number }) {
  // Map OpenWeatherMap condition codes to icons
  if (conditionId >= 200 && conditionId < 300) {
    return <CloudRain className="text-yellow-400" style={{ width: size, height: size }} />;
  } else if (conditionId >= 300 && conditionId < 600) {
    return <CloudRain className="text-blue-400" style={{ width: size, height: size }} />;
  } else if (conditionId >= 600 && conditionId < 700) {
    return <CloudSnow className="text-blue-200" style={{ width: size, height: size }} />;
  } else if (conditionId >= 700 && conditionId < 800) {
    return <Cloud className="text-gray-400" style={{ width: size, height: size }} />;
  } else if (conditionId === 800) {
    return <Sun className="text-yellow-400" style={{ width: size, height: size }} />;
  } else {
    return <Cloud className="text-gray-400" style={{ width: size, height: size }} />;
  }
}

// Severity badge component
function SeverityBadge({ level }: { level: AdverseConditionLevel }) {
  const colors: Record<AdverseConditionLevel, string> = {
    none: 'bg-green-500/20 text-green-400 border-green-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    severe: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels: Record<AdverseConditionLevel, string> = {
    none: 'Good',
    low: 'Minor',
    moderate: 'Moderate',
    high: 'Adverse',
    severe: 'Severe',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[level]}`}>
      {labels[level]}
    </span>
  );
}

// Impact row component
function ImpactRow({ impact }: { impact: WeatherRoutingImpact }) {
  const temp = impact.weather.temperature;
  const wind = Math.round(impact.weather.windSpeed * 2.237); // m/s to mph
  const condition = impact.weather.conditions[0];

  return (
    <div
      className={`p-3 rounded-lg border ${
        impact.skipRecommended
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-dark-bg border-dark-border'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {condition && <WeatherIcon conditionId={condition.id} size={16} />}
          <span className="text-sm font-medium text-white truncate max-w-[150px]">
            {impact.stopName}
          </span>
        </div>
        <SeverityBadge level={impact.assessment.level} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Thermometer className="w-3 h-3" />
          <span>{Math.round(temp)}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="w-3 h-3" />
          <span>{wind} mph</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>+{impact.estimatedDelay}m</span>
        </div>
      </div>

      {impact.skipRecommended && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3" />
          <span>Consider postponing this stop</span>
        </div>
      )}
    </div>
  );
}

// Time factor explanation popup
function TimeFactorInfo({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-lg p-4 max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
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

export function WeatherPanel() {
  const { stops } = useOptimizationStore();
  const {
    enabled,
    setEnabled,
    isLoading,
    lastUpdate,
    overallAssessment,
    routingImpacts,
    fetchRoutingImpacts,
    error,
  } = useWeatherStore();
  const [showTimeFactorInfo, setShowTimeFactorInfo] = useState(false);

  // Fetch weather when stops change
  useEffect(() => {
    if (enabled && stops.length > 0) {
      fetchRoutingImpacts(stops);
    }
  }, [stops, enabled, fetchRoutingImpacts]);

  // Sort impacts by severity
  const sortedImpacts = [...routingImpacts].sort((a, b) => {
    const order = ['severe', 'high', 'moderate', 'low', 'none'];
    return order.indexOf(a.assessment.level) - order.indexOf(b.assessment.level);
  });

  const stopsWithIssues = routingImpacts.filter((i) => i.assessment.level !== 'none').length;
  const skippableStops = routingImpacts.filter((i) => i.skipRecommended).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            Weather Conditions
          </CardTitle>
          <Toggle
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            label=""
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {!enabled ? (
          <div className="text-center text-gray-400 py-8">
            <Cloud className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Weather monitoring disabled</p>
            <p className="text-xs mt-1">Enable to see route conditions</p>
          </div>
        ) : stops.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Cloud className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No stops loaded</p>
            <p className="text-xs mt-1">Load stops to check weather</p>
          </div>
        ) : isLoading ? (
          <div className="text-center text-gray-400 py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p className="text-sm">Checking weather conditions...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
            <p className="text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => fetchRoutingImpacts(stops)}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Assessment */}
            {overallAssessment && (
              <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Overall Conditions
                  </span>
                  <SeverityBadge level={overallAssessment.level} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`w-5 h-5 ${
                        overallAssessment.safetyScore >= 70
                          ? 'text-green-400'
                          : overallAssessment.safetyScore >= 40
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    />
                    <div>
                      <div className="text-lg font-bold text-white">
                        {overallAssessment.safetyScore}%
                      </div>
                      <div className="text-xs text-gray-400">Safety Score</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-lg font-bold text-white">
                        {overallAssessment.travelTimeMultiplier}x
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        Time Factor
                        <button
                          onClick={() => setShowTimeFactorInfo(true)}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                          title="How is this calculated?"
                        >
                          <HelpCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-dark-border pt-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>{stops.length - stopsWithIssues} OK</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    <span>{stopsWithIssues} Issues</span>
                  </div>
                  {skippableStops > 0 && (
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400" />
                      <span>{skippableStops} Risky</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {overallAssessment && overallAssessment.recommendations.length > 0 && (
              <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                <div className="text-xs font-medium text-gray-300 mb-2">
                  Recommendations
                </div>
                <ul className="space-y-1">
                  {overallAssessment.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-[#C74634] mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stops with Issues */}
            {stopsWithIssues > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-300 mb-2">
                  Stops with Weather Issues ({stopsWithIssues})
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sortedImpacts
                    .filter((i) => i.assessment.level !== 'none')
                    .slice(0, 10)
                    .map((impact) => (
                      <ImpactRow key={impact.stopId} impact={impact} />
                    ))}
                  {stopsWithIssues > 10 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      +{stopsWithIssues - 10} more stops with issues
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-dark-border">
                <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<RefreshCw className="w-3 h-3" />}
                  onClick={() => fetchRoutingImpacts(stops)}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Time Factor Info Popup */}
      {showTimeFactorInfo && (
        <TimeFactorInfo onClose={() => setShowTimeFactorInfo(false)} />
      )}
    </Card>
  );
}
