const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');
con  // Job para monitoreo de conectividad
  cron.schedule(`*/${config.cron.dataCollectionInterval} * * * * *`, async () => {
    try {
      logger.debug('Ejecutando job de monitoreo de conectividad...');
      
      // Usar el estado de las estaciones del servicio activo en lugar de hacer nuevas conexiones
      const stationsStatus = localWeatherService.getStationsStatus();
      const onlineStations = stationsStatus.filter(s => s.isOnline).length;
      
      logger.info(`Estado de conectividad: ${onlineStations}/${stationsStatus.length} estaciones online`);
      
    } catch (error) {
      logger.error('Error en job de monitoreo de conectividad:', error);
    }
  });e('path');

// Importar logger centralizado
const logger = require('./utils/logger');

// Importar servicios
const LocalWeatherStationService = require('./services/localWeatherStationService');
const DatabaseService = require('./services/databaseService');
const wsService = require('./services/websocket');

// Importar controladores
const stationsController = require('./controllers/stationsController');
const dataController = require('./controllers/dataController');
const reportsController = require('./controllers/reportsController');

// Importar configuración
const config = require('./config');

// Crear aplicación Express
const app = express();

// Configurar middleware de seguridad
if (config.security.helmetEnabled) {
  app.use(helmet());
}

// Configurar CORS
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true
}));

// Configurar compresión
if (config.security.compressionEnabled) {
  app.use(compression());
}

// Configurar middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Inicializar servicios
const dbService = new DatabaseService();
const localWeatherService = new LocalWeatherStationService();

// Hacer servicios disponibles para los controladores
app.locals.dbService = dbService;
app.locals.localWeatherService = localWeatherService;
app.locals.weatherManager = localWeatherService; // Alias para compatibilidad con controladores

// Configurar rutas de la API
app.use('/api/stations', stationsController);
app.use('/api/data', dataController);
app.use('/api/reports', reportsController);

// Ruta de salud del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'running',
      weatherStations: localWeatherService.isPolling ? 'polling' : 'stopped',
      websocket: wsService.isRunning() ? 'running' : 'stopped'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.server.env
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'EMAS Weather Monitoring System',
    version: '1.0.0',
    description: 'Sistema de monitoreo meteorológico para estaciones locales WeatherLink Live',
    endpoints: {
      stations: '/api/stations',
      data: '/api/data',
      reports: '/api/reports',
      health: '/api/health',
      websocket: config.websocket.path
    },
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Configurar WebSocket
app.ws = wsService;

// Inicializar base de datos y servicios
// Función para inicializar estaciones en la base de datos
async function initializeStations() {
  try {
    for (const station of config.weatherStations.stations) {
      const stationData = {
        id: station.ip, // Usar IP como ID único
        name: `Estación ${station.ip}`,
        ip: station.ip,
        location: `Estación meteorológica en ${station.ip}`,
        altitude: null,
        latitude: null,
        longitude: null,
        active: true
      };
      
      // Verificar si la estación ya existe
      const existingStation = await dbService.getStation(stationData.id);
      if (!existingStation) {
        await dbService.createStation(stationData);
        logger.info(`✅ Estación creada: ${stationData.id} (${stationData.name})`);
      } else {
        logger.info(`ℹ️ Estación ya existe: ${stationData.id}`);
      }
    }
  } catch (error) {
    logger.error('Error inicializando estaciones:', error);
    throw error;
  }
}

