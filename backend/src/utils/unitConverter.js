/**
 * Convertidor de unidades del sistema imperial al métrico
 * Para datos meteorológicos de estaciones Davis Vantage Pro 2
 */

class UnitConverter {
  /**
   * Convertir temperatura de Fahrenheit a Celsius
   * @param {number} fahrenheit - Temperatura en °F
   * @returns {number} Temperatura en °C
   */
  static fahrenheitToCelsius(fahrenheit) {
    if (fahrenheit === null || fahrenheit === undefined || isNaN(fahrenheit)) {
      return null;
    }
    return Number(((fahrenheit - 32) * 5/9).toFixed(1));
  }

  /**
   * Convertir velocidad de millas por hora a kilómetros por hora
   * @param {number} mph - Velocidad en mph
   * @returns {number} Velocidad en km/h
   */
  static mphToKmh(mph) {
    if (mph === null || mph === undefined || isNaN(mph)) {
      return null;
    }
    return Number((mph * 1.60934).toFixed(1));
  }

  /**
   * Convertir precipitación de pulgadas a milímetros
   * @param {number} inches - Precipitación en pulgadas
   * @returns {number} Precipitación en milímetros
   */
  static inchesToMm(inches) {
    if (inches === null || inches === undefined || isNaN(inches)) {
      return null;
    }
    return Number((inches * 25.4).toFixed(2));
  }

  /**
   * Convertir presión de pulgadas de mercurio a hectopascales
   * @param {number} inHg - Presión en inHg
   * @returns {number} Presión en hPa
   */
  static inHgToHPa(inHg) {
    if (inHg === null || inHg === undefined || isNaN(inHg)) {
      return null;
    }
    return Number((inHg * 33.8639).toFixed(1));
  }

  /**
   * Convertir radiación solar de W/m² a W/m² (sin cambio, pero para consistencia)
   * @param {number} wm2 - Radiación solar en W/m²
   * @returns {number} Radiación solar en W/m²
   */
  static solarRadiation(wm2) {
    if (wm2 === null || wm2 === undefined || isNaN(wm2)) {
      return null;
    }
    return Number(wm2.toFixed(1));
  }

  /**
   * Convertir índice UV (sin cambio, pero para consistencia)
   * @param {number} uv - Índice UV
   * @returns {number} Índice UV
   */
  static uvIndex(uv) {
    if (uv === null || uv === undefined || isNaN(uv)) {
      return null;
    }
    return Number(uv.toFixed(1));
  }

  /**
   * Convertir dirección del viento de grados (sin cambio, pero para consistencia)
   * @param {number} degrees - Dirección en grados
   * @returns {number} Dirección en grados
   */
  static windDirection(degrees) {
    if (degrees === null || degrees === undefined || isNaN(degrees)) {
      return null;
    }
    // Normalizar a rango 0-360
    let normalized = degrees % 360;
    if (normalized < 0) normalized += 360;
    return Number(normalized.toFixed(0));
  }

  /**
   * Convertir humedad relativa (sin cambio, pero para consistencia)
   * @param {number} humidity - Humedad en %
   * @returns {number} Humedad en %
   */
  static humidity(humidity) {
    if (humidity === null || humidity === undefined || isNaN(humidity)) {
      return null;
    }
    // Asegurar que esté en rango 0-100
    return Number(Math.max(0, Math.min(100, humidity)).toFixed(1));
  }

