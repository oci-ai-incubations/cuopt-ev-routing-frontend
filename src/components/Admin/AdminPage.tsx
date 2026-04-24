import { clsx } from 'clsx';
import { Settings, RotateCcw, Save, Check, Info } from 'lucide-react';
import { useState } from 'react';

import { SCENARIO_PRESETS, getCountryByCode } from '@/data/locationData';
import { useConfigStore } from '@/store/configStore';

import { BusinessDefaults } from './BusinessDefaults';
import { MapDefaults } from './MapDefaults';
import { RegionSettings } from './RegionSettings';
import { ScenarioPresets } from './ScenarioPresets';

export function AdminPage() {
  const {
    config,
    setCountry, setCity, setDistanceUnit, setTimeFormat,
    setVehicleLabelType, setDefaultVehicles, setDefaultShiftHours,
    setWorkingHours, setDefaultCenter, setDefaultZoom, setServiceRadius,
    setActiveScenario, setUseScenarioJobTypes, setUseScenarioRevenue,
    setUseScenarioMetrics, resetToDefaults,
  } = useConfigStore();

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const selectedCountry = getCountryByCode(config.countryCode);
  const cities = selectedCountry?.cities || [];

  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div className="h-full overflow-auto bg-dark-bg p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-oracle-red flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Configuration Settings</h1>
              <p className="text-sm text-gray-400">Customize regional settings, defaults, and scenario options</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={handleSave}
              className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg transition-colors', saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-oracle-red text-white hover:bg-oracle-red/90')}
            >
              {saveStatus === 'saved' ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-oci-blue/10 border border-oci-blue/30 rounded-xl">
          <Info className="w-5 h-5 text-oci-blue shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            Settings are automatically saved to your browser and will persist across sessions.
            Changing the country or city will update currency, units, and map defaults accordingly.
          </p>
        </div>

        <RegionSettings
          config={config}
          cities={cities}
          onCountryChange={setCountry}
          onCityChange={setCity}
          onDistanceUnitChange={(v) => setDistanceUnit(v as 'km' | 'miles')}
          onTimeFormatChange={(v) => setTimeFormat(v as '12h' | '24h')}
        />

        <MapDefaults
          config={config}
          onCenterChange={setDefaultCenter}
          onZoomChange={setDefaultZoom}
          onRadiusChange={setServiceRadius}
        />

        <BusinessDefaults
          config={config}
          licensePlateExample={selectedCountry?.licensePlateExample || 'ABC123'}
          onVehiclesChange={setDefaultVehicles}
          onShiftHoursChange={setDefaultShiftHours}
          onWorkingHoursChange={setWorkingHours}
          onVehicleLabelTypeChange={(v) => setVehicleLabelType(v as 'generic' | 'license_plate')}
        />

        <ScenarioPresets
          config={config}
          onScenarioChange={setActiveScenario}
          onUseJobTypesChange={setUseScenarioJobTypes}
          onUseRevenueChange={setUseScenarioRevenue}
          onUseMetricsChange={setUseScenarioMetrics}
        />

        {/* Summary */}
        <div className="p-4 bg-dark-card rounded-xl border border-dark-border">
          <div className="text-sm font-medium text-gray-400 mb-3">Current Configuration Summary</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Region', value: `${selectedCountry?.flag} ${selectedCountry?.name}` },
              { label: 'City', value: cities.find((c) => c.id === config.cityId)?.name || '' },
              { label: 'Scenario', value: SCENARIO_PRESETS.find((s) => s.id === config.activeScenario)?.name || '' },
              { label: 'Fleet Size', value: `${config.defaultVehicles} vehicles` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-gray-500">{label}</div>
                <div className="text-white font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 pb-4">
          Configuration v1.0 | Settings stored in browser localStorage
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
