const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Debug temporal - verificar si se está leyendo el .env
console.log('🔍 Debug .env path:', path.join(__dirname, '../../.env'));
console.log('🔍 WEATHER_STATIONS from env:', process.env.WEATHER_STATIONS);
console.log('🔍 Current working directory:', process.cwd());

const config = {
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost'
  },

  database: {
    path: process.env.DB_PATH || './data/weather.db',
    backupPath: process.env.DB_BACKUP_PATH || './backups/'
  },

  weatherStations: {
    // Lista de estaciones WeatherLink Live locales
    stations: process.env.WEATHER_STATIONS ? 
      process.env.WEATHER_STATIONS.split(',').map(station => {
        const [ip, port] = station.trim().split(':');
        return {
          ip: ip.trim(),
          port: parseInt(port) || 80,
          baseUrl: `http://${ip.trim()}:${parseInt(port) || 80}`
        };
      }) : [
        { ip: '192.168.1.100', port: 80, baseUrl: 'http://192.168.1.100:80' },
        { ip: '192.168.1.101', port: 80, baseUrl: 'http://192.168.1.101:80' }
      ],
    pollingInterval: parseInt(process.env.STATION_POLLING_INTERVAL) || 30,
    requestTimeout: parseInt(process.env.STATION_REQUEST_TIMEOUT) || 5000
  },

  udp: {
    port: parseInt(process.env.UDP_PORT) || 22222,
    host: process.env.UDP_HOST || '0.0.0.0',
    enabled: process.env.UDP_ENABLED === 'true',
    broadcastInterval: parseFloat(process.env.UDP_BROADCAST_INTERVAL) || 2.5
  },

  websocket: {
    path: process.env.WS_PATH || '/ws/realtime',
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '5MB',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },

  security: {
    corsOrigins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://ema.chapelco.local', 'https://ema.chapelco.local'],
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false'
  },

  cron: {
    dataCollectionInterval: parseInt(process.env.DATA_COLLECTION_INTERVAL) || 30,
    udpCollectionInterval: parseFloat(process.env.UDP_COLLECTION_INTERVAL) || 2.5
  },

  alerts: {
    checkInterval: parseInt(process.env.ALERT_CHECK_INTERVAL) || 60,
    retentionDays: parseInt(process.env.ALERT_RETENTION_DAYS) || 30
  },

  reports: {
    generationEnabled: process.env.REPORT_GENERATION_ENABLED !== 'false',
    schedulingEnabled: process.env.REPORT_SCHEDULING_ENABLED !== 'false',
    retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS) || 90
  },

  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    intervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24,
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  },

  units: {
    temperature: process.env.DEFAULT_TEMPERATURE_UNIT || 'F',
    windSpeed: process.env.DEFAULT_WIND_SPEED_UNIT || 'mph',
    pressure: process.env.DEFAULT_PRESSURE_UNIT || 'inHg',
    rain: process.env.DEFAULT_RAIN_UNIT || 'in'
  },

  validation: {
    // Validaciones específicas para estaciones locales
    maxStations: 10,
    maxPollingInterval: 300, // 5 minutos máximo
    minPollingInterval: 10,  // 10 segundos mínimo
    maxRequestTimeout: 30000, // 30 segundos máximo
    minRequestTimeout: 1000   // 1 segundo mínimo
  }
};

// Función para validar la configuración
function validateConfig() {
  const errors = [];

  // Validar configuración de estaciones
  if (!config.weatherStations.stations || config.weatherStations.stations.length === 0) {
    errors.push('Debe configurar al menos una estación meteorológica local');
  }

  if (config.weatherStations.stations.length > config.validation.maxStations) {
    errors.push(`Máximo ${config.validation.maxStations} estaciones permitidas`);
  }

  if (config.weatherStations.pollingInterval < config.validation.minPollingInterval || 
      config.weatherStations.pollingInterval > config.validation.maxPollingInterval) {
    errors.push(`Intervalo de polling debe estar entre ${config.validation.minPollingInterval} y ${config.validation.maxPollingInterval} segundos`);
  }

  if (config.weatherStations.requestTimeout < config.validation.minRequestTimeout || 
      config.weatherStations.requestTimeout > config.validation.maxRequestTimeout) {
    errors.push(`Timeout de request debe estar entre ${config.validation.minRequestTimeout} y ${config.validation.maxRequestTimeout} ms`);
  }

  // Validar configuración UDP
  if (config.udp.port < 1024 || config.udp.port > 65535) {
    errors.push('Puerto UDP debe estar entre 1024 y 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Errores de configuración:\n${errors.join('\n')}`);
  }

  return true;
}

// Validar configuración al cargar
try {
  validateConfig();
  console.log('✅ Configuración válida');
} catch (error) {
  console.error('❌ Error en configuración:', error.message);
  process.exit(1);
}

module.exports = config;
