export interface WeatherStation {
  id: string;
  name: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: 'online' | 'offline' | 'maintenance';
  lastUpdate: string;
  elevation: number;
  timezone: string;
}

export interface WeatherData {
  stationId: string;
  timestamp: string;
  temperature: {
    current: number;
    min: number;
    max: number;
    feelsLike: number;
    avg: number;
    unit: string;
    low: number;
    high: number;
  };
  humidity: {
    current: number;
    min: number;
    max: number;
    avg: number;
    low: number;
    high: number;
  };
  pressure: {
    current: number;
    min: number;
    max: number;
    avg: number;
    trend: 'rising' | 'falling' | 'stable';
    unit: string;
  };
  wind: {
    speed: number;
    direction: number;
    gust: number;
    average: number;
    avg: number;
    max: number;
    unit: string;
  };
  rain: {
    current: number;
    total: number;
    maxHourly: number;
    intensity: number;
  };
  visibility: number;
  uvIndex: number;
}

export interface Alert {
  id: string;
  stationId: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
  isActive: boolean;
  threshold: {
    metric: string;
    value: number;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    min?: number;
    max?: number;
    unit: string;
  };
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

export interface StationSummary {
  station: WeatherStation;
  currentData: WeatherData;
  alerts: Alert[];
  isOnline: boolean;
  lastUpdateAgo: string;
}

export interface ReportData {
  stationId: string;
  stationName: string;
  date: string;
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  humidity: {
    avg: number;
    min: number;
    max: number;
  };
  pressure: {
    avg: number;
    min: number;
    max: number;
  };
  wind: {
    avg: number;
    max: number;
    direction: number;
  };
  rain: {
    total: number;
    maxHourly: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastBackup: string;
  databaseStatus: 'connected' | 'disconnected';
  apiStatus: 'operational' | 'degraded' | 'down';
  activeConnections: number;
  errors: string[];
  warnings: string[];
}

export interface SystemSettings {
  updateInterval: number;
  alertThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    pressure: { min: number; max: number };
    wind: { max: number };
    rain: { max: number };
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  units: {
    temperature: 'C' | 'F';
    wind: 'km/h' | 'mph';
    pressure: 'hPa' | 'inHg';
    rain: 'mm' | 'in';
  };
}
