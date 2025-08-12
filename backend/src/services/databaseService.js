const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/weather.db');
    this.db = null;
    this.ensureDatabaseDirectory();
  }

  ensureDatabaseDirectory() {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Habilitar foreign keys y WAL mode para mejor rendimiento
        this.db.run('PRAGMA foreign_keys = ON');
        this.db.run('PRAGMA journal_mode = WAL');
        this.db.run('PRAGMA synchronous = NORMAL');
        this.db.run('PRAGMA cache_size = 10000');
        this.db.run('PRAGMA temp_store = MEMORY');

        // Crear tablas
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  async createTables() {
    const createStationsTable = `
      CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        location TEXT,
        altitude REAL,
        latitude REAL,
        longitude REAL,
        active BOOLEAN DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

    const createWeatherReadingsTable = `
      CREATE TABLE IF NOT EXISTS weather_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        device_id TEXT,
        
        -- Datos de temperatura (°C)
        temp REAL,
        temp_in REAL,
        heat_index REAL,
        wind_chill REAL,
        dew_point REAL,
        
        -- Datos de humedad (%RH)
        humidity REAL,
        humidity_in REAL,
        
        -- Datos de viento (km/h)
        wind_speed_last REAL,
        wind_speed_avg_1min REAL,
        wind_speed_avg_2min REAL,
        wind_speed_avg_10min REAL,
        wind_speed_hi_2min REAL,
        wind_speed_hi_10min REAL,
        
        -- Dirección del viento (grados)
        wind_dir_last REAL,
        wind_dir_avg_1min REAL,
        wind_dir_avg_2min REAL,
        wind_dir_avg_10min REAL,
        wind_dir_at_hi_speed_2min REAL,
        wind_dir_at_hi_speed_10min REAL,
        
        -- Datos de lluvia (mm)
        rain_rate_last REAL,
        rain_rate_hi REAL,
        rainfall_15min REAL,
        rainfall_60min REAL,
        rainfall_24hr REAL,
        rainfall_daily REAL,
        rainfall_monthly REAL,
        rainfall_year REAL,
        rain_storm REAL,
        rain_storm_start INTEGER,
        
        -- Datos de presión (hPa)
        barometer REAL,
        bar_trend REAL,
        
        -- Datos solares
        solar_radiation REAL,
        uv_index REAL,
        
        -- Estado del sistema
        rx_state INTEGER,
        battery_flag INTEGER,
        
        -- Índices y metadatos
        UNIQUE(station_id, timestamp),
        FOREIGN KEY (station_id) REFERENCES stations(id)
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_readings_station_time ON weather_readings(station_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON weather_readings(timestamp);
      CREATE INDEX IF NOT EXISTS idx_readings_temp ON weather_readings(temp);
      CREATE INDEX IF NOT EXISTS idx_readings_wind_speed ON weather_readings(wind_speed_last);
      CREATE INDEX IF NOT EXISTS idx_readings_rainfall ON weather_readings(rainfall_daily);
    `;

    try {
      await this.run(createStationsTable);
      await this.run(createWeatherReadingsTable);
      await this.run(createIndexes);
    } catch (error) {
      throw new Error(`Error al crear tablas: ${error.message}`);
    }
  }

  // Métodos de ejecución de SQL
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Operaciones de estaciones
  async createStation(stationData) {
    const sql = `
      INSERT OR REPLACE INTO stations 
      (id, name, ip_address, location, altitude, latitude, longitude, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      stationData.id,
      stationData.name,
      stationData.ip,
      stationData.location,
      stationData.altitude,
      stationData.latitude,
      stationData.longitude,
      stationData.active ? 1 : 0
    ];

    return await this.run(sql, params);
  }

  async getStation(stationId) {
    const sql = 'SELECT * FROM stations WHERE id = ?';
    return await this.get(sql, [stationId]);
  }

  async getAllStations() {
    const sql = 'SELECT * FROM stations WHERE active = 1 ORDER BY name';
    return await this.all(sql);
  }

  async updateStation(stationId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE stations SET ${fields} WHERE id = ?`;
    
    const params = [...Object.values(updates), stationId];
    return await this.run(sql, params);
  }

  async deleteStation(stationId) {
    const sql = 'DELETE FROM stations WHERE id = ?';
    return await this.run(sql, [stationId]);
  }

  // Operaciones de lecturas meteorológicas
  async insertWeatherReading(readingData) {
    const fields = Object.keys(readingData).join(', ');
    const placeholders = Object.keys(readingData).map(() => '?').join(', ');
    
    const sql = `
      INSERT OR REPLACE INTO weather_readings 
      (${fields}) VALUES (${placeholders})
    `;
    
    const params = Object.values(readingData);
    return await this.run(sql, params);
  }

  // Método alias para compatibilidad
  async saveWeatherData(stationData) {
    return await this.insertWeatherReading(stationData);
  }

  async getWeatherReadings(stationId, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM weather_readings 
      WHERE station_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `;
    
    return await this.all(sql, [stationId, limit, offset]);
  }

  async getWeatherReadingsByDateRange(stationId, startTimestamp, endTimestamp) {
    const sql = `
      SELECT * FROM weather_readings 
      WHERE station_id = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `;
    
    return await this.all(sql, [stationId, startTimestamp, endTimestamp]);
  }

  async getCurrentConditions(stationId) {
    const sql = `
      SELECT * FROM weather_readings 
      WHERE station_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    
    return await this.get(sql, [stationId]);
  }

  async getAllCurrentConditions() {
    const sql = `
      SELECT wr.*
      FROM weather_readings wr
      INNER JOIN (
        SELECT station_id, MAX(timestamp) as max_timestamp
        FROM weather_readings
        GROUP BY station_id
      ) latest ON wr.station_id = latest.station_id AND wr.timestamp = latest.max_timestamp
      ORDER BY wr.station_id
    `;
    
    return await this.all(sql);
  }

  // Consultas estadísticas
  async getDailyStats(stationId, date) {
    const startOfDay = Math.floor(new Date(date).getTime() / 1000);
    const endOfDay = startOfDay + 86400; // 24 horas en segundos
    
    const sql = `
      SELECT 
        station_id,
        MIN(temp) as temp_min,
        MAX(temp) as temp_max,
        AVG(temp) as temp_avg,
        MIN(humidity) as humidity_min,
        MAX(humidity) as humidity_max,
        AVG(humidity) as humidity_avg,
        MAX(wind_speed_last) as wind_speed_max,
        AVG(wind_speed_last) as wind_speed_avg,
        SUM(rainfall_daily) as rainfall_total,
        MAX(barometer) as barometer_max,
        MIN(barometer) as barometer_min
      FROM weather_readings 
      WHERE station_id = ? AND timestamp BETWEEN ? AND ?
      GROUP BY station_id
    `;
    
    return await this.get(sql, [stationId, startOfDay, endOfDay]);
  }

  async getMonthlyStats(stationId, year, month) {
    const startOfMonth = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const endOfMonth = Math.floor(new Date(year, month, 0, 23, 59, 59).getTime() / 1000);
    
    const sql = `
      SELECT 
        station_id,
        MIN(temp) as temp_min,
        MAX(temp) as temp_max,
        AVG(temp) as temp_avg,
        MIN(humidity) as humidity_min,
        MAX(humidity) as humidity_max,
        AVG(humidity) as humidity_avg,
        MAX(wind_speed_last) as wind_speed_max,
        AVG(wind_speed_last) as wind_speed_avg,
        SUM(rainfall_daily) as rainfall_total,
        MAX(barometer) as barometer_max,
        MIN(barometer) as barometer_min
      FROM weather_readings 
      WHERE station_id = ? AND timestamp BETWEEN ? AND ?
      GROUP BY station_id
    `;
    
    return await this.get(sql, [stationId, startOfMonth, endOfMonth]);
  }

  async getYearlyStats(stationId, year) {
    const startOfYear = Math.floor(new Date(year, 0, 1).getTime() / 1000);
    const endOfYear = Math.floor(new Date(year, 11, 31, 23, 59, 59).getTime() / 1000);
    
    const sql = `
      SELECT 
        station_id,
        MIN(temp) as temp_min,
        MAX(temp) as temp_max,
        AVG(temp) as temp_avg,
        MIN(humidity) as humidity_min,
        MAX(humidity) as humidity_max,
        AVG(humidity) as humidity_avg,
        MAX(wind_speed_last) as wind_speed_max,
        AVG(wind_speed_last) as wind_speed_avg,
        SUM(rainfall_daily) as rainfall_total,
        MAX(barometer) as barometer_max,
        MIN(barometer) as barometer_min
      FROM weather_readings 
      WHERE station_id = ? AND timestamp BETWEEN ? AND ?
      GROUP BY station_id
    `;
    
    return await this.get(sql, [stationId, startOfYear, endOfYear]);
  }

  // Consultas para análisis de gradientes altitudinales
  async getAltitudeGradientData(timestamp) {
    const sql = `
      SELECT 
        s.altitude,
        s.name,
        wr.temp,
        wr.humidity,
        wr.wind_speed_last,
        wr.barometer
      FROM stations s
      LEFT JOIN weather_readings wr ON s.id = wr.station_id
      WHERE wr.timestamp = ? AND s.active = 1
      ORDER BY s.altitude ASC
    `;
    
    return await this.all(sql, [timestamp]);
  }

  // Consultas para análisis de viento
  async getWindRoseData(stationId, startTimestamp, endTimestamp) {
    const sql = `
      SELECT 
        wind_dir_last,
        wind_speed_last,
        COUNT(*) as frequency
      FROM weather_readings 
      WHERE station_id = ? 
        AND timestamp BETWEEN ? AND ?
        AND wind_dir_last IS NOT NULL 
        AND wind_speed_last IS NOT NULL
      GROUP BY 
        CASE 
          WHEN wind_dir_last BETWEEN 0 AND 22.5 THEN 'N'
          WHEN wind_dir_last BETWEEN 22.5 AND 67.5 THEN 'NE'
          WHEN wind_dir_last BETWEEN 67.5 AND 112.5 THEN 'E'
          WHEN wind_dir_last BETWEEN 112.5 AND 157.5 THEN 'SE'
          WHEN wind_dir_last BETWEEN 157.5 AND 202.5 THEN 'S'
          WHEN wind_dir_last BETWEEN 202.5 AND 247.5 THEN 'SW'
          WHEN wind_dir_last BETWEEN 247.5 AND 292.5 THEN 'W'
          WHEN wind_dir_last BETWEEN 292.5 AND 337.5 THEN 'NW'
          ELSE 'N'
        END,
        CASE 
          WHEN wind_speed_last < 10 THEN '0-10'
          WHEN wind_speed_last < 20 THEN '10-20'
          WHEN wind_speed_last < 30 THEN '20-30'
          WHEN wind_speed_last < 40 THEN '30-40'
          ELSE '40+'
        END
      ORDER BY wind_dir_last, wind_speed_last
    `;
    
    return await this.all(sql, [stationId, startTimestamp, endTimestamp]);
  }

  // Consultas para alertas meteorológicas
  async getWeatherAlerts(stationId, conditions = {}) {
    let sql = `
      SELECT * FROM weather_readings 
      WHERE station_id = ?
    `;
    
    const params = [stationId];
    const conditionsList = [];

    if (conditions.highWind !== undefined) {
      conditionsList.push('wind_speed_last > ?');
      params.push(conditions.highWind);
    }

    if (conditions.lowTemp !== undefined) {
      conditionsList.push('temp < ?');
      params.push(conditions.lowTemp);
    }

    if (conditions.highTemp !== undefined) {
      conditionsList.push('temp > ?');
      params.push(conditions.highTemp);
    }

    if (conditions.highRainfall !== undefined) {
      conditionsList.push('rain_rate_last > ?');
      params.push(conditions.highRainfall);
    }

    if (conditionsList.length > 0) {
      sql += ` AND (${conditionsList.join(' OR ')})`;
    }

    sql += ' ORDER BY timestamp DESC LIMIT 100';
    
    return await this.all(sql, params);
  }

  // Consultas para reportes
  async getDailyReport(stationId, date) {
    const startOfDay = Math.floor(new Date(date).getTime() / 1000);
    const endOfDay = startOfDay + 86400;
    
    const sql = `
      SELECT 
        station_id,
        strftime('%H:00', datetime(timestamp, 'unixepoch')) as hour,
        AVG(temp) as temp_avg,
        AVG(humidity) as humidity_avg,
        AVG(wind_speed_last) as wind_speed_avg,
        MAX(wind_speed_last) as wind_speed_max,
        SUM(rainfall_60min) as rainfall_hourly
      FROM weather_readings 
      WHERE station_id = ? AND timestamp BETWEEN ? AND ?
      GROUP BY strftime('%H', datetime(timestamp, 'unixepoch'))
      ORDER BY hour
    `;
    
    return await this.all(sql, [stationId, startOfDay, endOfDay]);
  }

  // Limpieza de datos antiguos (mantener solo 2 años)
  async cleanupOldData() {
    const twoYearsAgo = Math.floor(Date.now() / 1000) - (2 * 365 * 24 * 60 * 60);
    
    const sql = 'DELETE FROM weather_readings WHERE timestamp < ?';
    const result = await this.run(sql, [twoYearsAgo]);
    
    // Optimizar base de datos después de limpieza
    await this.run('VACUUM');
    await this.run('ANALYZE');
    
    return result;
  }

  // Obtener información de la base de datos
  async getDatabaseInfo() {
    const tables = await this.all("SELECT name FROM sqlite_master WHERE type='table'");
    const info = {};
    
    for (const table of tables) {
      const count = await this.get(`SELECT COUNT(*) as count FROM ${table.name}`);
      info[table.name] = count.count;
    }
    
    return info;
  }

  // Verificar alertas meteorológicas (método placeholder)
  async checkAlerts(stationData) {
    // Por ahora retornamos un placeholder
    // TODO: Implementar lógica de alertas
    return {
      station_id: stationData.station_id || 'unknown',
      alerts: [],
      checked_at: new Date().toISOString()
    };
  }

  // Crear respaldo de base de datos (método placeholder)
  async createBackup() {
    // Por ahora retornamos un placeholder
    // TODO: Implementar lógica de respaldo
    return {
      status: 'backup_placeholder',
      message: 'Método de respaldo pendiente de implementación',
      timestamp: new Date().toISOString()
    };
  }

  // Métodos alias para compatibilidad con el controlador
  async getCurrentData() {
    return this.getAllCurrentConditions();
  }

  async getCurrentDataByStation(stationId) {
    return this.getCurrentConditions(stationId);
  }

  async getHistoricalData(filters) {
    const { stationId, startDate, endDate, limit = 1000, offset = 0 } = filters;
    
    if (stationId && startDate && endDate) {
      // Convertir fechas a timestamps
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      return this.getWeatherReadingsByDateRange(stationId, startTimestamp, endTimestamp);
    } else if (stationId) {
      return this.getWeatherReadings(stationId, limit, offset);
    } else {
      // Obtener datos de todas las estaciones (simplificado)
      const stations = await this.getAllStations();
      const allData = [];
      for (const station of stations) {
        const data = await this.getWeatherReadings(station.id, limit, offset);
        allData.push(...data);
      }
      return allData;
    }
  }

  async getDataStatistics(filters) {
    const { stationId, startDate, endDate, groupBy } = filters;
    
    if (groupBy === 'day' && startDate) {
      const dateStr = startDate.toISOString().split('T')[0];
      return this.getDailyStats(stationId, dateStr);
    } else if (groupBy === 'month' && startDate) {
      return this.getMonthlyStats(stationId, startDate.getFullYear(), startDate.getMonth() + 1);
    } else if (groupBy === 'year' && startDate) {
      return this.getYearlyStats(stationId, startDate.getFullYear());
    }
    
    // Fallback a datos actuales
    return this.getCurrentConditions(stationId);
  }

  async getAvailableParameters() {
    return [
      'temperature',
      'humidity', 
      'pressure',
      'wind_speed',
      'wind_direction',
      'rainfall',
      'solar_radiation',
      'uv_index'
    ];
  }

  async exportDataToCSV(filters) {
    const data = await this.getHistoricalData(filters);
    if (!data || data.length === 0) {
      return 'No data available\n';
    }

    // Crear header CSV
    const headers = Object.keys(data[0]).join(',');
    
    // Crear filas CSV
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  async getActiveAlerts() {
    // Implementación básica - retornar array vacío por ahora
    return [];
  }

  async createAlert(alertData) {
    // Implementación básica - retornar el objeto con ID
    return {
      id: Date.now().toString(),
      ...alertData,
      created_at: new Date().toISOString(),
      active: true
    };
  }

  // Cerrar conexión
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseService;
