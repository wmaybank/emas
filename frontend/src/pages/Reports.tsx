import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { weatherApi } from '../services/api';
import { WeatherStation, ReportData } from '../types/weather';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const data = await weatherApi.getStations();
      setStations(data);
      if (data.length > 0) {
        setSelectedStation(data[0].id);
      }
    } catch (err) {
      setError('Error al cargar estaciones');
    }
  };

  const generateReport = async () => {
    if (!selectedStation) return;

    setLoading(true);
    setError(null);

    try {
      let data;
      if (reportType === 'daily') {
        data = await weatherApi.getDailyReport(selectedStation, date);
      } else {
        data = await weatherApi.getMonthlyReport(selectedStation, month, year);
      }
      setReportData(data);
    } catch (err) {
      setError('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = `Estación,${reportData.stationName}
Fecha,${reportData.date}
Temperatura Promedio,${reportData.temperature.avg}°C
Temperatura Mínima,${reportData.temperature.min}°C
Temperatura Máxima,${reportData.temperature.max}°C
Humedad Promedio,${reportData.humidity.avg}%
Humedad Mínima,${reportData.humidity.min}%
Humedad Máxima,${reportData.humidity.max}%
Presión Promedio,${reportData.pressure.avg} hPa
Presión Mínima,${reportData.pressure.min} hPa
Presión Máxima,${reportData.pressure.max} hPa
Viento Promedio,${reportData.wind.avg} km/h
Viento Máximo,${reportData.wind.max} km/h
Dirección del Viento,${reportData.wind.direction}°
Lluvia Total,${reportData.rain.total} mm
Lluvia Máxima por Hora,${reportData.rain.maxHourly} mm`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${reportData.stationName}_${reportData.date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-weather-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-weather-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-weather-gray-600 hover:text-weather-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-weather-gray-900">
                  Reportes Meteorológicos
                </h1>
                <p className="text-weather-gray-600">
                  Genera y exporta reportes detallados
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Configuración del Reporte */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Configuración del Reporte
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Selección de Estación */}
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Estación
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} - {station.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'daily' | 'monthly')}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value="daily">Diario</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {reportType === 'daily' ? (
              <div>
                <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                    Mes
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="2020"
                    max="2030"
                    className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={generateReport}
            disabled={!selectedStation}
            className="bg-weather-blue-600 hover:bg-weather-blue-700 disabled:bg-weather-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Generar Reporte
          </button>
        </div>

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

        {/* Reporte Generado */}
        {reportData && (
          <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-weather-gray-900">
                Reporte: {reportData.stationName}
              </h2>
              <button
                onClick={exportReport}
                className="bg-weather-green-600 hover:bg-weather-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Temperatura */}
              <div className="bg-weather-red-50 border border-weather-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-weather-red-800 mb-3">Temperatura</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-weather-red-700">Promedio:</span>
                    <span className="font-semibold">{reportData.temperature.avg}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-red-700">Mínima:</span>
                    <span className="font-semibold">{reportData.temperature.min}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-red-700">Máxima:</span>
                    <span className="font-semibold">{reportData.temperature.max}°C</span>
                  </div>
                </div>
              </div>

              {/* Humedad */}
              <div className="bg-weather-blue-50 border border-weather-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-weather-blue-800 mb-3">Humedad</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-weather-blue-700">Promedio:</span>
                    <span className="font-semibold">{reportData.humidity.avg}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-blue-700">Mínima:</span>
                    <span className="font-semibold">{reportData.humidity.min}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-blue-700">Máxima:</span>
                    <span className="font-semibold">{reportData.humidity.max}%</span>
                  </div>
                </div>
              </div>

              {/* Presión */}
              <div className="bg-weather-green-50 border border-weather-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-weather-green-800 mb-3">Presión</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-weather-green-700">Promedio:</span>
                    <span className="font-semibold">{reportData.pressure.avg} hPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-green-700">Mínima:</span>
                    <span className="font-semibold">{reportData.pressure.min} hPa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-green-700">Máxima:</span>
                    <span className="font-semibold">{reportData.pressure.max} hPa</span>
                  </div>
                </div>
              </div>

              {/* Viento */}
              <div className="bg-weather-purple-50 border border-weather-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-weather-purple-800 mb-3">Viento</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-weather-purple-700">Promedio:</span>
                    <span className="font-semibold">{reportData.wind.avg} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-purple-700">Máximo:</span>
                    <span className="font-semibold">{reportData.wind.max} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-purple-700">Dirección:</span>
                    <span className="font-semibold">{reportData.wind.direction}°</span>
                  </div>
                </div>
              </div>

              {/* Lluvia */}
              <div className="bg-weather-teal-50 border border-weather-teal-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-weather-teal-800 mb-3">Lluvia</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-weather-teal-700">Total:</span>
                    <span className="font-semibold">{reportData.rain.total} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-teal-700">Máx. por Hora:</span>
                    <span className="font-semibold">{reportData.rain.maxHourly} mm</span>
                  </div>
                </div>
              </div>

              {/* Información General */}
              <div className="bg-weather-gray-50 border border-weather-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-weather-gray-800 mb-3">Información</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-weather-gray-700">Estación:</span>
                    <span className="font-semibold">{reportData.stationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-gray-700">Fecha:</span>
                    <span className="font-semibold">{reportData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-weather-gray-700">Tipo:</span>
                    <span className="font-semibold capitalize">{reportType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
