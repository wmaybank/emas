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
    lastUpdate: backendStation.created_at ? new Date(backendStation.created_at * 1000).toISOString() : new Date().toISOString(),
    elevation: backendStation.altitude || 0,
    timezone: 'America/Argentina/Buenos_Aires' // Zona horaria de Buenos Aires
  };
}

// Función para convertir datos del backend al formato del frontend
function transformBackendData(backendData: any): WeatherData {
  // Función helper para redondear a decimales específicos
  const round = (num: number, decimals: number = 1): number => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Función helper para convertir Fahrenheit a Celsius
  const fahrenheitToCelsius = (fahrenheit: number): number => {
    return (fahrenheit - 32) * 5 / 9;
  };

  // Función helper para convertir mph a km/h
  const mphToKmh = (mph: number): number => {
    return mph * 1.609344;
  };

  // Convertir presión de inHg a hPa y redondear
  const pressureHPa = backendData.barometer ? round(backendData.barometer * 33.863886666667, 1) : 0;
  
  // Convertir temperaturas de Fahrenheit a Celsius
  const tempC = backendData.temp ? fahrenheitToCelsius(backendData.temp) : 0;
  const tempInC = backendData.temp_in ? fahrenheitToCelsius(backendData.temp_in) : 0;
  const heatIndexC = backendData.heat_index ? fahrenheitToCelsius(backendData.heat_index) : tempC;
  const windChillC = backendData.wind_chill ? fahrenheitToCelsius(backendData.wind_chill) : tempC;
  const dewPointC = backendData.dew_point ? fahrenheitToCelsius(backendData.dew_point) : 0;
  
  // Convertir velocidades de viento de mph a km/h
  const windSpeedKmh = backendData.wind_speed_last ? mphToKmh(backendData.wind_speed_last) : 0;
  const windGustKmh = backendData.wind_speed_hi_2min ? mphToKmh(backendData.wind_speed_hi_2min) : 0;
  const windAvgKmh = backendData.wind_speed_avg_10min ? mphToKmh(backendData.wind_speed_avg_10min) : 0;
  const windMaxKmh = backendData.wind_speed_hi_10min ? mphToKmh(backendData.wind_speed_hi_10min) : 0;
  
  // Convertir lluvia de inches a mm y filtrar valores extremos
  const rainCurrentMm = backendData.rain_rate_last ? backendData.rain_rate_last * 25.4 : 0;
  let rainTotalMm = backendData.rainfall_24hr ? backendData.rainfall_24hr * 25.4 : 0;
  const rainMaxHourlyMm = backendData.rain_rate_hi ? backendData.rain_rate_hi * 25.4 : 0;
  
  // Filtrar valores de lluvia extremos (más de 500mm en 24h es muy poco común)
  if (rainTotalMm > 500) {
    console.warn(`Valor de lluvia extremo detectado: ${rainTotalMm}mm, limitando a 0`);
    rainTotalMm = 0;
  }
  
  return {
    stationId: backendData.station_id,
    timestamp: new Date(backendData.timestamp).toISOString(), // El timestamp ya viene en milisegundos
    temperature: {
      current: round(tempC, 1),
      min: round(tempC, 1), // En datos actuales no tenemos min/max
      max: round(tempC, 1),
      feelsLike: round(heatIndexC, 1),
      avg: round(tempC, 1),
      unit: 'C',
      low: round(tempC, 1),
      high: round(tempC, 1),
      interior: round(tempInC, 1),
      windChill: round(windChillC, 1),
      dewPoint: round(dewPointC, 1)
    },
    humidity: {
      current: round(backendData.humidity || 0, 1),
      min: round(backendData.humidity || 0, 1),
      max: round(backendData.humidity || 0, 1),
      avg: round(backendData.humidity || 0, 1),
      low: round(backendData.humidity || 0, 1),
      high: round(backendData.humidity || 0, 1),
      interior: round(backendData.humidity_in || 0, 1)
    },
    pressure: {
      current: pressureHPa,
      min: pressureHPa,
      max: pressureHPa,
      avg: pressureHPa,
      trend: backendData.bar_trend > 0.01 ? 'rising' : backendData.bar_trend < -0.01 ? 'falling' : 'stable',
      unit: 'hPa'
    },
    wind: {
      speed: round(windSpeedKmh, 1),
      direction: Math.round(backendData.wind_dir_last || 0),
      gust: round(windGustKmh, 1),
      average: round(windAvgKmh, 1),
      avg: round(windAvgKmh, 1),
      max: round(windMaxKmh, 1),
      unit: 'km/h'
    },
    rain: {
      current: round(rainCurrentMm, 1),
      total: round(rainTotalMm, 1),
      maxHourly: round(rainMaxHourlyMm, 1),
      intensity: round(rainCurrentMm, 1)
    },
    visibility: 10, // Valor por defecto, no disponible en WeatherLink
    uvIndex: backendData.uv_index || 0
  };
}

// Función para transformar datos de reporte del backend al formato del frontend
function transformReportData(backendData: any): ReportData {
  return {
    stationId: backendData.stationId || '1',
    stationName: backendData.stationName || 'Estación Meteorológica',
    date: backendData.date || new Date().toISOString().split('T')[0],
    temperature: {
      avg: Math.round((backendData.temperature?.avg || 0) * 10) / 10,
      min: Math.round((backendData.temperature?.min || 0) * 10) / 10,
      max: Math.round((backendData.temperature?.max || 0) * 10) / 10
    },
    humidity: {
      avg: Math.round((backendData.humidity?.avg || 0) * 10) / 10,
      min: Math.round((backendData.humidity?.min || 0) * 10) / 10,
      max: Math.round((backendData.humidity?.max || 0) * 10) / 10
    },
    pressure: {
      avg: Math.round((backendData.pressure?.avg || 0) * 10) / 10,
      min: Math.round((backendData.pressure?.min || 0) * 10) / 10,
      max: Math.round((backendData.pressure?.max || 0) * 10) / 10
    },
    wind: {
      avg: Math.round((backendData.wind?.avg || 0) * 10) / 10,
      max: Math.round((backendData.wind?.max || 0) * 10) / 10,
      direction: Math.round(backendData.wind?.direction || 0)
    },
    rain: {
      total: Math.round((backendData.rain?.total || 0) * 10) / 10,
      maxHourly: Math.round((backendData.rain?.maxHourly || 0) * 10) / 10
    }
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
    const response = await this.request<{success: boolean, data: any}>(`/stations/${id}`);
    return transformBackendStation(response.data);
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
    const response = await this.request<{success: boolean, data: any}>(`/reports/daily?stationId=${stationId}&date=${date}`);
    return transformReportData(response.data);
  }

  async getMonthlyReport(stationId: string, month: string, year: string): Promise<ReportData> {
    const response = await this.request<{success: boolean, data: any}>(`/reports/monthly?stationId=${stationId}&month=${month}&year=${year}`);
    return transformReportData(response.data);
  }

  async getYearlyReport(stationId: string, year: string): Promise<ReportData> {
    const response = await this.request<{success: boolean, data: any}>(`/reports/yearly?stationId=${stationId}&year=${year}`);
    return transformReportData(response.data);
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
