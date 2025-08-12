const express = require('express');
const router = express.Router();
const DatabaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * @route GET /api/reports/daily
 * @desc Generar reporte diario de todas las estaciones
 * @access Public
 */
router.get('/daily', async (req, res) => {
  try {
    const { date, stationId } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Crear una nueva instancia para cada request para evitar problemas de inicialización
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    const dailyReport = await dbService.generateDailyReport({
      date: targetDate,
      stationId: stationId || null
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
    
    // Crear una nueva instancia para cada request
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    const monthlyReport = await dbService.generateMonthlyReport({
      year: targetYear,
      month: targetMonth,
      stationId: stationId || null
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

module.exports = router;