async function initializeServices() {
  try {
    logger.info('Inicializando servicios...');

    // Inicializar base de datos
    await dbService.initialize();
    logger.info('✅ Base de datos inicializada');

    // Inicializar estaciones en la base de datos
    await initializeStations();
    logger.info('✅ Estaciones inicializadas en la base de datos');

    // Iniciar servicio de estaciones locales
    localWeatherService.startPolling();
    logger.info('✅ Servicio de estaciones locales iniciado');

    // Configurar callback para datos de estaciones
    localWeatherService.onDataUpdate(async (stationsData) => {
      try {
        // Guardar datos en base de datos
        for (const stationData of stationsData) {
          await dbService.saveWeatherData(stationData);
        }

        // Enviar datos por WebSocket
        wsService.broadcastToAll({
          type: 'weather_data',
          data: stationsData,
          timestamp: new Date().toISOString()
        });

        logger.debug(`Datos de ${stationsData.length} estaciones procesados y enviados`);
      } catch (error) {
        logger.error('Error al procesar datos de estaciones:', error);
      }
    });

    // Iniciar WebSocket (se iniciará más tarde con attachToServer)
    // wsService.start();
    logger.info('✅ Servicio WebSocket preparado');

    logger.info('🎉 Todos los servicios inicializados correctamente');

  } catch (error) {
    logger.error('❌ Error al inicializar servicios:', error);
    process.exit(1);
  }
}

// Configurar cron jobs
function setupCronJobs() {
  logger.info('Configurando cron jobs...');

  // Job para recolección de datos de estaciones
  cron.schedule(`*/${config.cron.dataCollectionInterval} * * * * *`, async () => {
    try {
      logger.debug('Ejecutando job de recolección de datos...');
      
      // El servicio de estaciones ya maneja el polling automático
      // Este job es para verificar conectividad y estado
      const connectivity = await localWeatherService.checkConnectivity();
      const onlineStations = connectivity.filter(s => s.status === 'reachable').length;
      
      logger.info(`Estado de conectividad: ${onlineStations}/${connectivity.length} estaciones online`);
      
    } catch (error) {
      logger.error('Error en job de recolección de datos:', error);
    }
  });

  // Job para verificación de alertas
  cron.schedule(`*/${config.alerts.checkInterval} * * * * *`, async () => {
    try {
      logger.debug('Verificando alertas meteorológicas...');
      
      // Obtener datos actuales de todas las estaciones
      const currentData = await localWeatherService.getAllStationsData();
      
      // Verificar alertas para cada estación (solo si hay datos)
      if (currentData && Array.isArray(currentData)) {
        for (const stationData of currentData) {
          if (stationData) {
            await dbService.checkAlerts(stationData);
          }
        }
      }
      
    } catch (error) {
      logger.error('Error al verificar alertas:', error);
    }
  });

  // Job para respaldo de base de datos
  if (config.backup.enabled) {
    cron.schedule(`0 */${config.backup.intervalHours} * * *`, async () => {
      try {
        logger.info('Ejecutando respaldo de base de datos...');
        await dbService.createBackup();
        logger.info('✅ Respaldo completado');
      } catch (error) {
        logger.error('❌ Error al crear respaldo:', error);
      }
    });
  }

  logger.info('✅ Cron jobs configurados');
}

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  logger.info('Recibida señal SIGINT, cerrando servicios...');
  
  try {
    localWeatherService.stopPolling();
    wsService.stop();
    await dbService.close();
    
    logger.info('✅ Servicios cerrados correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error al cerrar servicios:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Recibida señal SIGTERM, cerrando servicios...');
  
  try {
    localWeatherService.stopPolling();
    wsService.stop();
    await dbService.close();
    
    logger.info('✅ Servicios cerrados correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error al cerrar servicios:', error);
    process.exit(1);
  }
});

// Inicializar aplicación
async function startApp() {
  try {
    // Inicializar servicios
    await initializeServices();
    
    // Configurar cron jobs
    setupCronJobs();
    
    // Iniciar servidor
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 Servidor iniciado en http://${config.server.host}:${config.server.port}`);
      logger.info(`📡 WebSocket disponible en ws://${config.server.host}:${config.server.port}${config.websocket.path}`);
      logger.info(`🌤️  Monitoreando ${localWeatherService.stations.length} estaciones meteorológicas`);
    });

    // Configurar WebSocket en el servidor HTTP
    wsService.attachToServer(server);

  } catch (error) {
    logger.error('❌ Error al iniciar aplicación:', error);
    process.exit(1);
  }
}

// Exportar app para testing
module.exports = app;

// Iniciar aplicación si este archivo se ejecuta directamente
if (require.main === module) {
  startApp();
}
