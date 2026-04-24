import { InputPanel } from './InputPanel';
import { MapPanel } from './MapPanel';
import { ResultsPanel } from './ResultsPanel';
import { RightPanelTabs } from './RightPanelTabs';
import { useDashboardOptimization } from './useDashboardOptimization';

export function Dashboard() {
  const { handleRunOptimization, handleRunParallel } = useDashboardOptimization();

  return (
    <div className="flex h-full">
      <InputPanel
        onRunOptimization={handleRunOptimization}
        onRunParallel={handleRunParallel}
      />

      <div className="flex-1 flex flex-col">
        <MapPanel />

        <div className="h-1/2 flex overflow-hidden">
          <div className="w-1/2 h-full overflow-hidden">
            <ResultsPanel />
          </div>
          <RightPanelTabs />
        </div>
      </div>
    </div>
  );
}
