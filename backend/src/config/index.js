require('dotenv').config();

const config = {
  // Configuración del servidor
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
        'http://localhost:3000',
        'http://ema.chapelco.local',
        'https://ema.chapelco.local'
      ],
      credentials: true
    }
  },

  // Configuración de la base de datos
  database: {
    path: process.env.DB_PATH || './data/weather.db',
    backupPath: process.env.DB_BACKUP_PATH || './backups/',
    maxBackups: parseInt(process.env.DB_MAX_BACKUPS) || 30,
    backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL_HOURS) || 24
  },

  // Configuración de WeatherLink Live
  weatherlink: {
    apiKey: process.env.WEATHERLINK_API_KEY,
    apiSecret: process.env.WEATHERLINK_API_SECRET,
    baseUrl: process.env.WEATHERLINK_BASE_URL || 'https://api.weatherlink.com/v2',
    requestTimeout: parseInt(process.env.WEATHERLINK_TIMEOUT) || 10000,
    retryAttempts: parseInt(process.env.WEATHERLINK_RETRY_ATTEMPTS) || 3
  },

  // Configuración de estaciones UDP
  udp: {
    port: parseInt(process.env.UDP_PORT) || 22222,
    host: process.env.UDP_HOST || '0.0.0.0',
    bufferSize: parseInt(process.env.UDP_BUFFER_SIZE) || 1024,
    timeout: parseInt(process.env.UDP_TIMEOUT) || 5000
  },

  // Configuración de WebSocket
  websocket: {
    path: process.env.WS_PATH || '/ws/realtime',
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 100,
    compression: process.env.WS_COMPRESSION !== 'false'
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '5MB',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    rotationInterval: parseInt(process.env.LOG_ROTATION_INTERVAL_HOURS) || 1,
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30
  },

  // Configuración de seguridad
  security: {
    helmet: {
      enabled: process.env.HELMET_ENABLED !== 'false',
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"]
        }
      }
    },
    compression: {
      enabled: process.env.COMPRESSION_ENABLED !== 'false',
      level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // máximo 100 requests por ventana
    }
  },

  // Configuración de cron jobs
  cron: {
    dataCollection: {
      interval: parseInt(process.env.DATA_COLLECTION_INTERVAL) || 30, // segundos
      enabled: process.env.DATA_COLLECTION_ENABLED !== 'false'
    },
    udpCollection: {
      interval: parseFloat(process.env.UDP_COLLECTION_INTERVAL) || 2.5, // segundos
      enabled: process.env.UDP_COLLECTION_ENABLED !== 'false'
    },
    backup: {
      interval: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24,
      enabled: process.env.BACKUP_ENABLED !== 'false'
    },
    cleanup: {
      interval: parseInt(process.env.CLEANUP_INTERVAL_HOURS) || 24,
      enabled: process.env.CLEANUP_ENABLED !== 'false'
    }
  },

  // Configuración de alertas
  alerts: {
    checkInterval: parseInt(process.env.ALERT_CHECK_INTERVAL) || 60, // segundos
    retentionDays: parseInt(process.env.ALERT_RETENTION_DAYS) || 30,
    maxActiveAlerts: parseInt(process.env.ALERT_MAX_ACTIVE) || 100,
    notification: {
      email: {
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        smtp: {
          host: process.env.ALERT_EMAIL_SMTP_HOST,
          port: parseInt(process.env.ALERT_EMAIL_SMTP_PORT) || 587,
          secure: process.env.ALERT_EMAIL_SMTP_SECURE === 'true',
          auth: {
            user: process.env.ALERT_EMAIL_USER,
            pass: process.env.ALERT_EMAIL_PASS
          }
        }
      },
      webhook: {
        enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
        url: process.env.ALERT_WEBHOOK_URL,
        timeout: parseInt(process.env.ALERT_WEBHOOK_TIMEOUT) || 5000
      }
    }
  },

  // Configuración de reportes
  reports: {
    generation: {
      enabled: process.env.REPORT_GENERATION_ENABLED !== 'false',
      maxConcurrent: parseInt(process.env.REPORT_MAX_CONCURRENT) || 5,
      timeout: parseInt(process.env.REPORT_TIMEOUT_MS) || 300000 // 5 minutos
    },
    scheduling: {
      enabled: process.env.REPORT_SCHEDULING_ENABLED !== 'false',
      maxScheduled: parseInt(process.env.REPORT_MAX_SCHEDULED) || 50
    },
    retention: {
      days: parseInt(process.env.REPORT_RETENTION_DAYS) || 90,
      maxSize: parseInt(process.env.REPORT_MAX_SIZE_MB) || 1000 // 1GB
    },
    export: {
      csv: {
        enabled: true,
        maxRows: parseInt(process.env.REPORT_CSV_MAX_ROWS) || 100000
      },
      pdf: {
        enabled: process.env.REPORT_PDF_ENABLED !== 'false',
        templatePath: process.env.REPORT_PDF_TEMPLATE_PATH || './templates/reports/',
        maxPages: parseInt(process.env.REPORT_PDF_MAX_PAGES) || 100
      }
    }
  },

  // Configuración de unidades
  units: {
    temperature: process.env.UNIT_TEMPERATURE || 'celsius', // celsius, fahrenheit, kelvin
    pressure: process.env.UNIT_PRESSURE || 'hpa', // hpa, inhg, mmhg
    windSpeed: process.env.UNIT_WIND_SPEED || 'kmh', // kmh, mph, ms
    precipitation: process.env.UNIT_PRECIPITATION || 'mm', // mm, inches
    altitude: process.env.UNIT_ALTITUDE || 'm', // m, ft
    timezone: process.env.DEFAULT_TIMEZONE || 'America/Argentina/Buenos_Aires'
  },

  // Configuración de validación de datos
  validation: {
    temperature: {
      min: parseFloat(process.env.VALIDATION_TEMP_MIN) || -50,
      max: parseFloat(process.env.VALIDATION_TEMP_MAX) || 60
    },
    humidity: {
      min: parseFloat(process.env.VALIDATION_HUMIDITY_MIN) || 0,
      max: parseFloat(process.env.VALIDATION_HUMIDITY_MAX) || 100
    },
    pressure: {
      min: parseFloat(process.env.VALIDATION_PRESSURE_MIN) || 800,
      max: parseFloat(process.env.VALIDATION_PRESSURE_MAX) || 1200
    },
    windSpeed: {
      min: parseFloat(process.env.VALIDATION_WIND_MIN) || 0,
      max: parseFloat(process.env.VALIDATION_WIND_MAX) || 200
    }
  },

  // Configuración de desarrollo
  development: {
    mockData: process.env.MOCK_DATA === 'true',
    debugMode: process.env.DEBUG_MODE === 'true',
    testMode: process.env.TEST_MODE === 'true'
  }
};

// Validar configuración crítica
function validateConfig() {
  const errors = [];

  if (!config.weatherlink.apiKey && process.env.NODE_ENV === 'production') {
    errors.push('WEATHERLINK_API_KEY es requerida en producción');
  }

  if (!config.weatherlink.apiSecret && process.env.NODE_ENV === 'production') {
    errors.push('WEATHERLINK_API_SECRET es requerida en producción');
  }

  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Puerto del servidor debe estar entre 1 y 65535');
  }

  if (config.udp.port < 1 || config.udp.port > 65535) {
    errors.push('Puerto UDP debe estar entre 1 y 65535');
  }

  if (errors.length > 0) {
    console.error('❌ Errores de configuración:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
}

// Ejecutar validación si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

module.exports = config;
