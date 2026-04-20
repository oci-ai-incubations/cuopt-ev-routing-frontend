import { Route, Clock, Truck, Download } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { useConfigStore } from '@/store';
import { formatDistance, formatDuration, getVehiclePlate, getVehicleColor, setVehicleCountry } from '@/utils';
import type { CuOptResponse, VehicleRoute } from '@/types';

export function CuOptResultCard({ result }: { result: CuOptResponse }) {
  const { config: appConfig } = useConfigStore();
  setVehicleCountry(appConfig.countryCode);

  const vehicleData: VehicleRoute[] = result.vehicle_data || [];
  const totalDistance = result.solution_cost || 0;
  const totalDuration = vehicleData.reduce((sum: number, v) => sum + (v.route_duration || 0), 0);

  const handleDownload = (format: 'json' | 'csv') => {
    let data: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      data = JSON.stringify(result, null, 2);
      filename = 'cuopt-routes-result.json';
      mimeType = 'application/json';
    } else {
      const headers = 'plate,name,stops,route,duration\n';
      const rows = vehicleData.map((v) => {
        const vehicle = getVehiclePlate(v.vehicle_id);
        return `${vehicle.plate},${vehicle.name},${(v.route?.length || 2) - 2},"${v.route?.join('->')}",${v.route_duration || 0}`;
      }).join('\n');
      data = headers + rows;
      filename = 'cuopt-routes.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" leftIcon={<Download className="w-3 h-3" />} onClick={() => handleDownload('json')}>JSON</Button>
        <Button variant="ghost" size="sm" leftIcon={<Download className="w-3 h-3" />} onClick={() => handleDownload('csv')}>CSV</Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Route className="w-4 h-4 text-[#C74634] mx-auto mb-1" />, value: formatDistance(totalDistance), label: 'Distance' },
          { icon: <Clock className="w-4 h-4 text-[#C74634] mx-auto mb-1" />, value: formatDuration(totalDuration), label: 'Duration' },
          { icon: <Truck className="w-4 h-4 text-[#C74634] mx-auto mb-1" />, value: result.num_vehicles || vehicleData.length, label: 'Vehicles' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="bg-dark-bg rounded-lg p-2 text-center">
            {icon}
            <div className="text-sm font-medium text-white">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {vehicleData.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium">
            Showing {Math.min(vehicleData.length, 10)} of {vehicleData.length} routes
          </div>
          {vehicleData.slice(0, 10).map((v, idx: number) => {
            const vehicle = getVehiclePlate(v.vehicle_id);
            return (
              <div key={idx} className="bg-dark-bg rounded-lg p-2 border border-dark-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getVehicleColor(v.vehicle_id).color }} />
                    <span className="text-white font-mono text-sm font-medium">{vehicle.plate}</span>
                    <span className="text-gray-500 text-xs">{vehicle.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{(v.route?.length || 2) - 2} stops</span>
                </div>
                <div className="flex justify-end gap-4 mt-1 text-xs text-gray-400">
                  <span>{formatDistance(v.route_distance || 0)}</span>
                  <span>{formatDuration(v.route_duration || 0)}</span>
                </div>
              </div>
            );
          })}
          {vehicleData.length > 10 && (
            <div className="text-xs text-gray-500 text-center py-1">
              +{vehicleData.length - 10} more vehicles (see Route Optimizer for full list)
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Badge variant={result.status === 'SUCCESS' ? 'success' : 'warning'}>{result.status || 'Completed'}</Badge>
        {result.solve_time && (
          <span className="text-xs text-gray-500">Solved in {result.solve_time.toFixed(2)}s</span>
        )}
      </div>
    </div>
  );
}
