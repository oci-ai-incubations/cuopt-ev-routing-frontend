import L from 'leaflet';
import { Map, Layers, Navigation, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';

import { useOptimizationStore, useAppStore, useConfigStore } from '@/store';
import { getVehicleColor, formatVehicleName } from '@/utils';
import 'leaflet/dist/leaflet.css';

// Map style options - user-friendly tile providers
type MapStyle = 'streets' | 'voyager' | 'satellite' | 'terrain' | 'dark';

interface MapStyleOption {
  id: MapStyle;
  name: string;
  url: string;
  attribution: string;
  preview: string;
}

interface EvStopMetadata {
  networkName?: string;
  powerGroup?: string;
  connectorType?: string;
}

function getEvMetadata(metadata?: Record<string, unknown>): EvStopMetadata | null {
  if (!metadata) return null;

  const networkName = typeof metadata.networkName === 'string' ? metadata.networkName : undefined;
  const powerGroup = typeof metadata.powerGroup === 'string' ? metadata.powerGroup : undefined;
  const connectorType = typeof metadata.connectorType === 'string' ? metadata.connectorType : undefined;

  if (!networkName && !powerGroup && !connectorType) {
    return null;
  }

  return { networkName, powerGroup, connectorType };
}

const MAP_STYLES: MapStyleOption[] = [
  {
    id: 'streets',
    name: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    preview: 'Classic road map with traffic-relevant details',
  },
  {
    id: 'voyager',
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    preview: 'Colorful modern style with clear labels',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    preview: 'Topographic map with elevation contours',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    preview: 'Satellite imagery view',
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    preview: 'Dark theme for night viewing',
  },
];

// Legacy map theme mapping for backward compatibility
const LEGACY_THEME_MAP: Record<string, MapStyle> = {
  dark: 'dark',
  light: 'voyager',
};

// Fix Leaflet default icon issue
const defaultIconPrototype = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons with improved visibility
const createMarkerIcon = (color: string, isDepot: boolean = false, isEV: boolean = false, isUnassigned: boolean = false) => {
  if (isUnassigned) {
    // Smaller, faded marker with red border for unassigned stops
    return L.divIcon({
      className: 'custom-marker unassigned-marker',
      html: `
        <div style="
          width: 12px;
          height: 12px;
          background: ${color};
          border: 2px solid #EF4444;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          opacity: 0.6;
        "></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }

  if (isEV) {
    // EV charging station marker with lightning bolt
    return L.divIcon({
      className: 'custom-marker ev-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%);
          border: 2px solid white;
          border-radius: 6px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  if (isDepot) {
    // Special depot marker with building icon
    return L.divIcon({
      className: 'custom-marker depot-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%);
          border: 3px solid white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2L2 7v15h20V7L12 2zm0 2.3L18 8v11H6V8l6-3.7zM8 11v2h2v-2H8zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zM8 14v2h2v-2H8zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  // Regular stop marker
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 18px;
        height: 18px;
        background: linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

// Helper to darken/lighten colors for gradients
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface MapUpdaterProps {
  isActive?: boolean;
}

function MapUpdater({ isActive = true }: MapUpdaterProps) {
  const map = useMap();
  const { stops } = useOptimizationStore();

  // Invalidate size when map becomes visible (fixes white background issue)
  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        map.invalidateSize();
        map.zoomControl.setPosition('bottomright');
      }, 100);
    }
  }, [isActive, map]);

  useEffect(() => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stops, map]);

  return null;
}

interface RouteMapProps {
  isActive?: boolean;
}

export function RouteMap({ isActive = true }: RouteMapProps) {
  const { stops, routes } = useOptimizationStore();
  const { mapTheme } = useAppStore();
  const { config: appConfig } = useConfigStore();
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => LEGACY_THEME_MAP[mapTheme] || 'voyager');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);

  // Update map style when theme changes
  useEffect(() => {
    setMapStyle(LEGACY_THEME_MAP[mapTheme] || 'voyager');
  }, [mapTheme]);

  const currentStyle = MAP_STYLES.find((s) => s.id === mapStyle) || MAP_STYLES[1];

  // Default center - use config store or calculate from stops
  const center: [number, number] =
    stops.length > 0
      ? [
          stops.reduce((sum, s) => sum + s.lat, 0) / stops.length,
          stops.reduce((sum, s) => sum + s.lng, 0) / stops.length,
        ]
      : [appConfig.defaultCenter.lat, appConfig.defaultCenter.lng]; // Use config center

  // Build route polylines
  const routeLines = routes.map((route) => {
    const color = getVehicleColor(route.vehicle_id);
    const positions: Array<[number, number]> = route.route.map((stopIdx) => {
      if (stopIdx === 0) {
        // Depot - use first stop's location as proxy
        return stops.length > 0 ? [stops[0].lat, stops[0].lng] : center;
      }
      const stop = stops.find((s) => s.id === stopIdx);
      return stop ? [stop.lat, stop.lng] : center;
    });

    return { vehicleId: route.vehicle_id, positions, color };
  });

  const isDarkStyle = mapStyle === 'dark';

  return (
    <div className="relative h-full w-full">
      {/* Map Style Selector */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Style Toggle Button */}
        <button
          onClick={() => setShowStyleSelector(!showStyleSelector)}
          className={`p-2 rounded-lg shadow-lg transition-colors flex items-center gap-2 ${
            isDarkStyle
              ? 'bg-dark-card border border-dark-border hover:bg-dark-hover text-white'
              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Change map style"
        >
          <Layers className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">{currentStyle.name}</span>
        </button>

        {/* Style Dropdown */}
        {showStyleSelector && (
          <div className={`absolute top-12 right-0 rounded-lg shadow-xl border overflow-hidden min-w-[180px] ${
            isDarkStyle ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-3 py-2 text-xs font-semibold border-b ${
              isDarkStyle ? 'text-gray-400 border-dark-border' : 'text-gray-500 border-gray-100'
            }`}>
              Map Style
            </div>
            {MAP_STYLES.map((style) => {
              let styleButtonClass: string;
              if (mapStyle === style.id) {
                styleButtonClass = isDarkStyle ? 'bg-[#C74634]/20 text-[#C74634]' : 'bg-red-50 text-red-700';
              } else {
                styleButtonClass = isDarkStyle ? 'text-gray-300 hover:bg-dark-hover' : 'text-gray-700 hover:bg-gray-50';
              }
              return (
              <button
                key={style.id}
                onClick={() => {
                  setMapStyle(style.id);
                  setShowStyleSelector(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors ${styleButtonClass}`}
              >
                <Map className="w-4 h-4" />
                <div>
                  <div className="text-sm font-medium">{style.name}</div>
                  <div className={`text-xs ${isDarkStyle ? 'text-gray-500' : 'text-gray-400'}`}>
                    {style.preview}
                  </div>
                </div>
              </button>
              );
            })}

            {/* Traffic Info Section */}
            <div className={`border-t px-3 py-2 ${isDarkStyle ? 'border-dark-border' : 'border-gray-100'}`}>
              <button
                onClick={() => setShowTrafficInfo(!showTrafficInfo)}
                className={`flex items-center gap-2 text-xs ${
                  isDarkStyle ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Info className="w-3 h-3" />
                Traffic Information
              </button>
              {showTrafficInfo && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  isDarkStyle ? 'bg-dark-bg text-gray-400' : 'bg-gray-50 text-gray-600'
                }`}>
                  Real-time traffic data requires API integration (e.g., TomTom, HERE, Google).
                  The Streets map shows road types and importance for planning purposes.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Route Legend */}
      {routes.length > 0 && (
        <div className={`absolute bottom-4 left-4 z-[1000] rounded-lg shadow-lg p-3 max-w-[200px] ${
          isDarkStyle ? 'bg-dark-card border border-dark-border' : 'bg-white border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 flex items-center gap-1 ${
            isDarkStyle ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Navigation className="w-3 h-3" />
            Routes ({routes.length})
          </div>
          <div
            className={`space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin pr-1 ${
              isDarkStyle ? 'map-legend-scroll-dark' : 'map-legend-scroll-light'
            }`}
          >
            {routes.map((route) => {
              const color = getVehicleColor(route.vehicle_id);
              return (
                <div key={route.vehicle_id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full border border-white flex-shrink-0"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className={isDarkStyle ? 'text-gray-400' : 'text-gray-600'}>
                    {formatVehicleName(route.vehicle_id)} ({route.route.length - 2} stops)
                  </span>
                </div>
              );
            })}
          </div>
          {/* Unassigned Stops Warning */}
          {(() => {
            const assignedStopIds = new Set<number>();
            routes.forEach(r => r.route.forEach(id => { if (id !== 0) assignedStopIds.add(id); }));
            const unassignedCount = stops.slice(1).filter(s => !assignedStopIds.has(s.id)).length;
            if (unassignedCount > 0) {
              return (
                <div className={`mt-2 pt-2 border-t ${isDarkStyle ? 'border-dark-border' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 opacity-50 border-2 border-red-500" style={{ width: '12px', height: '12px' }} />
                    <span className={`text-[10px] ${isDarkStyle ? 'text-red-400' : 'text-red-500'}`}>
                      {unassignedCount} unassigned
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      <MapContainer
        center={center}
        zoom={stops.length > 0 ? 11 : 6}
        zoomControl
        className="h-full w-full rounded-xl"
        style={{ background: isDarkStyle ? '#1B1F2E' : '#f8fafc' }}
      >
        <TileLayer
          key={currentStyle.id}
          url={currentStyle.url}
          attribution={currentStyle.attribution}
        />

      <MapUpdater isActive={isActive} />

      {/* Depot marker */}
      {stops.length > 0 && (
        <Marker
          position={[stops[0].lat, stops[0].lng]}
          icon={createMarkerIcon('#76B900', true)}
        >
          <Popup>
            <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '160px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#76B900', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>DEPOT</span>
                Fleet Base
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Latitude:</span>
                  <span style={{ fontFamily: 'monospace', color: '#333' }}>{stops[0].lat.toFixed(5)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Longitude:</span>
                  <span style={{ fontFamily: 'monospace', color: '#333' }}>{stops[0].lng.toFixed(5)}</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Stop markers */}
      {stops.slice(1).map((stop) => {
        // Find which route this stop belongs to
        const assignedRoute = routes.find((r) => r.route.includes(stop.id));
        const isAssigned = !!assignedRoute;
        const color = assignedRoute
          ? getVehicleColor(assignedRoute.vehicle_id).color
          : '#9CA3AF'; // Gray for unassigned

        // Check if this is an EV charging station (has metadata with networkName)
        const metadata = getEvMetadata(stop.metadata);
        const isEVStation = !!metadata?.networkName;

        // Use different marker for unassigned stops when routes exist
        const isUnassigned = !isAssigned && routes.length > 0;

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createMarkerIcon(isEVStation ? '#22C55E' : color, false, isEVStation, isUnassigned)}
            opacity={isUnassigned ? 0.5 : 1}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '200px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isUnassigned && (
                    <span style={{ background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>UNASSIGNED</span>
                  )}
                  {isEVStation && (
                    <span style={{ background: '#22C55E', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>EV</span>
                  )}
                  {stop.label || `Stop ${stop.id}`}
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                  {stop.postcode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Postcode:</span>
                      <span style={{ fontFamily: 'monospace', color: '#333', fontWeight: 500 }}>{stop.postcode}</span>
                    </div>
                  )}
                  {isEVStation && metadata && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Network:</span>
                        <span style={{ color: '#333' }}>{metadata.networkName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Power:</span>
                        <span style={{ color: '#333' }}>{metadata.powerGroup}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Type:</span>
                        <span style={{ color: '#333' }}>{metadata.connectorType}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Demand:</span>
                    <span style={{ color: '#333', fontWeight: 500 }}>{stop.demand} units</span>
                  </div>
                  {assignedRoute && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color }}>
                        {formatVehicleName(assignedRoute.vehicle_id)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route polylines - with shadow for better visibility */}
      {routeLines.map((line) => (
        <Polyline
          key={`shadow-${line.vehicleId}`}
          positions={line.positions}
          pathOptions={{
            color: isDarkStyle ? '#000000' : '#ffffff',
            weight: 6,
            opacity: 0.4,
          }}
        />
      ))}
      {routeLines.map((line) => (
        <Polyline
          key={line.vehicleId}
          positions={line.positions}
          pathOptions={{
            color: line.color.color,
            weight: 4,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}
    </MapContainer>
    </div>
  );
}
