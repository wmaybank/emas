const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');
const winston = require('winston');
require('dotenv').config();

// Importar servicios y controladores
const WeatherStationManager = require('./services/weatherLinkService');
const DatabaseService = require('./services/databaseService');
const WebSocketService = require('./services/websocketService');
const stationsController = require('./controllers/stationsController');
const dataController = require('./controllers/dataController');
const reportsController = require('./controllers/reportsController');

// Importar logger centralizado
const logger = require('./utils/logger');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// Middleware de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://ema.chapelco.local', 'https://ema.chapelco.local'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Inicializar servicios
const dbService = new DatabaseService();
const weatherManager = new WeatherStationManager(dbService, logger);
const wsService = new WebSocketService(server, logger);

// Rutas API
app.use('/api/stations', stationsController);
app.use('/api/data', dataController);
app.use('/api/reports', reportsController);

// Ruta de estado del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stations: weatherManager.getStationsStatus()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'EMA Chapelco - Sistema de Monitoreo Meteorológico',
    version: '1.0.0',
    description: 'API para estaciones Davis Vantage Pro 2 con WeatherLink Live',
    endpoints: {
      stations: '/api/stations',
      data: '/api/data',
      reports: '/api/reports',
      health: '/api/health',
      websocket: '/ws/realtime'
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Inicializar servicios y comenzar recolección de datos
async function initializeServices() {
  try {
    // Inicializar base de datos
    await dbService.initialize();
    logger.info('Base de datos inicializada correctamente');

    // Configurar estaciones
    await weatherManager.initializeStations();
    logger.info('Estaciones meteorológicas configuradas');

    // Inicializar WebSocket
    wsService.initialize();
    logger.info('Servicio WebSocket inicializado');

    // Programar recolección de datos
    cron.schedule('*/30 * * * * *', async () => {
      try {
        await weatherManager.collectData();
      } catch (error) {
        logger.error('Error en recolección programada:', error);
      }
    });

    // Programar recolección UDP cada 2.5 segundos
    cron.schedule('*/2.5 * * * * *', async () => {
      try {
        await weatherManager.collectUDPData();
      } catch (error) {
        logger.error('Error en recolección UDP:', error);
      }
    });

    logger.info('Servicios inicializados correctamente');
  } catch (error) {
    logger.error('Error al inicializar servicios:', error);
    process.exit(1);
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT}`);
  initializeServices();
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;
