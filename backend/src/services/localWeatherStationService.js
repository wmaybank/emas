const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class LocalWeatherStationService {
  constructor() {
    this.stations = config.weatherStations.stations;
    this.pollingInterval = config.weatherStations.pollingInterval;
    this.requestTimeout = config.weatherStations.requestTimeout;
    this.isPolling = false;
    this.pollingTimer = null;
    this.lastData = new Map();
    this.dataCallbacks = [];
    
    logger.info(`Servicio de estaciones locales inicializado con ${this.stations.length} estaciones`);
  }

  /**
   * Iniciar polling automático de todas las estaciones
   */
  startPolling() {
    if (this.isPolling) {
      logger.warn('Polling ya está activo');
      return;
    }

    this.isPolling = true;
    logger.info(`Iniciando polling automático cada ${this.pollingInterval} segundos`);

    // Polling inmediato
    this.pollAllStations();

    // Configurar polling periódico
    this.pollingTimer = setInterval(() => {
      this.pollAllStations();
    }, this.pollingInterval * 1000);
  }

  /**
   * Detener polling automático
   */
  stopPolling() {
    if (!this.isPolling) {
      return;
    }

    this.isPolling = false;
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    logger.info('Polling automático detenido');
  }

  /**
   * Obtener datos de todas las estaciones
   */
  async pollAllStations() {
    const promises = this.stations.map(station => 
      this.getStationData(station).catch(error => {
        logger.error(`Error al obtener datos de estación ${station.ip}:`, error.message);
        return null;
      })
    );

    try {
      const results = await Promise.allSettled(promises);
      const validResults = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      if (validResults.length > 0) {
        this.notifyDataCallbacks(validResults);
        logger.debug(`Datos obtenidos de ${validResults.length}/${this.stations.length} estaciones`);
      }
    } catch (error) {
      logger.error('Error en polling de estaciones:', error);
    }
  }

  /**
   * Obtener datos de una estación específica
   */
  async getStationData(station) {
    try {
      const url = `${station.baseUrl}/v1/current_conditions`;
      
      logger.debug(`Consultando estación ${station.ip}: ${url}`);

      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMAS-Weather-Monitor/1.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = response.data;
      
      if (!data.data || !data.data.conditions) {
        throw new Error('Formato de respuesta inválido');
      }

      // Procesar y normalizar datos
      const processedData = this.processStationData(station, data);
      
      // Almacenar último dato
      this.lastData.set(station.ip, {
        ...processedData,
        timestamp: new Date(),
        lastUpdate: new Date()
      });

      return processedData;

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn(`Estación ${station.ip} no disponible (conexión rechazada)`);
      } else if (error.code === 'ETIMEDOUT') {
        logger.warn(`Timeout al conectar con estación ${station.ip}`);
      } else {
        logger.error(`Error al obtener datos de estación ${station.ip}:`, error.message);
      }
      
      // Retornar último dato conocido si existe
      const lastKnownData = this.lastData.get(station.ip);
      if (lastKnownData) {
        lastKnownData.lastUpdate = new Date();
        lastKnownData.status = 'offline';
        return lastKnownData;
      }
      
      throw error;
    }
  }

  /**
   * Procesar y normalizar datos de la estación
   */
  processStationData(station, rawData) {
    const processed = {
      stationId: station.ip,
      stationIp: station.ip,
      stationPort: station.port,
      timestamp: new Date(rawData.data.ts * 1000),
      deviceId: rawData.data.did,
      status: 'online',
      sensors: []
    };

    // Procesar cada sensor/condición
    rawData.data.conditions.forEach(condition => {
      const sensor = this.processSensorData(condition);
      if (sensor) {
        processed.sensors.push(sensor);
      }
    });

    return processed;
  }

  /**
   * Procesar datos de un sensor específico
   */
  processSensorData(condition) {
    const sensor = {
      lsid: condition.lsid,
      txid: condition.txid,
      dataStructureType: condition.data_structure_type,
      type: this.getSensorType(condition.data_structure_type)
    };

    // Procesar según el tipo de sensor
    switch (condition.data_structure_type) {
      case 1: // ISS Current Conditions
        Object.assign(sensor, this.processISSSensor(condition));
        break;
      case 2: // Leaf/Soil Moisture
        Object.assign(sensor, this.processSoilSensor(condition));
        break;
      case 3: // LSS BAR
        Object.assign(sensor, this.processBarSensor(condition));
        break;
      case 4: // LSS Temp/Hum
        Object.assign(sensor, this.processTempHumSensor(condition));
        break;
      default:
        logger.warn(`Tipo de sensor no soportado: ${condition.data_structure_type}`);
        return null;
    }

    return sensor;
  }

  /**
   * Procesar sensor ISS (Integrated Sensor Suite)
   */
  processISSSensor(condition) {
    return {
      temperature: {
        current: condition.temp,
        dewPoint: condition.dew_point,
        wetBulb: condition.wet_bulb,
        heatIndex: condition.heat_index,
        windChill: condition.wind_chill,
        thwIndex: condition.thw_index,
        thswIndex: condition.thsw_index
      },
      humidity: {
        current: condition.hum
      },
      wind: {
        speed: {
          last: condition.wind_speed_last,
          avg1Min: condition.wind_speed_avg_last_1_min,
          avg2Min: condition.wind_speed_avg_last_2_min,
          avg10Min: condition.wind_speed_avg_last_10_min,
          hi2Min: condition.wind_speed_hi_last_2_min,
          hi10Min: condition.wind_speed_hi_last_10_min
        },
        direction: {
          last: condition.wind_dir_last,
          avg1Min: condition.wind_dir_scalar_avg_last_1_min,
          avg2Min: condition.wind_dir_scalar_avg_last_2_min,
          avg10Min: condition.wind_dir_scalar_avg_last_10_min,
          atHiSpeed2Min: condition.wind_dir_at_hi_speed_last_2_min,
          atHiSpeed10Min: condition.wind_dir_at_hi_speed_last_10_min
        }
      },
      rain: {
        size: condition.rain_size,
        rate: {
          last: condition.rain_rate_last,
          hi: condition.rain_rate_hi,
          hi15Min: condition.rain_rate_hi_last_15_min
        },
        accumulation: {
          last15Min: condition.rainfall_last_15_min,
          last60Min: condition.rainfall_last_60_min,
          last24Hr: condition.rainfall_last_24_hr,
          storm: condition.rain_storm,
          stormStart: condition.rain_storm_start_at,
          daily: condition.rainfall_daily,
          monthly: condition.rainfall_monthly,
          yearly: condition.rainfall_year
        }
      },
      solar: {
        radiation: condition.solar_rad,
        uvIndex: condition.uv_index
      },
      system: {
        rxState: condition.rx_state,
        transBatteryFlag: condition.trans_battery_flag
      }
    };
  }

  /**
   * Procesar sensor de suelo/hojas
   */
  processSoilSensor(condition) {
    return {
      soil: {
        temperature: {
          slot1: condition.temp_1,
          slot2: condition.temp_2,
          slot3: condition.temp_3,
          slot4: condition.temp_4
        },
        moisture: {
          slot1: condition.moist_soil_1,
          slot2: condition.moist_soil_2,
          slot3: condition.moist_soil_3,
          slot4: condition.moist_soil_4
        }
      },
      leaf: {
        wetness: {
          slot1: condition.wet_leaf_1,
          slot2: condition.wet_leaf_2
        }
      }
    };
  }

  /**
   * Procesar sensor de barómetro
   */
  processBarSensor(condition) {
    return {
      pressure: {
        current: condition.bar_sea_level,
        trend: condition.bar_trend,
        altimeter: condition.bar_altimeter
      }
    };
  }

  /**
   * Procesar sensor de temperatura/humedad
   */
  processTempHumSensor(condition) {
    return {
      temperature: {
        current: condition.temp,
        hi: condition.temp_hi,
        low: condition.temp_low
      },
      humidity: {
        current: condition.hum,
        hi: condition.hum_hi,
        low: condition.hum_low
      }
    };
  }

  /**
   * Obtener tipo de sensor legible
   */
  getSensorType(dataStructureType) {
    const types = {
      1: 'ISS',
      2: 'Soil/Leaf',
      3: 'Barometer',
      4: 'Temp/Humidity'
    };
    return types[dataStructureType] || 'Unknown';
  }

  /**
   * Obtener datos de una estación específica por IP
   */
  async getStationDataByIp(ip) {
    const station = this.stations.find(s => s.ip === ip);
    if (!station) {
      throw new Error(`Estación con IP ${ip} no encontrada`);
    }
    return await this.getStationData(station);
  }

  /**
   * Obtener datos de todas las estaciones
   */
  async getAllStationsData() {
    return await this.pollAllStations();
  }

  /**
   * Obtener último dato conocido de una estación
   */
  getLastKnownData(ip) {
    return this.lastData.get(ip) || null;
  }

  /**
   * Obtener estado de todas las estaciones
   */
  getStationsStatus() {
    return this.stations.map(station => {
      const lastData = this.lastData.get(station.ip);
      return {
        ip: station.ip,
        port: station.port,
        baseUrl: station.baseUrl,
        status: lastData ? 'online' : 'offline',
        lastUpdate: lastData ? lastData.lastUpdate : null,
        lastData: lastData ? {
          timestamp: lastData.timestamp,
          deviceId: lastData.deviceId,
          sensorCount: lastData.sensors.length
        } : null
      };
    });
  }

  /**
   * Registrar callback para notificaciones de datos
   */
  onDataUpdate(callback) {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notificar a todos los callbacks registrados
   */
  notifyDataCallbacks(data) {
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error('Error en callback de datos:', error);
      }
    });
  }

  /**
   * Verificar conectividad con todas las estaciones
   */
  async checkConnectivity() {
    const results = await Promise.allSettled(
      this.stations.map(async station => {
        try {
          const startTime = Date.now();
          await axios.get(`${station.baseUrl}/v1/current_conditions`, {
            timeout: 5000
          });
          const responseTime = Date.now() - startTime;
          
          return {
            ip: station.ip,
            status: 'reachable',
            responseTime,
            timestamp: new Date()
          };
        } catch (error) {
          return {
            ip: station.ip,
            status: 'unreachable',
            error: error.message,
            timestamp: new Date()
          };
        }
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        ip: 'unknown',
        status: 'error',
        error: result.reason?.message || 'Unknown error',
        timestamp: new Date()
      }
    );
  }
}

module.exports = LocalWeatherStationService;
