import { MapPin } from 'lucide-react';

import type { AppConfig } from '@/store/configStore';

import { Section } from './Section';
import { NumberField } from './NumberField';

interface MapDefaultsProps {
  config: AppConfig;
  onCenterChange: (lat: number, lng: number) => void;
  onZoomChange: (v: number) => void;
  onRadiusChange: (v: number) => void;
}

export function MapDefaults({ config, onCenterChange, onZoomChange, onRadiusChange }: MapDefaultsProps) {
  return (
    <Section title="Map Defaults" icon={<MapPin className="w-4 h-4 text-oracle-red" />}>
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Default Latitude"
          value={config.defaultCenter.lat}
          onChange={(v) => onCenterChange(v, config.defaultCenter.lng)}
          step={0.0001}
          hint="Center point latitude"
        />
        <NumberField
          label="Default Longitude"
          value={config.defaultCenter.lng}
          onChange={(v) => onCenterChange(config.defaultCenter.lat, v)}
          step={0.0001}
          hint="Center point longitude"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Default Zoom Level"
          value={config.defaultZoom}
          onChange={onZoomChange}
          min={1}
          max={20}
          hint="Map zoom level (1-20)"
        />
        <NumberField
          label="Service Radius"
          value={config.serviceRadius}
          onChange={onRadiusChange}
          min={5}
          max={200}
          unit="km"
          hint="Default service area radius"
        />
      </div>
    </Section>
  );
}
