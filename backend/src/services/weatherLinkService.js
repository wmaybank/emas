const axios = require('axios');
const dgram = require('dgram');
const { UnitConverter } = require('../utils/unitConverter');

class WeatherStationManager {
  constructor(databaseService, logger) {
    this.dbService = databaseService;
    this.logger = logger;
    
    // Configuración de las 3 estaciones
    this.stations = [
      {
        id: 'chapelco_base',
        name: 'Chapelco Base',
        ip: '10.20.50.50',
        port: 80,
        location: 'Base del Cerro Chapelco',
        altitude: 1200,
        latitude: -40.2333,
        longitude: -71.2333,
        active: true
      },
      {
        id: 'chapelco_1700',
        name: 'Chapelco 1700',
        ip: '10.20.50.51',
        port: 80,
        location: 'Altura 1700m',
        altitude: 1700,
        latitude: -40.2333,
        longitude: -71.2333,
        active: true
      },
      {
        id: 'chapelco_cerro_teta',
        name: 'Chapelco Cerro Teta',
        ip: '10.20.50.52',
        port: 80,
        location: 'Cima Cerro Teta',
        altitude: 2000,
        latitude: -40.2333,
        longitude: -71.2333,
        active: true
      }
    ];

    this.udpSockets = new Map();
    this.dataBuffer = new Map(); // Buffer circular para datos UDP
    this.lastReadings = new Map();
    this.connectionStatus = new Map();
    
    // Configurar timeouts y reintentos
    this.httpTimeout = 10000; // 10 segundos
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  async initializeStations() {
    try {
      // Crear estaciones en la base de datos
      for (const station of this.stations) {
        await this.dbService.createStation(station);
        this.connectionStatus.set(station.id, { connected: false, lastSeen: null });
        this.dataBuffer.set(station.id, []);
      }

      // Inicializar sockets UDP para cada estación
      await this.initializeUDPSockets();
      
      this.logger.info('Estaciones meteorológicas inicializadas correctamente');
    } catch (error) {
      this.logger.error('Error al inicializar estaciones:', error);
      throw error;
    }
  }

  async initializeUDPSockets() {
    for (const station of this.stations) {
      try {
        const socket = dgram.createSocket('udp4');
        
        socket.on('error', (err) => {
          this.logger.error(`Error UDP para ${station.id}:`, err);
        });

        socket.on('message', (msg, rinfo) => {
          this.handleUDPMessage(station.id, msg, rinfo);
        });

        // Escuchar en puerto 22222 para cada estación
        socket.bind(22222 + this.stations.indexOf(station));
        this.udpSockets.set(station.id, socket);
        
        this.logger.info(`Socket UDP inicializado para ${station.id} en puerto ${22222 + this.stations.indexOf(station)}`);
      } catch (error) {
        this.logger.error(`Error al inicializar socket UDP para ${station.id}:`, error);
      }
    }
  }

  async collectData() {
    const promises = this.stations.map(station => this.collectStationData(station));
    
    try {
      await Promise.allSettled(promises);
      this.logger.info('Recolección de datos HTTP completada');
    } catch (error) {
      this.logger.error('Error en recolección de datos HTTP:', error);
    }
  }

  async collectStationData(station) {
    try {
      const url = `http://${station.ip}:${station.port}/v1/current_conditions`;
      
      const response = await axios.get(url, {
        timeout: this.httpTimeout,
        headers: {
          'User-Agent': 'EMA-Chapelco-Weather-Monitor/1.0'
        }
      });

      if (response.status === 200 && response.data) {
        const rawData = response.data;
        const convertedData = this.convertWeatherData(rawData, station.id);
        
        // Validar y almacenar datos
        if (this.validateWeatherData(convertedData)) {
          await this.dbService.insertWeatherReading(convertedData);
          this.lastReadings.set(station.id, convertedData);
          this.updateConnectionStatus(station.id, true);
          
          this.logger.info(`Datos recolectados de ${station.id}: ${convertedData.temp}°C, ${convertedData.wind_speed_last} km/h`);
        }
      }
    } catch (error) {
      this.logger.error(`Error al recolectar datos de ${station.id}:`, error.message);
      this.updateConnectionStatus(station.id, false);
      
      // Reintento con backoff exponencial
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        await this.retryConnection(station);
      }
    }
  }

