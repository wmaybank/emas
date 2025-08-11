import { WeatherStation, WeatherData, Alert, ReportData, SystemHealth } from '../types/weather';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class WeatherAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Estaciones
  async getStations(): Promise<WeatherStation[]> {
    return this.request<WeatherStation[]>('/stations');
  }

  async getStation(id: string): Promise<WeatherStation> {
    return this.request<WeatherStation>(`/stations/${id}`);
  }

  async createStation(station: Omit<WeatherStation, 'id'>): Promise<WeatherStation> {
    return this.request<WeatherStation>('/stations', {
      method: 'POST',
      body: JSON.stringify(station),
    });
  }

  async updateStation(id: string, updates: Partial<WeatherStation>): Promise<WeatherStation> {
    return this.request<WeatherStation>(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteStation(id: string): Promise<void> {
    return this.request<void>(`/stations/${id}`, {
      method: 'DELETE',
    });
  }

  // Datos Meteorológicos
  async getWeatherData(stationId: string, timeRange: '24h' | '7d' | '30d' = '24h'): Promise<WeatherData[]> {
    return this.request<WeatherData[]>(`/stations/${stationId}/weather?range=${timeRange}`);
  }

  async getCurrentWeather(stationId: string): Promise<WeatherData> {
    return this.request<WeatherData>(`/stations/${stationId}/weather/current`);
  }

  async getHistoricalData(
    stationId: string, 
    startDate: string, 
    endDate: string
  ): Promise<WeatherData[]> {
    return this.request<WeatherData[]>(
      `/stations/${stationId}/weather/historical?start=${startDate}&end=${endDate}`
    );
  }

  // Alertas
  async getAlerts(): Promise<Alert[]> {
    return this.request<Alert[]>('/alerts');
  }

  async getStationAlerts(stationId: string): Promise<Alert[]> {
    return this.request<Alert[]>(`/stations/${stationId}/alerts`);
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert> {
    return this.request<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledgedBy }),
    });
  }

  async deleteAlert(id: string): Promise<void> {
    return this.request<void>(`/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  // Reportes
  async getDailyReport(stationId: string, date: string): Promise<ReportData> {
    return this.request<ReportData>(`/reports/daily/${stationId}?date=${date}`);
  }

  async getMonthlyReport(stationId: string, month: string, year: string): Promise<ReportData> {
    return this.request<ReportData>(`/reports/monthly/${stationId}?month=${month}&year=${year}`);
  }

  async getYearlyReport(stationId: string, year: string): Promise<ReportData> {
    return this.request<ReportData>(`/reports/yearly/${stationId}?year=${year}`);
  }

  async exportReport(reportId: string, format: 'csv' | 'json' | 'pdf'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/export?format=${format}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Sistema
  async getSystemHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/system/health');
  }

  async getSystemStatus(): Promise<{
    status: string;
    uptime: number;
    services: Record<string, string>;
  }> {
    return this.request('/system/status');
  }

  async getSystemMetrics(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
    network: {
      bytesIn: number;
      bytesOut: number;
    };
  }> {
    return this.request('/system/metrics');
  }

  // Configuración
  async getSystemSettings(): Promise<any> {
    return this.request('/system/settings');
  }

  async updateSystemSettings(settings: any): Promise<any> {
    return this.request('/system/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // WebSocket
  async getWebSocketUrl(): Promise<{ url: string }> {
    return this.request<{ url: string }>('/websocket/url');
  }

  // Utilidades
  async ping(): Promise<{ status: string; timestamp: string }> {
    return this.request('/ping');
  }

  async getVersion(): Promise<{ version: string; build: string; date: string }> {
    return this.request('/version');
  }
}

export const weatherApi = new WeatherAPI();
