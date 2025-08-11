import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { weatherApi } from '../services/api';
import { SystemSettings } from '../types/weather';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSettings>({
    updateInterval: 30,
    alertThresholds: {
      temperature: { min: -10, max: 45 },
      humidity: { min: 20, max: 90 },
      pressure: { min: 900, max: 1100 },
      wind: { max: 50 },
      rain: { max: 100 },
    },
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    units: {
      temperature: 'C',
      wind: 'km/h',
      pressure: 'hPa',
      rain: 'mm',
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // const systemHealth = await weatherApi.getSystemHealth();
      // Aquí normalmente cargarías la configuración desde el backend
      // Por ahora usamos la configuración por defecto
    } catch (err) {
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Aquí normalmente guardarías la configuración en el backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      setSuccess('Configuración guardada exitosamente');
    } catch (err) {
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      updateInterval: 30,
      alertThresholds: {
        temperature: { min: -10, max: 45 },
        humidity: { min: 20, max: 90 },
        pressure: { min: 900, max: 1100 },
        wind: { max: 50 },
        rain: { max: 100 },
      },
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
      units: {
        temperature: 'C',
        wind: 'km/h',
        pressure: 'hPa',
        rain: 'mm',
      },
    });
    setSuccess('Configuración restablecida a valores por defecto');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-weather-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-weather-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-weather-gray-600 hover:text-weather-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-weather-gray-900">
                  Configuración del Sistema
                </h1>
                <p className="text-weather-gray-600">
                  Personaliza el comportamiento del sistema meteorológico
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuración General */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Configuración General
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Intervalo de Actualización (segundos)
              </label>
              <input
                type="number"
                value={settings.updateInterval}
                onChange={(e) => setSettings({...settings, updateInterval: parseInt(e.target.value)})}
                min="10"
                max="300"
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Umbrales de Alerta */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Umbrales de Alerta
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Temperatura */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-weather-gray-700">
                Temperatura (°C)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={settings.alertThresholds.temperature.min}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertThresholds: {
                      ...settings.alertThresholds,
                      temperature: {
                        ...settings.alertThresholds.temperature,
                        min: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="Mín"
                  className="flex-1 px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={settings.alertThresholds.temperature.max}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertThresholds: {
                      ...settings.alertThresholds,
                      temperature: {
                        ...settings.alertThresholds.temperature,
                        max: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="Máx"
                  className="flex-1 px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Humedad */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-weather-gray-700">
                Humedad (%)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={settings.alertThresholds.humidity.min}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertThresholds: {
                      ...settings.alertThresholds,
                      humidity: {
                        ...settings.alertThresholds.humidity,
                        min: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="Mín"
                  className="flex-1 px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={settings.alertThresholds.humidity.max}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertThresholds: {
                      ...settings.alertThresholds,
                      humidity: {
                        ...settings.alertThresholds.humidity,
                        max: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="Máx"
                  className="flex-1 px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Presión */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-weather-gray-700">
                Presión (hPa)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={settings.alertThresholds.pressure.min}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertThresholds: {
                      ...settings.alertThresholds,
                      pressure: {
                        ...settings.alertThresholds.pressure,
                        min: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="Mín"
                  className="flex-1 px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={settings.alertThresholds.pressure.max}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertThresholds: {
                      ...settings.alertThresholds,
                      pressure: {
                        ...settings.alertThresholds.pressure,
                        max: parseInt(e.target.value)
                      }
                    }
                  })}
                  placeholder="Máx"
                  className="flex-1 px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Viento */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-weather-gray-700">
                Viento Máximo (km/h)
              </label>
              <input
                type="number"
                value={settings.alertThresholds.wind.max}
                onChange={(e) => setSettings({
                  ...settings,
                  alertThresholds: {
                    ...settings.alertThresholds,
                    wind: { max: parseInt(e.target.value) }
                  }
                })}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              />
            </div>

            {/* Lluvia */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-weather-gray-700">
                Lluvia Máxima (mm/h)
              </label>
              <input
                type="number"
                value={settings.alertThresholds.rain.max}
                onChange={(e) => setSettings({
                  ...settings,
                  alertThresholds: {
                    ...settings.alertThresholds,
                    rain: { max: parseInt(e.target.value) }
                  }
                })}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Notificaciones
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: e.target.checked }
                })}
                className="h-4 w-4 text-weather-blue-600 focus:ring-weather-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="email-notifications" className="ml-2 block text-sm text-weather-gray-900">
                Notificaciones por Email
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="push-notifications"
                checked={settings.notifications.push}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, push: e.target.checked }
                })}
                className="h-4 w-4 text-weather-blue-600 focus:ring-weather-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="push-notifications" className="ml-2 block text-sm text-weather-gray-900">
                Notificaciones Push
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sms-notifications"
                checked={settings.notifications.sms}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, sms: e.target.checked }
                })}
                className="h-4 w-4 text-weather-blue-600 focus:ring-weather-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sms-notifications" className="ml-2 block text-sm text-weather-gray-900">
                Notificaciones SMS
              </label>
            </div>
          </div>
        </div>

        {/* Unidades */}
        <div className="bg-white rounded-lg shadow-sm border border-weather-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-weather-gray-900 mb-4">
            Unidades de Medida
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Temperatura
              </label>
              <select
                value={settings.units.temperature}
                onChange={(e) => setSettings({
                  ...settings,
                  units: { ...settings.units, temperature: e.target.value as 'C' | 'F' }
                })}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Viento
              </label>
              <select
                value={settings.units.wind}
                onChange={(e) => setSettings({
                  ...settings,
                  units: { ...settings.units, wind: e.target.value as 'km/h' | 'mph' }
                })}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value="km/h">Kilómetros por hora (km/h)</option>
                <option value="mph">Millas por hora (mph)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Presión
              </label>
              <select
                value={settings.units.pressure}
                onChange={(e) => setSettings({
                  ...settings,
                  units: { ...settings.units, pressure: e.target.value as 'hPa' | 'inHg' }
                })}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value="hPa">Hectopascales (hPa)</option>
                <option value="inHg">Pulgadas de Mercurio (inHg)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-weather-gray-700 mb-2">
                Lluvia
              </label>
              <select
                value={settings.units.rain}
                onChange={(e) => setSettings({
                  ...settings,
                  units: { ...settings.units, rain: e.target.value as 'mm' | 'in' }
                })}
                className="w-full px-3 py-2 border border-weather-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-weather-blue-500 focus:border-transparent"
              >
                <option value="mm">Milímetros (mm)</option>
                <option value="in">Pulgadas (in)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="bg-weather-gray-600 hover:bg-weather-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Restablecer
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/')}
              className="bg-weather-gray-100 hover:bg-weather-gray-200 text-weather-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-weather-blue-600 hover:bg-weather-blue-700 disabled:bg-weather-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