  /**
   * Convertir timestamp de Unix a formato legible
   * @param {number} timestamp - Timestamp Unix
   * @returns {string} Fecha y hora en formato ISO
   */
  static timestampToISO(timestamp) {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Convertir timestamp de ISO a Unix
   * @param {string} isoString - Fecha en formato ISO
   * @returns {number} Timestamp Unix
   */
  static isoToTimestamp(isoString) {
    if (!isoString) return null;
    return Math.floor(new Date(isoString).getTime() / 1000);
  }

  /**
   * Convertir múltiples campos de un objeto de datos meteorológicos
   * @param {Object} rawData - Datos sin convertir
   * @returns {Object} Datos convertidos al sistema métrico
   */
  static convertWeatherData(rawData) {
    if (!rawData || typeof rawData !== 'object') {
      return rawData;
    }

    const converted = { ...rawData };

    // Conversiones de temperatura
    if (converted.temp !== undefined) {
      converted.temp = this.fahrenheitToCelsius(converted.temp);
    }
    if (converted.temp_in !== undefined) {
      converted.temp_in = this.fahrenheitToCelsius(converted.temp_in);
    }
    if (converted.heat_index !== undefined) {
      converted.heat_index = this.fahrenheitToCelsius(converted.heat_index);
    }
    if (converted.wind_chill !== undefined) {
      converted.wind_chill = this.fahrenheitToCelsius(converted.wind_chill);
    }
    if (converted.dew_point !== undefined) {
      converted.dew_point = this.fahrenheitToCelsius(converted.dew_point);
    }

    // Conversiones de velocidad del viento
    if (converted.wind_speed_last !== undefined) {
      converted.wind_speed_last = this.mphToKmh(converted.wind_speed_last);
    }
    if (converted.wind_speed_avg_1min !== undefined) {
      converted.wind_speed_avg_1min = this.mphToKmh(converted.wind_speed_avg_1min);
    }
    if (converted.wind_speed_avg_2min !== undefined) {
      converted.wind_speed_avg_2min = this.mphToKmh(converted.wind_speed_avg_2min);
    }
    if (converted.wind_speed_avg_10min !== undefined) {
      converted.wind_speed_avg_10min = this.mphToKmh(converted.wind_speed_avg_10min);
    }
    if (converted.wind_speed_hi_2min !== undefined) {
      converted.wind_speed_hi_2min = this.mphToKmh(converted.wind_speed_hi_2min);
    }
    if (converted.wind_speed_hi_10min !== undefined) {
      converted.wind_speed_hi_10min = this.mphToKmh(converted.wind_speed_hi_10min);
    }

    // Conversiones de precipitación
    if (converted.rain_rate_last !== undefined) {
      converted.rain_rate_last = this.inchesToMm(converted.rain_rate_last);
    }
    if (converted.rain_rate_hi !== undefined) {
      converted.rain_rate_hi = this.inchesToMm(converted.rain_rate_hi);
    }
    if (converted.rainfall_15min !== undefined) {
      converted.rainfall_15min = this.inchesToMm(converted.rainfall_15min);
    }
    if (converted.rainfall_60min !== undefined) {
      converted.rainfall_60min = this.inchesToMm(converted.rainfall_60min);
    }
    if (converted.rainfall_24hr !== undefined) {
      converted.rainfall_24hr = this.inchesToMm(converted.rainfall_24hr);
    }
    if (converted.rainfall_daily !== undefined) {
      converted.rainfall_daily = this.inchesToMm(converted.rainfall_daily);
    }
    if (converted.rainfall_monthly !== undefined) {
      converted.rainfall_monthly = this.inchesToMm(converted.rainfall_monthly);
    }
    if (converted.rainfall_year !== undefined) {
      converted.rainfall_year = this.inchesToMm(converted.rainfall_year);
    }
    if (converted.rain_storm !== undefined) {
      converted.rain_storm = this.inchesToMm(converted.rain_storm);
    }

    // Conversiones de presión
    if (converted.barometer !== undefined) {
      converted.barometer = this.inHgToHPa(converted.barometer);
    }

    // Conversiones de dirección del viento
    if (converted.wind_dir_last !== undefined) {
      converted.wind_dir_last = this.windDirection(converted.wind_dir_last);
    }
    if (converted.wind_dir_avg_1min !== undefined) {
      converted.wind_dir_avg_1min = this.windDirection(converted.wind_dir_avg_1min);
    }
    if (converted.wind_dir_avg_2min !== undefined) {
      converted.wind_dir_avg_2min = this.windDirection(converted.wind_dir_avg_2min);
    }
    if (converted.wind_dir_avg_10min !== undefined) {
      converted.wind_dir_avg_10min = this.windDirection(converted.wind_dir_avg_10min);
    }
    if (converted.wind_dir_at_hi_speed_2min !== undefined) {
      converted.wind_dir_at_hi_speed_2min = this.windDirection(converted.wind_dir_at_hi_speed_2min);
    }
    if (converted.wind_dir_at_hi_speed_10min !== undefined) {
      converted.wind_dir_at_hi_speed_10min = this.windDirection(converted.wind_dir_at_hi_speed_10min);
    }

    // Conversiones de radiación solar y UV
    if (converted.solar_radiation !== undefined) {
      converted.solar_radiation = this.solarRadiation(converted.solar_radiation);
    }
    if (converted.uv_index !== undefined) {
      converted.uv_index = this.uvIndex(converted.uv_index);
    }

    // Conversiones de humedad
    if (converted.humidity !== undefined) {
      converted.humidity = this.humidity(converted.humidity);
    }
    if (converted.humidity_in !== undefined) {
      converted.humidity_in = this.humidity(converted.humidity_in);
    }

    return converted;
  }

  /**
   * Obtener información sobre las unidades convertidas
   * @returns {Object} Mapeo de campos y sus unidades
   */
  static getUnitInfo() {
    return {
      // Temperaturas
      temp: '°C',
      temp_in: '°C',
      heat_index: '°C',
      wind_chill: '°C',
      dew_point: '°C',
      
      // Velocidades del viento
      wind_speed_last: 'km/h',
      wind_speed_avg_1min: 'km/h',
      wind_speed_avg_2min: 'km/h',
      wind_speed_avg_10min: 'km/h',
      wind_speed_hi_2min: 'km/h',
      wind_speed_hi_10min: 'km/h',
      
      // Direcciones del viento
      wind_dir_last: '°',
      wind_dir_avg_1min: '°',
      wind_dir_avg_2min: '°',
      wind_dir_avg_10min: '°',
      wind_dir_at_hi_speed_2min: '°',
      wind_dir_at_hi_speed_10min: '°',
      
      // Precipitación
      rain_rate_last: 'mm/h',
      rain_rate_hi: 'mm/h',
      rainfall_15min: 'mm',
      rainfall_60min: 'mm',
      rainfall_24hr: 'mm',
      rainfall_daily: 'mm',
      rainfall_monthly: 'mm',
      rainfall_year: 'mm',
      rain_storm: 'mm',
      
      // Presión
      barometer: 'hPa',
      bar_trend: 'hPa',
      
      // Radiación y UV
      solar_radiation: 'W/m²',
      uv_index: 'UV Index',
      
      // Humedad
      humidity: '%',
      humidity_in: '%'
    };
  }

  /**
   * Validar si un valor está en el rango esperado para su tipo
   * @param {string} field - Nombre del campo
   * @param {number} value - Valor a validar
   * @returns {boolean} True si el valor es válido
   */
  static validateFieldValue(field, value) {
    if (value === null || value === undefined || isNaN(value)) {
      return false;
    }

    const validators = {
      // Temperaturas en °C
      temp: (v) => v >= -50 && v <= 60,
      temp_in: (v) => v >= -50 && v <= 60,
      heat_index: (v) => v >= -50 && v <= 80,
      wind_chill: (v) => v >= -80 && v <= 20,
      dew_point: (v) => v >= -80 && v <= 40,
      
      // Velocidades del viento en km/h
      wind_speed_last: (v) => v >= 0 && v <= 300,
      wind_speed_avg_1min: (v) => v >= 0 && v <= 300,
      wind_speed_avg_2min: (v) => v >= 0 && v <= 300,
      wind_speed_avg_10min: (v) => v >= 0 && v <= 300,
      wind_speed_hi_2min: (v) => v >= 0 && v <= 300,
      wind_speed_hi_10min: (v) => v >= 0 && v <= 300,
      
      // Direcciones del viento en grados
      wind_dir_last: (v) => v >= 0 && v <= 360,
      wind_dir_avg_1min: (v) => v >= 0 && v <= 360,
      wind_dir_avg_2min: (v) => v >= 0 && v <= 360,
      wind_dir_avg_10min: (v) => v >= 0 && v <= 360,
      wind_dir_at_hi_speed_2min: (v) => v >= 0 && v <= 360,
      wind_dir_at_hi_speed_10min: (v) => v >= 0 && v <= 360,
      
      // Precipitación en mm
      rain_rate_last: (v) => v >= 0 && v <= 1000,
      rain_rate_hi: (v) => v >= 0 && v <= 1000,
      rainfall_15min: (v) => v >= 0 && v <= 1000,
      rainfall_60min: (v) => v >= 0 && v <= 1000,
      rainfall_24hr: (v) => v >= 0 && v <= 1000,
      rainfall_daily: (v) => v >= 0 && v <= 1000,
      rainfall_monthly: (v) => v >= 0 && v <= 10000,
      rainfall_year: (v) => v >= 0 && v <= 100000,
      rain_storm: (v) => v >= 0 && v <= 1000,
      
      // Presión en hPa
      barometer: (v) => v >= 800 && v <= 1200,
      bar_trend: (v) => v >= -50 && v <= 50,
      
      // Radiación solar en W/m²
      solar_radiation: (v) => v >= 0 && v <= 1500,
      
      // Índice UV
      uv_index: (v) => v >= 0 && v <= 20,
      
      // Humedad en %
      humidity: (v) => v >= 0 && v <= 100,
      humidity_in: (v) => v >= 0 && v <= 100
    };

    const validator = validators[field];
    return validator ? validator(value) : true;
  }
}

module.exports = { UnitConverter };