  async collectUDPData() {
    // Los datos UDP se procesan automáticamente en handleUDPMessage
    // Esta función se ejecuta cada 2.5 segundos para procesar el buffer
    for (const [stationId, buffer] of this.dataBuffer) {
      if (buffer.length > 0) {
        const data = buffer.shift(); // Tomar el dato más reciente
        try {
          await this.dbService.insertWeatherReading(data);
          this.lastReadings.set(stationId, data);
        } catch (error) {
          this.logger.error(`Error al almacenar datos UDP de ${stationId}:`, error);
        }
      }
    }
  }

  handleUDPMessage(stationId, message, rinfo) {
    try {
      // Parsear mensaje UDP del WeatherLink Live
      const data = this.parseUDPMessage(message);
      if (data) {
        const convertedData = this.convertWeatherData(data, stationId);
        convertedData.timestamp = Math.floor(Date.now() / 1000);
        
        // Agregar al buffer circular (máximo 10 elementos)
        const buffer = this.dataBuffer.get(stationId) || [];
        buffer.push(convertedData);
        if (buffer.length > 10) buffer.shift();
        this.dataBuffer.set(stationId, buffer);
        
        this.updateConnectionStatus(stationId, true);
      }
    } catch (error) {
      this.logger.error(`Error al procesar mensaje UDP de ${stationId}:`, error);
    }
  }

  parseUDPMessage(message) {
    try {
      // El WeatherLink Live envía datos en formato binario específico
      // Esta es una implementación básica que debe adaptarse al protocolo real
      const data = {};
      
      // Parsear datos según el protocolo UDP del WeatherLink Live
      // Los datos incluyen principalmente viento y lluvia en tiempo real
      
      return data;
    } catch (error) {
      this.logger.error('Error al parsear mensaje UDP:', error);
      return null;
    }
  }

  convertWeatherData(rawData, stationId) {
    const converted = { ...rawData };
    
    // Agregar metadatos de la estación
    const station = this.stations.find(s => s.id === stationId);
    converted.station_id = stationId;
    converted.timestamp = Math.floor(Date.now() / 1000);
    
    // Conversión de temperaturas: °F → °C
    if (converted.temp !== undefined) {
      converted.temp = UnitConverter.fahrenheitToCelsius(converted.temp);
    }
    if (converted.temp_in !== undefined) {
      converted.temp_in = UnitConverter.fahrenheitToCelsius(converted.temp_in);
    }
    if (converted.heat_index !== undefined) {
      converted.heat_index = UnitConverter.fahrenheitToCelsius(converted.heat_index);
    }
    if (converted.wind_chill !== undefined) {
      converted.wind_chill = UnitConverter.fahrenheitToCelsius(converted.wind_chill);
    }
    if (converted.dew_point !== undefined) {
      converted.dew_point = UnitConverter.fahrenheitToCelsius(converted.dew_point);
    }

    // Conversión de velocidad del viento: mph → km/h
    if (converted.wind_speed_last !== undefined) {
      converted.wind_speed_last = UnitConverter.mphToKmh(converted.wind_speed_last);
    }
    if (converted.wind_speed_avg_1min !== undefined) {
      converted.wind_speed_avg_1min = UnitConverter.mphToKmh(converted.wind_speed_avg_1min);
    }
    if (converted.wind_speed_avg_2min !== undefined) {
      converted.wind_speed_avg_2min = UnitConverter.mphToKmh(converted.wind_speed_avg_2min);
    }
    if (converted.wind_speed_avg_10min !== undefined) {
      converted.wind_speed_avg_10min = UnitConverter.mphToKmh(converted.wind_speed_avg_10min);
    }
    if (converted.wind_speed_hi_2min !== undefined) {
      converted.wind_speed_hi_2min = UnitConverter.mphToKmh(converted.wind_speed_hi_2min);
    }
    if (converted.wind_speed_hi_10min !== undefined) {
      converted.wind_speed_hi_10min = UnitConverter.mphToKmh(converted.wind_speed_hi_10min);
    }

    // Conversión de precipitación: inches → mm
    if (converted.rain_rate_last !== undefined) {
      converted.rain_rate_last = UnitConverter.inchesToMm(converted.rain_rate_last);
    }
    if (converted.rain_rate_hi !== undefined) {
      converted.rain_rate_hi = UnitConverter.inchesToMm(converted.rain_rate_hi);
    }
    if (converted.rainfall_15min !== undefined) {
      converted.rainfall_15min = UnitConverter.inchesToMm(converted.rainfall_15min);
    }
    if (converted.rainfall_60min !== undefined) {
      converted.rainfall_60min = UnitConverter.inchesToMm(converted.rainfall_60min);
    }
    if (converted.rainfall_24hr !== undefined) {
      converted.rainfall_24hr = UnitConverter.inchesToMm(converted.rainfall_24hr);
    }
    if (converted.rainfall_daily !== undefined) {
      converted.rainfall_daily = UnitConverter.inchesToMm(converted.rainfall_daily);
    }
    if (converted.rainfall_monthly !== undefined) {
      converted.rainfall_monthly = UnitConverter.inchesToMm(converted.rainfall_monthly);
    }
    if (converted.rainfall_year !== undefined) {
      converted.rainfall_year = UnitConverter.inchesToMm(converted.rainfall_year);
    }
    if (converted.rain_storm !== undefined) {
      converted.rain_storm = UnitConverter.inchesToMm(converted.rain_storm);
    }

    // Conversión de presión: inHg → hPa
    if (converted.barometer !== undefined) {
      converted.barometer = UnitConverter.inHgToHPa(converted.barometer);
    }

    return converted;
  }

