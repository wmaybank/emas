import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherApi } from '../services/api';
import { WeatherStation, WeatherData } from '../types/weather';
import LoadingSpinner from './LoadingSpinner';
import LoginModal from './LoginModal';
import AdminPanel from './AdminPanel';
import { useAuth } from '../contexts/AuthContext';

const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const stationsData = await weatherApi.getStations();
      setStations(stationsData);

      if (stationsData.length > 0 && !selectedStation) {
        setSelectedStation(stationsData[0].id);
      }

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
      setError(null);
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    };
    return `Última actualización: ${now.toLocaleDateString('es-AR', dateOptions)} / ${now.toLocaleTimeString('es-AR', timeOptions)} (Buenos Aires)`;
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getPressureTrend = (trend: string): string => {
    switch(trend) {
      case 'rising': return 'Subiendo';
      case 'falling': return 'Bajando';
      default: return 'Estable';
    }
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp < 0) return 'from-blue-600 to-blue-400';
    if (temp < 10) return 'from-blue-500 to-cyan-400';
    if (temp < 20) return 'from-green-500 to-blue-400';
    if (temp < 30) return 'from-yellow-500 to-green-400';
    if (temp < 40) return 'from-orange-500 to-yellow-400';
    return 'from-red-600 to-orange-400';
  };

  const getHumidityColor = (humidity: number): string => {
    if (humidity < 30) return 'from-red-500 to-orange-400';
    if (humidity < 70) return 'from-green-500 to-blue-400';
    return 'from-blue-600 to-blue-400';
  };

  const CircularProgress: React.FC<{ 
    value: number; 
    max: number; 
    color: string; 
    size?: number;
    strokeWidth?: number;
  }> = ({ value, max, color, size = 120, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (value / max) * 100;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{Math.round(value)}</div>
            <div className="text-xs text-gray-500">{max === 100 ? '%' : 'hPa'}</div>
          </div>
        </div>
      </div>
    );
  };

  const WeatherIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 24 }) => {
    const icons = {
      temperature: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-2V5c0-.55.45-1 1-1s1 .45 1 1v6h-2z"/>
        </svg>
      ),
      humidity: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z"/>
        </svg>
      ),
      wind: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 6c-.28 0-.5-.22-.5-.5s.22-.5.5-.5 .5.22.5.5-.22.5-.5.5zM10 4H7C5.9 4 5 4.9 5 6s.9 2 2 2h3c1.66 0 3 1.34 3 3s-1.34 3-3 3c-.83 0-1.58-.34-2.12-.88-.32-.32-.32-.84 0-1.16.32-.32.84-.32 1.16 0 .18.18.43.29.71.29.55 0 1-.45 1-1s-.45-1-1-1H7C4.79 10 3 8.21 3 6s1.79-4 4-4h3c.55 0 1 .45 1 1s-.45 1-1 1z"/>
        </svg>
      ),
      pressure: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-2H6v2zM6 17h12V7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v10zM8 5h8V3c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v2z"/>
        </svg>
      ),
      rain: (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 2c-.19 0-.39.04-.57.13L12 3.5l3.07-1.37c-.18-.09-.38-.13-.57-.13-.83 0-1.5.67-1.5 1.5v2l3 1.5v-2c0-.83-.67-1.5-1.5-1.5zM6 7l3-1.5v4.91c-.84.48-1.42 1.37-1.42 2.39 0 1.52 1.23 2.75 2.75 2.75s2.75-1.23 2.75-2.75c0-1.02-.58-1.91-1.42-2.39V5.5L18 7v10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V7z"/>
        </svg>
      )
    };
    return icons[type as keyof typeof icons] || icons.temperature;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentWeather = selectedStation ? weatherData[selectedStation] : null;
  const currentStationData = stations.find(s => s.id === selectedStation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Meteorológico EMAS
            </h1>
            <p className="text-sm text-gray-600">{formatLastUpdate()}</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
            
            {/* Botón de administración */}
            {isAdmin ? (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Admin</span>
              </button>
            )}
            
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      {currentWeather && (
        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            
            {/* Temperatura */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="text-center mb-4">
                <div className="text-red-500 flex justify-center mb-2">
                  <WeatherIcon type="temperature" size={32} />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Temperatura</h3>
                <p className="text-xs text-gray-400">Grados Celsius</p>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{currentWeather.temperature.current}°C</div>
                </div>
                {/* Mini chart bars - Fixed temperature visualization */}
                <div className="flex items-end justify-center space-x-1 h-12">
                  {[
                    { temp: currentWeather.temperature.current - 2, label: 'Min' },
                    { temp: currentWeather.temperature.current - 1, label: 'Ant' },
                    { temp: currentWeather.temperature.current, label: 'Act' },
                    { temp: currentWeather.temperature.current + 1, label: 'Sig' },
                    { temp: currentWeather.temperature.current + 2, label: 'Max' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div 
                        className={`w-6 ${
                          item.temp < 10 ? 'bg-blue-500' : 
                          item.temp < 20 ? 'bg-green-500' : 
                          item.temp < 30 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        } rounded-t`}
                        style={{ height: `${Math.max(10, Math.min(40, item.temp * 1.5))}px` }}
                      ></div>
                      <div className="text-xs text-gray-400 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Velocidad del viento */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="text-center mb-4">
                <div className="text-green-500 flex justify-center mb-2">
                  <WeatherIcon type="wind" size={32} />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Velocidad del viento</h3>
                <p className="text-xs text-gray-400">Kilómetros por hora</p>
              </div>
              <div className="flex justify-center">
                <CircularProgress 
                  value={currentWeather.wind.speed} 
                  max={50} 
                  color="#10b981" 
                  size={100}
                />
              </div>
              <div className="text-center mt-3">
                <div className="text-sm text-gray-600">{currentWeather.wind.speed} {currentWeather.wind.unit}</div>
              </div>
            </div>

            {/* Dirección del viento */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="text-center mb-4">
                <div className="text-blue-500 flex justify-center mb-2">
                  <WeatherIcon type="wind" size={32} />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Dirección del viento</h3>
                <p className="text-xs text-gray-400">Grados cardinales</p>
              </div>
              {/* Wind direction compass */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="2"/>
                    {/* Direction markers */}
                    {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((dir, index) => {
                      const angle = index * 45;
                      const radian = (angle - 90) * (Math.PI / 180);
                      const x = 50 + 35 * Math.cos(radian);
                      const y = 50 + 35 * Math.sin(radian);
                      return (
                        <text key={dir} x={x} y={y} textAnchor="middle" dominantBaseline="middle" 
                              className="text-xs fill-gray-400 font-medium">
                          {dir}
                        </text>
                      );
                    })}
                    {/* Wind direction arrow */}
                    <g transform={`rotate(${currentWeather.wind.direction} 50 50)`}>
                      <polygon points="50,15 48,25 52,25" fill="#3b82f6" />
                      <line x1="50" y1="25" x2="50" y2="40" stroke="#3b82f6" strokeWidth="2"/>
                    </g>
                  </svg>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-lg font-bold text-gray-900">{getWindDirection(currentWeather.wind.direction)}</div>
                <div className="text-sm text-gray-600">{currentWeather.wind.direction}°</div>
              </div>
            </div>

            {/* Humedad */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="text-center mb-4">
                <div className="text-blue-500 flex justify-center mb-2">
                  <WeatherIcon type="humidity" size={32} />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Humedad</h3>
                <p className="text-xs text-gray-400">Porcentaje</p>
              </div>
              <div className="flex justify-center">
                <CircularProgress 
                  value={currentWeather.humidity.current} 
                  max={100} 
                  color="#3b82f6" 
                  size={100}
                />
              </div>
            </div>

            {/* Barómetro */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-purple-500">
                  <WeatherIcon type="pressure" size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Barómetro</h3>
                  <p className="text-xs text-gray-400">WeatherLink Live</p>
                </div>
              </div>
              {/* Pressure chart */}
              <div className="h-20 mb-3">
                <svg viewBox="0 0 200 60" className="w-full h-full">
                  <polyline
                    points="10,50 40,45 70,40 100,38 130,36 160,35 190,34"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                  />
                  <circle cx="190" cy="34" r="3" fill="#8b5cf6"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{currentWeather.pressure.current} hPa</div>
                <div className="text-sm text-gray-600">{getPressureTrend(currentWeather.pressure.trend)}</div>
              </div>
            </div>

            {/* Lluvia actual */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="text-center mb-4">
                <div className="text-blue-600 flex justify-center mb-2">
                  <WeatherIcon type="rain" size={32} />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Lluvia actual</h3>
                <p className="text-xs text-gray-400">Milímetros por hora</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{currentWeather.rain.current}</div>
                <div className="text-sm text-gray-600">mm/hr</div>
                <div className="mt-3">
                  <div className="text-sm font-medium text-gray-700">Total: {currentWeather.rain.total} mm</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {currentWeather.rain.current > 0 ? '🌧️ Lloviendo' : '☀️ Sin lluvia'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Second row with additional weather info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            
            {/* Lluvia Total */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1 min-h-[220px]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-blue-600">
                  <WeatherIcon type="rain" size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Lluvia total</h3>
                  <p className="text-xs text-gray-400">Acumulado diario</p>
                </div>
              </div>
              {/* Rain chart bars */}
              <div className="flex items-end justify-center space-x-2 h-16 mb-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-green-500 rounded-t" style={{ height: '40px' }}></div>
                  <div className="text-xs text-gray-400 mt-1">Día</div>
                  <div className="text-xs font-medium">{currentWeather.rain.total}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{ height: '25px' }}></div>
                  <div className="text-xs text-gray-400 mt-1">Mes</div>
                  <div className="text-xs font-medium">{(currentWeather.rain.total * 15).toFixed(1)}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{currentWeather.rain.total} mm</div>
                <div className="text-xs text-gray-500">Últimas 24h</div>
              </div>
            </div>

            {/* ET (Evapotranspiración) */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1 min-h-[220px]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-green-600">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25S18,10 18,14A6,6 0 0,1 12,20Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Evapotranspiración</h3>
                  <p className="text-xs text-gray-400">ET diaria</p>
                </div>
              </div>
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 border-8 border-green-200 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">--</div>
                    <div className="text-xs text-gray-400">mm</div>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500">Sin datos disponibles</div>
            </div>

            {/* Radiación Solar */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-yellow-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,15.31L23.31,12L20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Radiación solar</h3>
                  <p className="text-xs text-gray-400">Intensidad actual</p>
                </div>
              </div>
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 border-8 border-yellow-200 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600">--</div>
                    <div className="text-xs text-gray-400">W/m²</div>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500">Sin datos disponibles</div>
            </div>

            {/* Temperatura Interior */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-blue-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Interior</h3>
                  <p className="text-xs text-gray-400">Temp / Humedad</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">--°C</div>
                <div className="text-sm text-gray-600">Humedad: --%</div>
                <div className="text-xs text-gray-400 mt-2">Sin datos disponibles</div>
              </div>
            </div>

            {/* Sensación Térmica */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-red-500">
                  <WeatherIcon type="temperature" size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Índice THW</h3>
                  <p className="text-xs text-gray-400">Sensación térmica</p>
                </div>
              </div>
              <div className="flex justify-center">
                <CircularProgress 
                  value={currentWeather.temperature.feelsLike} 
                  max={50} 
                  color="#ef4444" 
                  size={80}
                />
              </div>
              <div className="text-center mt-2">
                <div className="text-sm text-gray-600">Sensación de {currentWeather.temperature.feelsLike}°C</div>
              </div>
            </div>

            {/* Pronóstico */}
            <div className="bg-white rounded-xl shadow-sm border p-6 col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-gray-500">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6,19A5,5 0 0,1 1,14A5,5 0 0,1 6,9C7,6.65 9.3,5 12,5C15.43,5 18.24,7.66 18.5,11.03L19,11A4,4 0 0,1 23,15A4,4 0 0,1 19,19H6M19,13H17V12A5,5 0 0,0 12,7C9.5,7 7.45,8.82 7.06,11.19C6.73,11.07 6.37,11 6,11A3,3 0 0,0 3,14A3,3 0 0,0 6,17H19A2,2 0 0,0 21,15A2,2 0 0,0 19,13Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pronóstico local</h3>
                  <p className="text-xs text-gray-400">WeatherLink Live</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">☁️</div>
                <div className="text-lg font-bold text-gray-900">Nublado</div>
                <div className="text-sm text-gray-600">Tarde</div>
                <div className="text-xs text-gray-400 mt-2">
                  Prob: 34%<br/>
                  próx 6-24 h
                </div>
              </div>
            </div>

          </div>

          {/* Bottom section with additional info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Station Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de la Estación</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentStationData?.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {currentStationData?.status === 'online' ? '🟢 En línea' : '🔴 Desconectada'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="text-gray-900">{currentStationData?.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Elevación:</span>
                  <span className="text-gray-900">{currentStationData?.elevation} m</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Día</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Temp. Max:</span>
                  <span className="text-gray-900 font-semibold">{currentWeather.temperature.max}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Temp. Min:</span>
                  <span className="text-gray-900 font-semibold">{currentWeather.temperature.min}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lluvia Total:</span>
                  <span className="text-gray-900 font-semibold">{currentWeather.rain.total} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Viento Max:</span>
                  <span className="text-gray-900 font-semibold">{currentWeather.wind.max} {currentWeather.wind.unit}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/station/${selectedStation}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  📊 Ver Detalles Completos
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  📈 Generar Reportes
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  ⚙️ Configuración
                </button>
              </div>
            </div>

          </div>
        </main>
      )}
      
      {/* Modales */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <AdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
      />
    </div>
  );
};

export default EnhancedDashboard;
