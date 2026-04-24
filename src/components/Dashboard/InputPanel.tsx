import { Layers, MapPin, Play, RotateCcw, Settings, Truck, Zap } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/shared/Button';
import { useAppStore, useConfigStore, useOptimizationStore } from '@/store';

import { FleetSection } from './sections/FleetSection';
import { SolverSection } from './sections/SolverSection';
import { StopsSection } from './sections/StopsSection';
import { useInputPanelActions } from './useInputPanelActions';

interface InputPanelProps {
  onRunOptimization: () => void;
  onRunParallel: () => void;
}

const SECTION_TABS = [
  { id: 'fleet', icon: Truck, label: 'Fleet' },
  { id: 'stops', icon: MapPin, label: 'Stops' },
  { id: 'solver', icon: Zap, label: 'Solver' },
] as const;

type SectionId = (typeof SECTION_TABS)[number]['id'];

export function InputPanel({ onRunOptimization, onRunParallel }: InputPanelProps) {
  const { config, setConfig, setStops, stops, reset } = useOptimizationStore();
  const { isOptimizing, addToast } = useAppStore();
  const { config: appConfig, isBelronScenario } = useConfigStore();
  const isBelron = isBelronScenario();
  const [activeSection, setActiveSection] = useState<SectionId>('fleet');
  const [showJobTypes, setShowJobTypes] = useState(false);

  const {
    fileInputRef,
    jobTypeMix,
    useJobTypes,
    payloadSize,
    recommendedClusters,
    handleCSVUpload,
    handleGenerateStops,
    handleLoadEVData,
    handleLoadDynamicScenario,
  } = useInputPanelActions({
    config,
    stops,
    appConfig,
    isBelron,
    setConfig,
    setStops,
    addToast,
  });

  return (
    <div className="w-80 bg-dark-card border-r border-dark-border overflow-y-auto">
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: '#C74634' }} />
          Configuration
        </h2>
      </div>

      <div className="flex border-b border-dark-border">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeSection === tab.id ? 'border-b-2' : 'text-gray-400 hover:text-white'
            }`}
            style={activeSection === tab.id ? { color: '#C74634', borderColor: '#C74634' } : undefined}
          >
            <tab.icon className="w-4 h-4 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {activeSection === 'fleet' && (
          <FleetSection
            config={config}
            stops={stops}
            setConfig={setConfig}
            appConfig={appConfig}
            isBelron={isBelron}
            showJobTypes={showJobTypes}
            setShowJobTypes={setShowJobTypes}
            useJobTypes={useJobTypes}
            jobTypeMix={jobTypeMix}
          />
        )}

        {activeSection === 'stops' && (
          <StopsSection
            config={config}
            stops={stops}
            appConfig={appConfig}
            payloadSize={payloadSize}
            recommendedClusters={recommendedClusters}
            fileInputRef={fileInputRef}
            setConfig={setConfig}
            onGenerateStops={handleGenerateStops}
            onLoadEVData={handleLoadEVData}
            onLoadDynamicScenario={handleLoadDynamicScenario}
            onCSVUpload={handleCSVUpload}
          />
        )}

        {activeSection === 'solver' && (
          <SolverSection config={config} stops={stops} setConfig={setConfig} />
        )}
      </div>

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
