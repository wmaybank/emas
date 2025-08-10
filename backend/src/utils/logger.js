const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Configurar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { 
    service: 'emas-weather',
    version: '1.0.0'
  },
  transports: [
    // Archivo de errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Archivo combinado
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Consola (solo en desarrollo)
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

// Logger para desarrollo con colores
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Función para crear logger específico para un módulo
logger.createModuleLogger = (moduleName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { 
      service: 'emas-weather',
      module: moduleName,
      version: '1.0.0'
    },
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880,
        maxFiles: 5
      }),
      ...(process.env.NODE_ENV === 'development' ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ] : [])
    ]
  });
};

// Función para rotar logs manualmente
logger.rotateLogs = async () => {
  try {
    const files = fs.readdirSync(logsDir);
    const logFiles = files.filter(file => file.endsWith('.log'));
    
    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > 5) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFileName = `${file.replace('.log', '')}_${timestamp}.log`;
        const newFilePath = path.join(logsDir, newFileName);
        
        fs.renameSync(filePath, newFilePath);
        logger.info(`Log rotado: ${file} -> ${newFileName}`);
      }
    }
  } catch (error) {
    console.error('Error al rotar logs:', error);
  }
};

// Función para limpiar logs antiguos
logger.cleanOldLogs = async (daysToKeep = 30) => {
  try {
    const files = fs.readdirSync(logsDir);
    const logFiles = files.filter(file => file.endsWith('.log'));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        logger.info(`Log antiguo eliminado: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error al limpiar logs antiguos:', error);
  }
};

// Configurar rotación automática de logs
if (process.env.NODE_ENV === 'production') {
  // Rotar logs cada hora
  setInterval(() => {
    logger.rotateLogs();
  }, 60 * 60 * 1000);
  
  // Limpiar logs antiguos diariamente
  setInterval(() => {
    logger.cleanOldLogs();
  }, 24 * 60 * 60 * 1000);
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesa rechazada no manejada:', reason);
});

module.exports = logger;
