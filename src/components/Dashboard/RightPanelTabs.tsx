import { BarChart3, Cloud, Target } from 'lucide-react';
import { useState } from 'react';

import { OperationalImpactPanel } from '@/components/Metrics/OperationalImpactPanel';
import { PerformanceChart } from '@/components/Metrics/PerformanceChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { WeatherPanel } from '@/components/Weather/WeatherPanel';

type RightPanelView = 'weather' | 'impact' | 'performance';

export function RightPanelTabs() {
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>('weather');

  return (
    <div className="w-1/2 p-4 pl-2">
      <div className="h-full flex flex-col">
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
  );
}
