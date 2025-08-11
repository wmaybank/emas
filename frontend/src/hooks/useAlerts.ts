import { useState, useEffect } from 'react';
import { weatherApi } from '../services/api';
import { Alert } from '../types/weather';

export const useAlerts = (stationId?: string) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: Alert[];
      if (stationId) {
        data = await weatherApi.getStationAlerts(stationId);
      } else {
        data = await weatherApi.getAlerts();
      }
      
      setAlerts(data);
    } catch (err) {
      setError('Error al cargar alertas');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [stationId]);

  const acknowledgeAlert = async (alertId: string, acknowledgedBy: string) => {
    try {
      await weatherApi.acknowledgeAlert(alertId, acknowledgedBy);
      await loadAlerts(); // Recargar alertas
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  return {
    alerts,
    loading,
    error,
    refetch: loadAlerts,
    acknowledgeAlert,
  };
};
