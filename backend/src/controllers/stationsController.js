const express = require('express');
const router = express.Router();

// Middleware para obtener el servicio de base de datos
const getDatabaseService = (req) => req.app.locals.dbService;
const getWeatherManager = (req) => req.app.locals.weatherManager;

/**
 * @route GET /api/stations
 * @desc Obtener lista de todas las estaciones configuradas
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const dbService = getDatabaseService(req);
    const stations = await dbService.getAllStations();
    
    res.json({
      success: true,
      data: stations,
      count: stations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al obtener estaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stations/:id
 * @desc Obtener información detallada de una estación específica
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbService = getDatabaseService(req);
    
    const station = await dbService.getStation(id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Estación no encontrada',
        message: `No se encontró la estación con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: station,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al obtener estación ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stations/:id/current
 * @desc Obtener condiciones actuales de una estación específica
 * @access Public
 */
router.get('/:id/current', async (req, res) => {
  try {
    const { id } = req.params;
    const weatherManager = getWeatherManager(req);
    
    const currentConditions = await weatherManager.getCurrentConditions(id);
    
    if (!currentConditions) {
      return res.status(404).json({
        success: false,
        error: 'Datos no disponibles',
        message: `No hay datos actuales para la estación: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: currentConditions,
      timestamp: new Date().toISOString(),
      station: id
    });
  } catch (error) {
    console.error(`Error al obtener condiciones actuales de ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stations/:id/history
 * @desc Obtener datos históricos de una estación con filtros
 * @access Public
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      limit = 100, 
      offset = 0, 
      start_date, 
      end_date,
      fields 
    } = req.query;
    
    const dbService = getDatabaseService(req);
    
    let data;
    if (start_date && end_date) {
      const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(end_date).getTime() / 1000);
      data = await dbService.getWeatherReadingsByDateRange(id, startTimestamp, endTimestamp);
    } else {
      data = await dbService.getWeatherReadings(id, parseInt(limit), parseInt(offset));
    }
    
    // Filtrar campos si se especifican
    if (fields && Array.isArray(fields)) {
      data = data.map(reading => {
        const filtered = {};
        fields.forEach(field => {
          if (reading[field] !== undefined) {
            filtered[field] = reading[field];
          }
        });
        return filtered;
      });
    }
    
    res.json({
      success: true,
      data: data,
      count: data.length,
      station: id,
      filters: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        start_date,
        end_date,
        fields
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al obtener historial de ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stations/:id/stats
 * @desc Obtener estadísticas de una estación para un período específico
 * @access Public
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period, date, year, month } = req.query;
    const dbService = getDatabaseService(req);
    
    let stats;
    let periodInfo;
    
    switch (period) {
      case 'daily':
        if (!date) {
          return res.status(400).json({
            success: false,
            error: 'Fecha requerida',
            message: 'Se requiere el parámetro date para estadísticas diarias'
          });
        }
        stats = await dbService.getDailyStats(id, date);
        periodInfo = { period: 'daily', date };
        break;
        
      case 'monthly':
        if (!year || !month) {
          return res.status(400).json({
            success: false,
            error: 'Año y mes requeridos',
            message: 'Se requieren los parámetros year y month para estadísticas mensuales'
          });
        }
        stats = await dbService.getMonthlyStats(id, parseInt(year), parseInt(month));
        periodInfo = { period: 'monthly', year: parseInt(year), month: parseInt(month) };
        break;
        
      case 'yearly':
        if (!year) {
          return res.status(400).json({
            success: false,
            error: 'Año requerido',
            message: 'Se requiere el parámetro year para estadísticas anuales'
          });
        }
        stats = await dbService.getYearlyStats(id, parseInt(year));
        periodInfo = { period: 'yearly', year: parseInt(year) };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Período inválido',
          message: 'El período debe ser: daily, monthly o yearly'
        });
    }
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Estadísticas no disponibles',
        message: `No hay estadísticas disponibles para la estación ${id} en el período especificado`
      });
    }
    
    res.json({
      success: true,
      data: stats,
      station: id,
      period: periodInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al obtener estadísticas de ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stations/:id/wind-rose
 * @desc Obtener datos para generar rosa de vientos
 * @access Public
 */
router.get('/:id/wind-rose', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Fechas requeridas',
        message: 'Se requieren start_date y end_date para generar la rosa de vientos'
      });
    }
    
    const dbService = getDatabaseService(req);
    const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(end_date).getTime() / 1000);
    
    const windRoseData = await dbService.getWindRoseData(id, startTimestamp, endTimestamp);
    
    res.json({
      success: true,
      data: windRoseData,
      station: id,
      period: { start_date, end_date },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al obtener rosa de vientos de ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/stations
 * @desc Crear una nueva estación meteorológica
 * @access Private (requiere autenticación en producción)
 */
router.post('/', async (req, res) => {
  try {
    const stationData = req.body;
    
    // Validaciones básicas
    if (!stationData.id || !stationData.name || !stationData.ip_address) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requieren id, name e ip_address'
      });
    }
    
    const dbService = getDatabaseService(req);
    const result = await dbService.createStation(stationData);
    
    res.status(201).json({
      success: true,
      message: 'Estación creada correctamente',
      data: { id: stationData.id, ...stationData },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al crear estación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/stations/:id
 * @desc Actualizar información de una estación
 * @access Private (requiere autenticación en producción)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos de actualización requeridos',
        message: 'Se requieren campos para actualizar'
      });
    }
    
    const dbService = getDatabaseService(req);
    const result = await dbService.updateStation(id, updates);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estación no encontrada',
        message: `No se encontró la estación con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      message: 'Estación actualizada correctamente',
      data: { id, ...updates },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al actualizar estación ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/stations/:id
 * @desc Eliminar una estación (desactivar)
 * @access Private (requiere autenticación en producción)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbService = getDatabaseService(req);
    
    // En lugar de eliminar, desactivar la estación
    const result = await dbService.updateStation(id, { active: false });
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estación no encontrada',
        message: `No se encontró la estación con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      message: 'Estación desactivada correctamente',
      data: { id, active: false },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al desactivar estación ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/stations/:id/status
 * @desc Obtener estado de conexión y última lectura de una estación
 * @access Public
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const weatherManager = getWeatherManager(req);
    
    const status = weatherManager.getStationsStatus()[id];
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Estación no encontrada',
        message: `No se encontró la estación con ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: status,
      station: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error al obtener estado de ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;
