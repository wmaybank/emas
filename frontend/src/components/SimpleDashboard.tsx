import React, { useState, useEffect } from 'react';
import { weatherApi } from '../services/api';
import { WeatherData, WeatherStation } from '../types/weather';

const SimpleDashboard: React.FC = () => {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [currentData, setCurrentData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading dashboard data...');
        
        // Cargar estaciones
        const stationsData = await weatherApi.getStations();
        console.log('Stations loaded:', stationsData);
        setStations(stationsData);

        // Cargar datos actuales
        if (stationsData.length > 0) {
          const weatherData = await weatherApi.getCurrentWeather(stationsData[0].id);
          console.log('Weather data loaded:', weatherData);
          setCurrentData([weatherData]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos meteorológicos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  const firstStation = currentData[0];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dashboard Meteorológico EMAS
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Temperatura */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Temperatura</h3>
            <div className="text-3xl font-bold text-blue-600">
              {firstStation ? `${firstStation.temperature.current}°C` : '--°C'}
            </div>
            <p className="text-sm text-gray-500">
              Sensación: {firstStation ? `${firstStation.temperature.feelsLike}°C` : '--°C'}
            </p>
          </div>

          {/* Humedad */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Humedad</h3>
            <div className="text-3xl font-bold text-green-600">
              {firstStation ? `${firstStation.humidity.current}%` : '--%'}
            </div>
          </div>

          {/* Presión */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Presión</h3>
            <div className="text-3xl font-bold text-purple-600">
              {firstStation ? `${firstStation.pressure.current} hPa` : '-- hPa'}
            </div>
            <p className="text-sm text-gray-500">
              Tendencia: {firstStation?.pressure.trend || '--'}
            </p>
          </div>

          {/* Viento */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Viento</h3>
            <div className="text-3xl font-bold text-orange-600">
              {firstStation ? `${firstStation.wind.speed} km/h` : '-- km/h'}
            </div>
            <p className="text-sm text-gray-500">
              Dirección: {firstStation ? `${firstStation.wind.direction}°` : '--°'}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estaciones Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stations.map((station) => (
              <div key={station.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium text-gray-900">{station.name}</h3>
                <p className="text-sm text-gray-500">{station.location}</p>
                <p className="text-sm text-gray-400">
                  Estado: <span className={`${station.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                    {station.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos en Crudo</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
            {JSON.stringify({ stations, currentData }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
