import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WeatherData } from '../types/weather';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherChartProps {
  data: WeatherData[];
  title?: string;
  height?: number;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ 
  data, 
  title = 'Datos Meteorológicos', 
  height = 300 
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['temperature', 'humidity']);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data]);

  const labels = sortedData.map(item => {
    const date = new Date(item.timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  });

  const temperatureData = sortedData.map(item => item.temperature.current);
  const humidityData = sortedData.map(item => item.humidity.current);
  const pressureData = sortedData.map(item => item.pressure.current);
  const windData = sortedData.map(item => item.wind.speed);
  const rainData = sortedData.map(item => item.rain.current);

  const datasets = [];
  
  if (selectedMetrics.includes('temperature')) {
    datasets.push({
      label: 'Temperatura (°C)',
      data: temperatureData,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      yAxisID: 'y',
    });
  }
  
  if (selectedMetrics.includes('humidity')) {
    datasets.push({
      label: 'Humedad (%)',
      data: humidityData,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      yAxisID: 'y1',
    });
  }
  
  if (selectedMetrics.includes('pressure')) {
    datasets.push({
      label: 'Presión (hPa)',
      data: pressureData,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      yAxisID: 'y2',
    });
  }
  
  if (selectedMetrics.includes('wind')) {
    datasets.push({
      label: 'Viento (km/h)',
      data: windData,
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      yAxisID: 'y1',
    });
  }
  
  if (selectedMetrics.includes('rain')) {
    datasets.push({
      label: 'Lluvia (mm)',
      data: rainData,
      borderColor: 'rgb(20, 184, 166)',
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      yAxisID: 'y1',
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Hora',
        },
      },
      y: {
        type: 'linear' as const,
        display: selectedMetrics.includes('temperature'),
        position: 'left' as const,
        title: {
          display: true,
          text: 'Temperatura (°C)',
        },
        min: Math.min(...temperatureData) - 5,
        max: Math.max(...temperatureData) + 5,
      },
      y1: {
        type: 'linear' as const,
        display: selectedMetrics.some(metric => ['humidity', 'wind', 'rain'].includes(metric)),
        position: 'right' as const,
        title: {
          display: true,
          text: 'Humedad (%) / Viento (km/h) / Lluvia (mm)',
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: Math.max(...humidityData, ...windData, ...rainData) * 1.1,
      },
      y2: {
        type: 'linear' as const,
        display: selectedMetrics.includes('pressure'),
        position: 'right' as const,
        title: {
          display: true,
          text: 'Presión (hPa)',
        },
        grid: {
          drawOnChartArea: false,
        },
        min: Math.min(...pressureData) - 10,
        max: Math.max(...pressureData) + 10,
      },
    },
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6">
      {/* Controles de métricas */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'temperature', label: 'Temperatura', color: 'bg-red-100 text-red-800' },
          { key: 'humidity', label: 'Humedad', color: 'bg-blue-100 text-blue-800' },
          { key: 'pressure', label: 'Presión', color: 'bg-green-100 text-green-800' },
          { key: 'wind', label: 'Viento', color: 'bg-purple-100 text-purple-800' },
          { key: 'rain', label: 'Lluvia', color: 'bg-teal-100 text-teal-800' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleMetric(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes(key)
                ? color
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ height }}>
        {data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">Sin datos disponibles</p>
              <p className="text-sm">No hay datos para mostrar en el gráfico</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherChart;
