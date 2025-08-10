#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const DatabaseService = require('../services/databaseService');
const logger = require('../utils/logger');

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos...');
  
  try {
    // Crear directorios necesarios
    const dataDir = path.join(__dirname, '../../data');
    const logsDir = path.join(__dirname, '../../logs');
    const backupsDir = path.join(__dirname, '../../backups');
    
    [dataDir, logsDir, backupsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
      }
    });

    // Inicializar servicio de base de datos
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    console.log('✅ Base de datos inicializada correctamente');
    
    // Crear estaciones de ejemplo si no existen
    const stations = await dbService.getAllStations();
    if (stations.length === 0) {
      console.log('📡 Creando estaciones de ejemplo...');
      
      const exampleStations = [
        {
          name: 'Estación Base EMA Chapelco',
          type: 'davis_vantage_pro2',
          description: 'Estación meteorológica principal de EMA Chapelco',
          location: {
            latitude: -40.123,
            longitude: -71.456,
            altitude: 1000,
            address: 'Chapelco, San Martín de los Andes, Neuquén, Argentina'
          },
          weatherlink: {
            deviceId: process.env.WEATHERLINK_DEVICE_ID || 'example_device',
            apiKey: process.env.WEATHERLINK_API_KEY || 'example_key',
            apiSecret: process.env.WEATHERLINK_API_SECRET || 'example_secret'
          },
          udp: {
            enabled: true,
            port: parseInt(process.env.UDP_PORT) || 22222,
            host: process.env.UDP_HOST || '0.0.0.0'
          },
          parameters: [
            'temperature',
            'humidity',
            'pressure',
            'wind_speed',
            'wind_direction',
            'precipitation',
            'solar_radiation',
            'uv_index'
          ],
          status: 'active',
          lastDataReceived: new Date(),
          timezone: 'America/Argentina/Buenos_Aires'
        },
        {
          name: 'Estación Remota 1',
          type: 'davis_vantage_pro2',
          description: 'Estación meteorológica remota para monitoreo extendido',
          location: {
            latitude: -40.150,
            longitude: -71.500,
            altitude: 1200,
            address: 'Zona remota, Chapelco, Argentina'
          },
          weatherlink: {
            deviceId: process.env.WEATHERLINK_DEVICE_ID_2 || 'remote_device_1',
            apiKey: process.env.WEATHERLINK_API_KEY || 'example_key',
            apiSecret: process.env.WEATHERLINK_API_SECRET || 'example_secret'
          },
          udp: {
            enabled: false,
            port: 22223,
            host: '0.0.0.0'
          },
          parameters: [
            'temperature',
            'humidity',
            'pressure',
            'wind_speed',
            'wind_direction',
            'precipitation'
          ],
          status: 'active',
          lastDataReceived: new Date(),
          timezone: 'America/Argentina/Buenos_Aires'
        }
      ];

      for (const station of exampleStations) {
        await dbService.createStation(station);
        console.log(`✅ Estación creada: ${station.name}`);
      }
    } else {
      console.log(`📡 Se encontraron ${stations.length} estaciones existentes`);
    }

    // Crear alertas de ejemplo
    const alerts = await dbService.getActiveAlerts();
    if (alerts.length === 0) {
      console.log('🚨 Creando alertas de ejemplo...');
      
      const exampleAlerts = [
        {
          stationId: 1,
          name: 'Temperatura Alta',
          parameter: 'temperature',
          threshold: 30,
          condition: 'greater_than',
          message: 'Temperatura superior a 30°C detectada',
          severity: 'warning',
          enabled: true
        },
        {
          stationId: 1,
          name: 'Temperatura Baja',
          parameter: 'temperature',
          threshold: -10,
          condition: 'less_than',
          message: 'Temperatura inferior a -10°C detectada',
          severity: 'warning',
          enabled: true
        },
        {
          stationId: 1,
          name: 'Viento Fuerte',
          parameter: 'wind_speed',
          threshold: 50,
          condition: 'greater_than',
          message: 'Velocidad del viento superior a 50 km/h',
          severity: 'danger',
          enabled: true
        }
      ];

      for (const alert of exampleAlerts) {
        await dbService.createAlert(alert);
        console.log(`✅ Alerta creada: ${alert.name}`);
      }
    } else {
      console.log(`🚨 Se encontraron ${alerts.length} alertas existentes`);
    }

    // Crear plantillas de reportes
    const templates = await dbService.getReportTemplates();
    if (templates.length === 0) {
      console.log('📊 Creando plantillas de reportes...');
      
      const exampleTemplates = [
        {
          name: 'Reporte Diario Estándar',
          type: 'daily',
          description: 'Reporte diario con todos los parámetros principales',
          parameters: ['temperature', 'humidity', 'pressure', 'wind_speed', 'precipitation'],
          format: 'pdf',
          schedule: '0 6 * * *', // 6:00 AM diariamente
          enabled: true
        },
        {
          name: 'Reporte Mensual Resumido',
          type: 'monthly',
          description: 'Reporte mensual con estadísticas y tendencias',
          parameters: ['temperature', 'humidity', 'pressure', 'wind_speed', 'precipitation'],
          format: 'pdf',
          schedule: '0 8 1 * *', // 8:00 AM el primer día de cada mes
          enabled: true
        },
        {
          name: 'Reporte de Alertas',
          type: 'custom',
          description: 'Reporte de todas las alertas activas del período',
          parameters: ['alerts'],
          format: 'csv',
          schedule: '0 */4 * * *', // Cada 4 horas
          enabled: true
        }
      ];

      for (const template of exampleTemplates) {
        await dbService.createReportTemplate(template);
        console.log(`✅ Plantilla creada: ${template.name}`);
      }
    } else {
      console.log(`📊 Se encontraron ${templates.length} plantillas existentes`);
    }

    console.log('\n🎉 Configuración de la base de datos completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Base de datos: ${path.join(dataDir, 'weather.db')}`);
    console.log(`   - Logs: ${logsDir}`);
    console.log(`   - Respaldos: ${backupsDir}`);
    console.log(`   - Estaciones: ${(await dbService.getAllStations()).length}`);
    console.log(`   - Alertas: ${(await dbService.getActiveAlerts()).length}`);
    console.log(`   - Plantillas: ${(await dbService.getReportTemplates()).length}`);
    
    console.log('\n🚀 Puedes iniciar el servidor con: npm run dev');
    
  } catch (error) {
    console.error('❌ Error durante la configuración de la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
