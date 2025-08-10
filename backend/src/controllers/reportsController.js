const express = require('express');
const router = express.Router();
const DatabaseService = require('../services/databaseService');
const logger = require('../utils/logger');

// Instanciar servicio de base de datos
const dbService = new DatabaseService();

/**
 * @route GET /api/reports/daily
 * @desc Generar reporte diario de todas las estaciones
 * @access Public
 */
router.get('/daily', async (req, res) => {
  try {
    const { date, stationId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const dailyReport = await dbService.generateDailyReport({
      date: targetDate,
      stationId: stationId ? parseInt(stationId) : null
    });
    
    res.json({
      success: true,
      data: dailyReport,
      date: targetDate.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al generar reporte diario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte diario',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/monthly
 * @desc Generar reporte mensual de todas las estaciones
 * @access Public
 */
router.get('/monthly', async (req, res) => {
  try {
    const { year, month, stationId } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    
    const monthlyReport = await dbService.generateMonthlyReport({
      year: targetYear,
      month: targetMonth,
      stationId: stationId ? parseInt(stationId) : null
    });
    
    res.json({
      success: true,
      data: monthlyReport,
      period: { year: targetYear, month: targetMonth },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al generar reporte mensual:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte mensual',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/custom
 * @desc Generar reporte personalizado con filtros
 * @access Public
 */
router.get('/custom', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      stationId,
      parameters,
      groupBy = 'day',
      includeCharts = 'false'
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Las fechas de inicio y fin son requeridas'
      });
    }

    const filters = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      stationId: stationId ? parseInt(stationId) : null,
      parameters: parameters ? parameters.split(',') : null,
      groupBy,
      includeCharts: includeCharts === 'true'
    };

    const customReport = await dbService.generateCustomReport(filters);
    
    res.json({
      success: true,
      data: customReport,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al generar reporte personalizado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte personalizado',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/summary
 * @desc Obtener resumen de datos meteorológicos
 * @access Public
 */
router.get('/summary', async (req, res) => {
  try {
    const { period = '24h', stationId } = req.query;
    
    const summary = await dbService.generateSummary({
      period,
      stationId: stationId ? parseInt(stationId) : null
    });
    
    res.json({
      success: true,
      data: summary,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al generar resumen:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar resumen',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/extremes
 * @desc Obtener valores extremos (máximos y mínimos)
 * @access Public
 */
router.get('/extremes', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      stationId,
      parameters
    } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días por defecto
      endDate: endDate ? new Date(endDate) : new Date(),
      stationId: stationId ? parseInt(stationId) : null,
      parameters: parameters ? parameters.split(',') : null
    };

    const extremes = await dbService.getExtremeValues(filters);
    
    res.json({
      success: true,
      data: extremes,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al obtener valores extremos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener valores extremos',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/trends
 * @desc Analizar tendencias de los datos meteorológicos
 * @access Public
 */
router.get('/trends', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      stationId,
      parameters,
      trendType = 'linear'
    } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Última semana por defecto
      endDate: endDate ? new Date(endDate) : new Date(),
      stationId: stationId ? parseInt(stationId) : null,
      parameters: parameters ? parameters.split(',') : null,
      trendType
    };

    const trends = await dbService.analyzeTrends(filters);
    
    res.json({
      success: true,
      data: trends,
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al analizar tendencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al analizar tendencias',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/export/:type
 * @desc Exportar reporte en diferentes formatos
 * @access Public
 */
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, stationId, format = 'pdf' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Las fechas de inicio y fin son requeridas'
      });
    }

    const filters = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      stationId: stationId ? parseInt(stationId) : null
    };

    let reportData;
    let filename;

    switch (type) {
      case 'daily':
        reportData = await dbService.generateDailyReport(filters);
        filename = `daily_report_${startDate}_${endDate}`;
        break;
      case 'monthly':
        reportData = await dbService.generateMonthlyReport(filters);
        filename = `monthly_report_${startDate}_${endDate}`;
        break;
      case 'custom':
        reportData = await dbService.generateCustomReport(filters);
        filename = `custom_report_${startDate}_${endDate}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de reporte no válido'
        });
    }

    if (format === 'pdf') {
      const pdfBuffer = await dbService.exportReportToPDF(reportData, type);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'csv') {
      const csvData = await dbService.exportReportToCSV(reportData, type);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.status(400).json({
        success: false,
        error: 'Formato no soportado. Solo se admite PDF y CSV'
      });
    }
  } catch (error) {
    logger.error('Error al exportar reporte:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar reporte',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reports/templates
 * @desc Obtener plantillas de reportes disponibles
 * @access Public
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await dbService.getReportTemplates();
    
    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error al obtener plantillas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener plantillas',
      message: error.message
    });
  }
});

/**
 * @route POST /api/reports/schedule
 * @desc Programar generación automática de reportes
 * @access Public
 */
router.post('/schedule', async (req, res) => {
  try {
    const {
      name,
      type,
      schedule,
      recipients,
      parameters
    } = req.body;

    if (!name || !type || !schedule) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, tipo y programación son requeridos'
      });
    }

    const scheduledReport = await dbService.scheduleReport({
      name,
      type,
      schedule,
      recipients: recipients || [],
      parameters: parameters || {}
    });
    
    res.status(201).json({
      success: true,
      data: scheduledReport,
      message: 'Reporte programado correctamente'
    });
  } catch (error) {
    logger.error('Error al programar reporte:', error);
    res.status(500).json({
      success: false,
      error: 'Error al programar reporte',
      message: error.message
    });
  }
});

module.exports = router;
