import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { weatherApi } from '../services/api';
import { WeatherStation, WeatherData, Alert } from '../types/weather';
import LoadingSpinner from '../components/LoadingSpinner';
// import WeatherChart from '../components/WeatherChart';

const StationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<WeatherStation | null>(null);
  const [currentData, setCurrentData] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const loadStationData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [stationData, currentDataRes] = await Promise.all([
        weatherApi.getStation(id),
        weatherApi.getCurrentWeather(id),
      ]);

      setStation(stationData);
      setCurrentData(currentDataRes);
      // setAlerts(alertsRes.filter(alert => alert.stationId === id)); // Temporarily disabled until alerts endpoint is fixed
      setAlerts([]); // Set empty array for now
    } catch (err) {
      setError('Error al cargar datos de la estación');
      console.error('Station detail error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadStationData();
    }
  }, [id, timeRange, loadStationData]);

  const handleRefresh = () => {
    loadStationData();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !station) {
    return (
      <div className="min-h-screen bg-weather-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-weather-gray-900 mb-2">
            Error al cargar la estación
          </h1>
          <p className="text-weather-gray-600 mb-6">
            {error || 'No se pudo encontrar la estación solicitada'}
          </p>
          <div className="space-x-4">
            <button
              onClick={handleRefresh}
              className="btn-primary"
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stationAlerts = alerts.filter(alert => alert.stationId === station.id);

  return (
    <div className="min-h-screen bg-weather-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-weather-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-weather-gray-400 hover:text-weather-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-weather-gray-900">
                  {station.name}
                </h1>
                <p className="text-weather-gray-600">
                  {station.location}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                station.status === 'online' ? 'bg-green-100 text-green-800' :
                station.status === 'offline' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  station.status === 'online' ? 'bg-green-500' :
                  station.status === 'offline' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                {station.status === 'online' ? 'En línea' :
                 station.status === 'offline' ? 'Desconectada' :
                 'Mantenimiento'}
              </div>
              <button
                onClick={handleRefresh}
                className="btn-primary"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Información de la estación */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Información de la Estación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-weather-gray-500">ID</label>
              <p className="text-sm text-weather-gray-900">{station.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-weather-gray-500">Ubicación</label>
              <p className="text-sm text-weather-gray-900">{station.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-weather-gray-500">Coordenadas</label>
              <p className="text-sm text-weather-gray-900">
                {station.coordinates?.latitude?.toFixed(4) || '0.0000'}, {station.coordinates?.longitude?.toFixed(4) || '0.0000'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-weather-gray-500">Elevación</label>
              <p className="text-sm text-weather-gray-900">{station.elevation} m</p>
            </div>
          </div>
        </div>

        {/* Datos actuales */}
        {currentData && (
          <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
              Condiciones Actuales
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {/* Temperatura */}
              <div className="text-center">
                <div className="text-3xl font-bold text-weather-gray-900 mb-2">
                  {currentData.temperature.current}°C
                </div>
                <div className="text-sm text-weather-gray-600">
                  {currentData.temperature.min}° - {currentData.temperature.max}°
                </div>
                <div className="text-xs text-weather-gray-400 mt-1">Temperatura</div>
              </div>

              {/* Humedad */}
              <div className="text-center">
                <div className="text-3xl font-bold text-weather-gray-900 mb-2">
                  {currentData.humidity.current}%
                </div>
                <div className="text-sm text-weather-gray-600">
                  {currentData.humidity.min}% - {currentData.humidity.max}%
                </div>
                <div className="text-xs text-weather-gray-400 mt-1">Humedad</div>
              </div>

              {/* Presión */}
              <div className="text-center">
                <div className="text-3xl font-bold text-weather-gray-900 mb-2">
                  {currentData.pressure.current} hPa
                </div>
                <div className="text-sm text-weather-gray-600 capitalize">
                  {currentData.pressure.trend}
                </div>
                <div className="text-xs text-weather-gray-400 mt-1">Presión</div>
              </div>

              {/* Viento */}
              <div className="text-center">
                <div className="text-3xl font-bold text-weather-gray-900 mb-2">
                  {currentData.wind.speed} km/h
                </div>
                <div className="text-sm text-weather-gray-600">
                  Dirección: {currentData.wind.direction}°
                </div>
                <div className="text-xs text-weather-gray-400 mt-1">Viento</div>
              </div>

              {/* Lluvia */}
              <div className="text-center">
                <div className="text-3xl font-bold text-weather-gray-900 mb-2">
                  {currentData.rain.current} mm
                </div>
                <div className="text-sm text-weather-gray-600">
                  Total: {currentData.rain.total} mm
                </div>
                <div className="text-xs text-weather-gray-400 mt-1">Lluvia</div>
              </div>
            </div>
          </div>
        )}

        {/* Alertas */}
        {stationAlerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
              Alertas Activas ({stationAlerts.length})
            </h2>
            <div className="space-y-3">
              {stationAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${
                    alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.type === 'critical' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.threshold.metric}: {alert.threshold.value} {alert.threshold.unit}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráfico */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-weather-gray-900">
              Histórico de Datos
            </h2>
            <div className="flex space-x-1 bg-weather-gray-100 p-1 rounded-lg">
              {[
                { value: '24h', label: '24 Horas' },
                { value: '7d', label: '7 Días' },
                { value: '30d', label: '30 Días' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value as '24h' | '7d' | '30d')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range.value
                      ? 'bg-white text-weather-blue-600 shadow-sm'
                      : 'text-weather-gray-600 hover:text-weather-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Aquí iría el gráfico con datos históricos */}
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">Gráfico de Datos Históricos</p>
            <p className="text-sm">Selecciona un rango de tiempo para visualizar</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StationDetail;
