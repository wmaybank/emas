import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherApi } from '../services/api';
import { WeatherStation, WeatherData, Alert, StationSummary } from '../types/weather';
import StationCard from './StationCard';
import AlertPanel from './AlertPanel';
import LoadingSpinner from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadDashboardData = async () => {
    try {
      // Cargar estaciones
      const stationsData = await weatherApi.getStations();
      setStations(stationsData);

      // Cargar datos del clima para cada estación
      const dataPromises = stationsData.map(async (station) => {
        try {
          const data = await weatherApi.getCurrentWeather(station.id);
          return { [station.id]: data };
        } catch (err) {
          console.error(`Error loading data for station ${station.id}:`, err);
          return {};
        }
      });

      const results = await Promise.all(dataPromises);
      const combinedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setWeatherData(combinedData);

      // Cargar alertas
      try {
        const alertsData = await weatherApi.getAlerts();
        setAlerts(alertsData);
      } catch (err) {
        console.error('Error loading alerts:', err);
        setAlerts([]);
      }

      setError(null);
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStationSummary = (station: WeatherStation): StationSummary => {
    const data = weatherData[station.id];
    const stationAlerts = alerts.filter(alert => alert.stationId === station.id);
    
    // Calcular tiempo desde la última actualización
    const lastUpdate = data?.timestamp || station.lastUpdate;
    const lastUpdateDate = new Date(lastUpdate);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdateDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    let lastUpdateAgo = '';
    if (diffMins < 1) {
      lastUpdateAgo = 'Ahora mismo';
    } else if (diffMins < 60) {
      lastUpdateAgo = `Hace ${diffMins} min`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      lastUpdateAgo = `Hace ${diffHours} h`;
    }

    return {
      station,
      currentData: data || {
        stationId: station.id,
        timestamp: station.lastUpdate,
        temperature: { current: 0, min: 0, max: 0, feelsLike: 0, avg: 0, unit: 'C', low: 0, high: 0 },
        humidity: { current: 0, min: 0, max: 0, avg: 0, low: 0, high: 0 },
        pressure: { current: 0, min: 0, max: 0, avg: 0, trend: 'stable', unit: 'hPa' },
        wind: { speed: 0, direction: 0, gust: 0, average: 0, avg: 0, max: 0, unit: 'km/h' },
        rain: { current: 0, total: 0, maxHourly: 0, intensity: 0 },
        visibility: 0,
        uvIndex: 0
      },
      alerts: stationAlerts,
      isOnline: station.status === 'online',
      lastUpdateAgo
    };
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  const handleTimeRangeChange = (range: '24h' | '7d' | '30d') => {
    setTimeRange(range);
    // Aquí podrías recargar datos históricos si es necesario
  };

  if (loading && stations.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-weather-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-weather-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-weather-gray-900">
                Dashboard Meteorológico
              </h1>
              <p className="text-weather-gray-600">
                Monitoreo en tiempo real de estaciones meteorológicas
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-weather-blue-600 hover:bg-weather-blue-700 disabled:bg-weather-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <AlertPanel alerts={alerts} />
          </div>
        )}

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-weather-gray-700">
                Rango de tiempo:
              </label>
              <select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value as '24h' | '7d' | '30d')}
                className="px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-weather-gray-700">
                Actualización automática:
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value={15}>15 seg</option>
                <option value={30}>30 seg</option>
                <option value={60}>1 min</option>
                <option value={300}>5 min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estaciones */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Estaciones ({stations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                summary={getStationSummary(station)}
              />
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/reports')}
            className="bg-weather-green-600 hover:bg-weather-green-700 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Generar Reportes</div>
            <div className="text-sm opacity-90">Análisis y exportación de datos</div>
          </button>
          
          <button
            onClick={() => navigate('/settings')}
            className="bg-weather-purple-600 hover:bg-weather-purple-700 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium">Configuración</div>
            <div className="text-sm opacity-90">Ajustes del sistema</div>
          </button>
          
          <button
            onClick={() => navigate('/alerts')}
            className="bg-weather-orange-600 hover:bg-weather-orange-700 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">🚨</div>
            <div className="font-medium">Gestionar Alertas</div>
            <div className="text-sm opacity-90">Configurar notificaciones</div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
