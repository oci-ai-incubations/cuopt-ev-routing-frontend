import { Building2 } from 'lucide-react';


import { NumberField } from './NumberField';
import { RadioGroup } from './RadioGroup';
import { Section } from './Section';

import type { AppConfig } from '@/store/configStore';

interface BusinessDefaultsProps {
  config: AppConfig;
  licensePlateExample: string;
  onVehiclesChange: (v: number) => void;
  onShiftHoursChange: (v: number) => void;
  onWorkingHoursChange: (start: string, end: string) => void;
  onVehicleLabelTypeChange: (v: string) => void;
}

export function BusinessDefaults({
  config,
  licensePlateExample,
  onVehiclesChange,
  onShiftHoursChange,
  onWorkingHoursChange,
  onVehicleLabelTypeChange,
}: BusinessDefaultsProps) {
  return (
    <Section title="Business Defaults" icon={<Building2 className="w-4 h-4 text-oracle-red" />}>
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Default Vehicles" value={config.defaultVehicles} onChange={onVehiclesChange} min={1} max={100} hint="Number of vehicles/technicians" />
        <NumberField label="Shift Duration" value={config.defaultShiftHours} onChange={onShiftHoursChange} min={4} max={12} step={0.5} unit="hours" hint="Default shift length" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(['Start', 'End'] as const).map((label) => {
          const key = label === 'Start' ? 'workingHoursStart' : 'workingHoursEnd';
          return (
            <div key={label} className="space-y-1">
              <label className="text-sm text-gray-400">Working Hours {label}</label>
              <input
                type="time"
                value={config[key]}
                onChange={(e) =>
                  onWorkingHoursChange(
                    label === 'Start' ? e.target.value : config.workingHoursStart,
                    label === 'End' ? e.target.value : config.workingHoursEnd
                  )
                }
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-oracle-red transition-colors"
              />
            </div>
          );
        })}
      </div>

      <RadioGroup
        label="Vehicle Labels"
        value={config.vehicleLabelType}
        onChange={onVehicleLabelTypeChange}
        options={[
          { value: 'generic', label: 'Generic (Vehicle 1, 2...)' },
          { value: 'license_plate', label: `License Plates (${licensePlateExample})` },
        ]}
      />
    </Section>
  );
}
