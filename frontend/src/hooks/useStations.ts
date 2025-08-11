import { useState, useEffect } from 'react';
import { weatherApi } from '../services/api';
import { WeatherStation } from '../types/weather';

export const useStations = () => {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherApi.getStations();
      setStations(data);
    } catch (err) {
      setError('Error al cargar estaciones');
      console.error('Error loading stations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  return {
    stations,
    loading,
    error,
    refetch: loadStations,
  };
};