  validateWeatherData(data) {
    // Validaciones básicas de datos meteorológicos
    if (!data.station_id || !data.timestamp) {
      return false;
    }

    // Validar rangos razonables para temperatura (°C)
    if (data.temp !== undefined && (data.temp < -50 || data.temp > 60)) {
      return false;
    }

    // Validar rangos para humedad (%)
    if (data.humidity !== undefined && (data.humidity < 0 || data.humidity > 100)) {
      return false;
    }

    // Validar rangos para velocidad del viento (km/h)
    if (data.wind_speed_last !== undefined && (data.wind_speed_last < 0 || data.wind_speed_last > 300)) {
      return false;
    }

    return true;
  }

  updateConnectionStatus(stationId, connected) {
    const status = this.connectionStatus.get(stationId) || {};
    status.connected = connected;
    status.lastSeen = connected ? new Date().toISOString() : status.lastSeen;
    this.connectionStatus.set(stationId, status);
  }

  async retryConnection(station) {
    // Implementar lógica de reintento con backoff exponencial
    this.logger.info(`Reintentando conexión a ${station.id} en ${this.retryDelay}ms`);
    
    setTimeout(async () => {
      try {
        await this.collectStationData(station);
      } catch (error) {
        this.logger.error(`Reintento fallido para ${station.id}:`, error.message);
      }
    }, this.retryDelay);
  }

  getStationsStatus() {
    const status = {};
    for (const station of this.stations) {
      const connectionStatus = this.connectionStatus.get(station.id) || {};
      const lastReading = this.lastReadings.get(station.id);
      
      status[station.id] = {
        name: station.name,
        ip: station.ip,
        connected: connectionStatus.connected,
        lastSeen: connectionStatus.lastSeen,
        lastReading: lastReading ? {
          timestamp: lastReading.timestamp,
          temp: lastReading.temp,
          humidity: lastReading.humidity,
          wind_speed: lastReading.wind_speed_last
        } : null
      };
    }
    return status;
  }

  getLastReadings() {
    return Object.fromEntries(this.lastReadings);
  }

  async getStationData(stationId, limit = 100) {
    return await this.dbService.getWeatherReadings(stationId, limit);
  }

  async getCurrentConditions(stationId) {
    return this.lastReadings.get(stationId) || null;
  }

  async getAllCurrentConditions() {
    const conditions = {};
    for (const station of this.stations) {
      conditions[station.id] = await this.getCurrentConditions(station.id);
    }
    return conditions;
  }

  // Limpiar recursos al cerrar
  cleanup() {
    for (const [stationId, socket] of this.udpSockets) {
      try {
        socket.close();
        this.logger.info(`Socket UDP cerrado para ${stationId}`);
      } catch (error) {
        this.logger.error(`Error al cerrar socket UDP para ${stationId}:`, error);
      }
    }
  }
}

module.exports = WeatherStationManager;
