import { Globe } from 'lucide-react';

import { COUNTRIES } from '@/data/locationData';

import { RadioGroup } from './RadioGroup';
import { Section } from './Section';
import { SelectField } from './SelectField';

import type { AppConfig } from '@/store/configStore';


interface RegionSettingsProps {
  config: AppConfig;
  cities: Array<{ id: string; name: string; timezone?: string }>;
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistanceUnitChange: (v: string) => void;
  onTimeFormatChange: (v: string) => void;
}

export function RegionSettings({ config, cities, onCountryChange, onCityChange, onDistanceUnitChange, onTimeFormatChange }: RegionSettingsProps) {
  const currentTimezone = cities.find((c) => c.id === config.cityId)?.timezone || 'UTC';

  return (
    <Section title="Region Settings" icon={<Globe className="w-4 h-4 text-oracle-red" />}>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Country"
          value={config.countryCode}
          onChange={onCountryChange}
          options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
          hint="Changing country updates currency and regional formats"
        />
        <SelectField
          label="City / Region"
          value={config.cityId}
          onChange={onCityChange}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          hint="Sets default map center and service area"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Currency', value: `${config.currency.symbol} ${config.currency.code}` },
          { label: 'Date Format', value: config.dateFormat },
          { label: 'Timezone', value: currentTimezone },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 bg-dark-bg rounded-lg">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RadioGroup
          label="Distance Units"
          value={config.distanceUnit}
          onChange={onDistanceUnitChange}
          options={[{ value: 'km', label: 'Kilometers' }, { value: 'miles', label: 'Miles' }]}
        />
        <RadioGroup
          label="Time Format"
          value={config.timeFormat}
          onChange={onTimeFormatChange}
          options={[{ value: '24h', label: '24-hour' }, { value: '12h', label: '12-hour' }]}
        />
      </div>
    </Section>
  );
}
