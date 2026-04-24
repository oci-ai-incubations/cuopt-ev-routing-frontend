import {
  Cloud,
  AlertTriangle,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useEffect , useState } from 'react';

import { Button } from '@/components/shared/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Toggle } from '@/components/shared/Toggle';
import { useWeatherStore, useOptimizationStore } from '@/store';

import { ImpactRow } from './ImpactRow';
import { SeverityBadge } from './SeverityBadge';
import { TimeFactorInfo } from './TimeFactorInfo';

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

  const getSafetyColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderWeatherContent = () => {
    if (!enabled) {
      return (
        <div className="text-center py-12 text-gray-400 flex-1 flex flex-col items-center justify-center">
          <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Weather monitoring disabled</p>
          <p className="text-sm mt-1">Enable to see route conditions</p>
        </div>
      );
    }
    if (stops.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400 flex-1 flex flex-col items-center justify-center">
          <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No stops loaded</p>
          <p className="text-sm mt-1">Load stops to check weather</p>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="text-center text-gray-400 py-8">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
          <p className="text-sm">Checking weather conditions...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center text-red-400 py-8">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => fetchRoutingImpacts(stops)}>
            Retry
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {overallAssessment && (
          <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">Overall Conditions</span>
              <SeverityBadge level={overallAssessment.level} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${getSafetyColor(overallAssessment.safetyScore)}`} />
                <div>
                  <div className="text-lg font-bold text-white">{overallAssessment.safetyScore}%</div>
                  <div className="text-xs text-gray-400">Safety Score</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{overallAssessment.travelTimeMultiplier}x</div>
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
        {overallAssessment && overallAssessment.recommendations.length > 0 && (
          <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
            <div className="text-xs font-medium text-gray-300 mb-2">Recommendations</div>
            <ul className="space-y-1">
              {overallAssessment.recommendations.map((rec) => (
                <li key={rec} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-[#C74634] mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
    );
  };

  return (
    <Card variant="bordered" className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
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

      <CardContent className="flex-1 overflow-y-auto flex flex-col">
        {renderWeatherContent()}
      </CardContent>

      {/* Time Factor Info Popup */}
      {showTimeFactorInfo && (
        <TimeFactorInfo onClose={() => setShowTimeFactorInfo(false)} />
      )}
    </Card>
  );
}
