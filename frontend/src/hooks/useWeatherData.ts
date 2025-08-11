import { useState, useEffect, useCallback } from 'react';
import { weatherApi } from '../services/api';
import { WeatherData } from '../types/weather';

export const useWeatherData = (stationId: string | null, interval: number = 30000) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!stationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const weatherData = await weatherApi.getCurrentWeather(stationId);
      setData(weatherData);
    } catch (err) {
      setError('Error al cargar datos del clima');
      console.error('Error loading weather data:', err);
    } finally {
      setLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    if (stationId) {
      loadData();
      
      const intervalId = setInterval(loadData, interval);
      return () => clearInterval(intervalId);
    }
  }, [stationId, interval, loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
  };
};
