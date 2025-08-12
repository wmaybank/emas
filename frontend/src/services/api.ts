import { WeatherStation, WeatherData, Alert, ReportData, SystemHealth } from '../types/weather';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Función para convertir estación del backend al formato del frontend
function transformBackendStation(backendStation: any): WeatherStation {
  return {
    id: backendStation.id,
    name: backendStation.name || `Estación ${backendStation.id}`,
    location: backendStation.location || `Ubicación ${backendStation.id}`,
    coordinates: {
      latitude: backendStation.latitude || 0,
      longitude: backendStation.longitude || 0
    },
    status: backendStation.active ? 'online' : 'offline',
    lastUpdate: new Date(backendStation.created_at * 1000).toISOString(),
    elevation: backendStation.altitude || 0,
    timezone: 'America/Bogota' // Valor por defecto
  };
}

// Función para convertir datos del backend al formato del frontend
function transformBackendData(backendData: any): WeatherData {
  return {
    stationId: backendData.station_id,
    timestamp: new Date(backendData.timestamp * 1000).toISOString(), // Convertir timestamp Unix a ISO
    temperature: {
      current: backendData.temp || 0,
      min: backendData.temp || 0, // En datos actuales no tenemos min/max
      max: backendData.temp || 0,
      feelsLike: backendData.heat_index || backendData.temp || 0,
      avg: backendData.temp || 0,
      unit: 'C',
      low: backendData.temp || 0,
      high: backendData.temp || 0
    },
    humidity: {
      current: backendData.humidity || 0,
      min: backendData.humidity || 0,
      max: backendData.humidity || 0,
      avg: backendData.humidity || 0,
      low: backendData.humidity || 0,
      high: backendData.humidity || 0
    },
    pressure: {
      current: backendData.barometer ? backendData.barometer * 33.863886666667 : 0, // Convertir inHg a hPa
      min: backendData.barometer ? backendData.barometer * 33.863886666667 : 0,
      max: backendData.barometer ? backendData.barometer * 33.863886666667 : 0,
      avg: backendData.barometer ? backendData.barometer * 33.863886666667 : 0,
      trend: backendData.bar_trend > 0.01 ? 'rising' : backendData.bar_trend < -0.01 ? 'falling' : 'stable',
      unit: 'hPa'
    },
    wind: {
      speed: backendData.wind_speed_last || 0,
      direction: backendData.wind_dir_last || 0,
      gust: backendData.wind_speed_hi_2min || 0,
      average: backendData.wind_speed_avg_10min || 0,
      avg: backendData.wind_speed_avg_10min || 0,
      max: backendData.wind_speed_hi_10min || 0,
      unit: 'mph'
    },
    rain: {
      current: backendData.rain_rate_last || 0,
      total: backendData.rainfall_24hr || 0,
      maxHourly: backendData.rain_rate_hi || 0,
      intensity: backendData.rain_rate_last || 0
    },
    visibility: 10, // Valor por defecto, no disponible en WeatherLink
    uvIndex: backendData.uv_index || 0
  };
}

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
    const response = await this.request<{success: boolean, data: any[]}>('/stations');
    return response.data.map(transformBackendStation);
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
    return this.request<WeatherData[]>(`/data/historical?stationId=${stationId}&range=${timeRange}`);
  }

  async getCurrentWeather(stationId: string): Promise<WeatherData> {
    const response = await this.request<{success: boolean, data: any}>(`/data/current/${stationId}`);
    return transformBackendData(response.data);
  }

  async getHistoricalData(
    stationId: string, 
    startDate: string, 
    endDate: string
  ): Promise<WeatherData[]> {
    const response = await this.request<{success: boolean, data: WeatherData[]}>(
      `/data/historical?stationId=${stationId}&startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  // Alertas
  async getAlerts(): Promise<Alert[]> {
    const response = await this.request<{success: boolean, data: Alert[]}>('/data/alerts');
    return response.data;
  }

  async getStationAlerts(stationId: string): Promise<Alert[]> {
    const response = await this.request<{success: boolean, data: Alert[]}>(`/data/alerts?stationId=${stationId}`);
    return response.data;
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
