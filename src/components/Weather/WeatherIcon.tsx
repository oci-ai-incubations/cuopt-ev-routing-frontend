import { Cloud, CloudRain, CloudSnow, Sun } from 'lucide-react';

interface WeatherIconProps {
  conditionId: number;
  size?: number;
}

export function WeatherIcon({ conditionId, size = 20 }: WeatherIconProps) {
  if (conditionId >= 200 && conditionId < 300) {
    return <CloudRain className="text-yellow-400" style={{ width: size, height: size }} />;
  }

  if (conditionId >= 300 && conditionId < 600) {
    return <CloudRain className="text-blue-400" style={{ width: size, height: size }} />;
  }

  if (conditionId >= 600 && conditionId < 700) {
    return <CloudSnow className="text-blue-200" style={{ width: size, height: size }} />;
  }

  if (conditionId >= 700 && conditionId < 800) {
    return <Cloud className="text-gray-400" style={{ width: size, height: size }} />;
  }

  if (conditionId === 800) {
    return <Sun className="text-yellow-400" style={{ width: size, height: size }} />;
  }

  return <Cloud className="text-gray-400" style={{ width: size, height: size }} />;
}
