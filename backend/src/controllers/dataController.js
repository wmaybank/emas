const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route GET /api/data/current
 * @desc Obtener datos actuales de todas las estaciones
 * @access Public
 */
router.get('/current', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;
    const currentData = await dbService.getCurrentData();
    res.json({
      success: true,
      data: currentData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al obtener datos actuales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos actuales',
      message: error.message
    });
  }
});

/**
 * @route GET /api/data/current/:stationId
 * @desc Obtener datos actuales de una estación específica
 * @access Public
 */
router.get('/current/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const dbService = req.app.locals.dbService;
    const currentData = await dbService.getCurrentDataByStation(stationId);
    
    if (!currentData) {
      return res.status(404).json({
        success: false,
        error: 'Estación no encontrada o sin datos'
      });
    }
    
    res.json({
      success: true,
      data: currentData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error al obtener datos de estación ${req.params.stationId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos de la estación',
      message: error.message
    });
  }
});

/**
 * @route GET /api/data/historical
 * @desc Obtener datos históricos con filtros
 * @access Public
 */
router.get('/historical', async (req, res) => {
  try {
    const {
      stationId,
      startDate,
      endDate,
      limit = 1000,
      offset = 0,
      parameters
    } = req.query;

    const filters = {
      stationId: stationId ? parseInt(stationId) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
      parameters: parameters ? parameters.split(',') : null
    };

    const dbService = req.app.locals.dbService;
    const historicalData = await dbService.getHistoricalData(filters);
    
    res.json({
      success: true,
      data: historicalData,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al obtener datos históricos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos históricos',
      message: error.message
    });
  }
});

/**
 * @route GET /api/data/statistics
 * @desc Obtener estadísticas de los datos
 * @access Public
 */
router.get('/statistics', async (req, res) => {
  try {
    const {
      stationId,
      startDate,
      endDate,
      groupBy = 'hour'
    } = req.query;

    const filters = {
      stationId: stationId ? parseInt(stationId) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      groupBy
    };

    const dbService = req.app.locals.dbService;
    const statistics = await dbService.getDataStatistics(filters);
    
    res.json({
      success: true,
      data: statistics,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

/**
 * @route GET /api/data/parameters
 * @desc Obtener lista de parámetros disponibles
 * @access Public
 */
router.get('/parameters', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;
    const parameters = await dbService.getAvailableParameters();
    
    res.json({
      success: true,
      data: parameters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al obtener parámetros:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener parámetros',
      message: error.message
    });
  }
});

/**
 * @route GET /api/data/export
 * @desc Exportar datos en formato CSV
 * @access Public
 */
router.get('/export', async (req, res) => {
  try {
    const {
      stationId,
      startDate,
      endDate,
      format = 'csv',
      parameters
    } = req.query;

    const filters = {
      stationId: stationId ? parseInt(stationId) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      parameters: parameters ? parameters.split(',') : null
    };

    if (format === 'csv') {
      const dbService = req.app.locals.dbService;
      const csvData = await dbService.exportDataToCSV(filters);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="weather_data_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      res.status(400).json({
        success: false,
        error: 'Formato no soportado. Solo se admite CSV'
      });
    }
  } catch (error) {
    logger.error('Error al exportar datos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar datos',
      message: error.message
    });
  }
});

/**
 * @route GET /api/data/alerts
 * @desc Obtener alertas meteorológicas activas
 * @access Public
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

router.get('/alerts', async (req, res) => {
  try {
    console.log('Debug: Starting alerts endpoint');
    console.log('Debug: req.app.locals:', Object.keys(req.app.locals || {}));
    
    const dbService = req.app.locals.dbService;
    console.log('Debug: dbService type:', typeof dbService);
    
    if (!dbService) {
      console.log('Debug: dbService is null/undefined');
      return res.status(500).json({
        success: false,
        error: 'Servicio de base de datos no disponible'
      });
    }
    
    console.log('Debug: About to call getActiveAlerts');
    const alerts = await dbService.getActiveAlerts();
    console.log('Debug: alerts result:', alerts);
    
    res.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('Debug: Error occurred:', error.message);
    logger.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener alertas',
      message: error.message
    });
  }
});

/**
 * @route POST /api/data/alerts
 * @desc Crear una nueva alerta meteorológica
 * @access Public
 */
router.post('/alerts', async (req, res) => {
  try {
    const { stationId, parameter, threshold, condition, message } = req.body;
    
    if (!stationId || !parameter || !threshold || !condition) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos'
      });
    }

    const dbService = req.app.locals.dbService;
    const alert = await dbService.createAlert({
      stationId: parseInt(stationId),
      parameter,
      threshold: parseFloat(threshold),
      condition,
      message: message || `Alerta: ${parameter} ${condition} ${threshold}`
    });
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alerta creada correctamente'
    });
  } catch (error) {
    logger.error('Error al crear alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear alerta',
      message: error.message
    });
  }
});

module.exports = router;
