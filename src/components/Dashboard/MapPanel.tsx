import { MapPin } from 'lucide-react';

import { GoogleRouteMap } from '@/components/Map/GoogleRouteMap';
import { RouteMap } from '@/components/Map/RouteMap';
import { Card } from '@/components/shared/Card';
import { useAppStore } from '@/store';

export function MapPanel() {
  const { mapProvider, setMapProvider, googleMapsApiKey } = useAppStore();

  return (
    <div className="h-1/2 p-4 pb-2">
      <Card variant="bordered" padding="none" className="h-full overflow-hidden relative">
        <div className="absolute top-3 left-3 z-[1001] flex bg-dark-card border border-dark-border rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setMapProvider('google')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              mapProvider === 'google'
                ? 'bg-[#C74634] text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="Google Maps with Traffic & Directions"
          >
            <MapPin className="w-3.5 h-3.5" />
            Google
          </button>
          <button
            onClick={() => setMapProvider('leaflet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              mapProvider === 'leaflet'
                ? 'bg-[#C74634] text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-hover'
            }`}
            title="OpenStreetMap (Free)"
          >
            <MapPin className="w-3.5 h-3.5" />
            Leaflet
          </button>
        </div>

        <div className={`h-full w-full ${mapProvider === 'google' ? 'block' : 'hidden'}`}>
          {googleMapsApiKey ? (
            <GoogleRouteMap />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-dark-bg text-gray-500 text-sm">
              Google Maps API key not configured
            </div>
          )}
        </div>

        <div className={`h-full w-full ${mapProvider === 'leaflet' ? 'block' : 'hidden'}`}>
          <RouteMap isActive={mapProvider === 'leaflet'} />
        </div>
      </Card>
    </div>
  );
}
