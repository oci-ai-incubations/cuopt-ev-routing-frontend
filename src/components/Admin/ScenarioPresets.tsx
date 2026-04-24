import { Truck } from 'lucide-react';

import { SCENARIO_PRESETS } from '@/data/locationData';


import { Section } from './Section';
import { SelectField } from './SelectField';
import { ToggleField } from './ToggleField';

import type { AppConfig } from '@/store/configStore';

interface ScenarioPresetsProps {
  config: AppConfig;
  onScenarioChange: (v: string) => void;
  onUseJobTypesChange: (v: boolean) => void;
  onUseRevenueChange: (v: boolean) => void;
  onUseMetricsChange: (v: boolean) => void;
}

export function ScenarioPresets({ config, onScenarioChange, onUseJobTypesChange, onUseRevenueChange, onUseMetricsChange }: ScenarioPresetsProps) {
  return (
    <Section title="Scenario Presets" icon={<Truck className="w-4 h-4 text-oracle-red" />}>
      <SelectField
        label="Active Scenario"
        value={config.activeScenario}
        onChange={onScenarioChange}
        options={SCENARIO_PRESETS.map((s) => ({ value: s.id, label: s.name }))}
        hint="Select industry-specific configuration"
      />

      {config.activeScenario === 'belron' && (
        <div className="p-4 bg-dark-bg rounded-lg space-y-3">
          <div className="text-sm font-medium text-white">Belron Job Types</div>
          <div className="grid grid-cols-3 gap-3">
            {config.scenarioJobTypes.map((jt) => (
              <div key={jt.id} className="p-3 rounded-lg border border-dark-border" style={{ borderLeftColor: jt.color, borderLeftWidth: 3 }}>
                <div className="font-medium text-white text-sm">{jt.label}</div>
                <div className="text-xs text-gray-400 mt-1">{jt.duration} min | {config.currency.symbol}{jt.revenue}</div>
                <div className="text-xs text-gray-500">Default: {jt.defaultPercentage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-dark-border pt-4">
        <ToggleField label="Use Scenario Job Types" description="Replace generic job types with scenario-specific types" checked={config.useScenarioJobTypes} onChange={onUseJobTypesChange} />
        <ToggleField label="Use Scenario Revenue Values" description="Apply scenario-specific pricing in calculations" checked={config.useScenarioRevenue} onChange={onUseRevenueChange} />
        <ToggleField label="Use Scenario Business Metrics" description="Show industry-specific KPIs and impact metrics" checked={config.useScenarioMetrics} onChange={onUseMetricsChange} />
      </div>
    </Section>
  );
}
