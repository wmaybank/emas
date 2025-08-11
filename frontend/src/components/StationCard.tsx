import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StationSummary } from '../types/weather';

interface StationCardProps {
  summary: StationSummary;
}

const StationCard: React.FC<StationCardProps> = ({ summary }) => {     
  const navigate = useNavigate();
  const { station, currentData, alerts, /* isOnline, */ lastUpdateAgo } = summary;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'maintenance':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertIcon = () => {
    if (alerts.length === 0) return null;
    
    const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
    const warningAlerts = alerts.filter(alert => alert.type === 'warning');
    
    if (criticalAlerts.length > 0) {
      return (
        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {criticalAlerts.length}
        </div>
      );
    }
    
    if (warningAlerts.length > 0) {
      return (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {warningAlerts.length}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div 
      className="relative bg-white rounded-xl shadow-sm border border-weather-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/station/${station.id}`)}
    >
      {getAlertIcon()}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-weather-gray-900 mb-1">
            {station.name}
          </h3>
          <p className="text-sm text-weather-gray-600">
            {station.location}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(station.status)}`}></div>
          <span className="text-xs text-weather-gray-500 capitalize">
            {station.status}
          </span>
        </div>
      </div>

      {/* Current Weather */}
      {currentData && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-weather-red-600">
              {currentData.temperature.current}°C
            </div>
            <div className="text-xs text-weather-gray-500">Temperatura</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-weather-blue-600">
              {currentData.humidity.current}%
            </div>
            <div className="text-xs text-weather-gray-500">Humedad</div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {currentData && (
        <div className="grid grid-cols-3 gap-2 text-xs text-weather-gray-600 mb-4">
          <div className="text-center">
            <div className="font-medium">{currentData.pressure.current} hPa</div>
            <div>Presión</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{currentData.wind.speed} km/h</div>
            <div>Viento</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{currentData.rain.current} mm</div>
            <div>Lluvia</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-weather-gray-500">
        <span>Última actualización: {lastUpdateAgo}</span>
        <span className="text-weather-blue-600 hover:text-weather-blue-700">
          Ver detalles →
        </span>
      </div>
    </div>
  );
};

export default StationCard;
