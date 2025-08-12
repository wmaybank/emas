import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { weatherApi } from '../services/api';
import { WeatherStation } from '../types/weather';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newLatitude, setNewLatitude] = useState('');
  const [newLongitude, setNewLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadStations();
    }
  }, [isOpen]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const stationsData = await weatherApi.getStations();
      setStations(stationsData);
    } catch (error) {
      console.error('Error loading stations:', error);
      setMessage({ type: 'error', text: 'Error al cargar las estaciones' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (station: WeatherStation) => {
    setEditingStation(station.id);
    setNewName(station.name);
    setNewLatitude(station.coordinates?.latitude?.toString() || '');
    setNewLongitude(station.coordinates?.longitude?.toString() || '');
    setMessage(null);
  };

  const handleEditSave = async (stationId: string) => {
    if (!newName.trim()) {
      setMessage({ type: 'error', text: 'El nombre no puede estar vacío' });
      return;
    }

    // Validar coordenadas si se proporcionan
    const lat = newLatitude ? parseFloat(newLatitude) : undefined;
    const lon = newLongitude ? parseFloat(newLongitude) : undefined;
    
    if (newLatitude && (isNaN(lat!) || lat! < -90 || lat! > 90)) {
      setMessage({ type: 'error', text: 'Latitud debe estar entre -90 y 90' });
      return;
    }
    
    if (newLongitude && (isNaN(lon!) || lon! < -180 || lon! > 180)) {
      setMessage({ type: 'error', text: 'Longitud debe estar entre -180 y 180' });
      return;
    }

    try {
      setLoading(true);
      
      // Preparar datos para el backend
      const updates: any = {
        name: newName.trim(),
      };
      
      if (lat !== undefined) updates.latitude = lat;
      if (lon !== undefined) updates.longitude = lon;
      
      // Actualizar en el backend
      await weatherApi.updateStation(stationId, updates);
      
      // Recargar las estaciones para mostrar los cambios
      await loadStations();
      
      setEditingStation(null);
      setMessage({ type: 'success', text: 'Estación actualizada correctamente' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating station:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la estación' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingStation(null);
    setNewName('');
    setNewLatitude('');
    setNewLongitude('');
    setMessage(null);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Panel de Administración</h2>
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
            >
              Cerrar Sesión
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Estaciones</h3>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {message.text}
              </div>
            )}

            {loading && (
              <div className="mb-4 p-3 bg-blue-100 text-blue-700 border border-blue-300 rounded">
                Cargando...
              </div>
            )}

            <div className="space-y-4">
              {stations.map((station, index) => (
                <div key={station.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">ID: {station.id}</div>
                      
                      {editingStation === station.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre de la estación
                            </label>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ingrese el nombre de la estación"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Latitud
                              </label>
                              <input
                                type="number"
                                step="0.0001"
                                value={newLatitude}
                                onChange={(e) => setNewLatitude(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="-40.7589"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Longitud
                              </label>
                              <input
                                type="number"
                                step="0.0001"
                                value={newLongitude}
                                onChange={(e) => setNewLongitude(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="-71.3021"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSave(station.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              ✓ Guardar
                            </button>
                            <button
                              onClick={handleEditCancel}
                              disabled={loading}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-gray-900 mb-1">{station.name}</div>
                          <div className="text-sm text-gray-500 mb-1">{station.location}</div>
                          {station.coordinates?.latitude && station.coordinates?.longitude && (
                            <div className="text-sm text-gray-500">
                              📍 {station.coordinates.latitude.toFixed(4)}, {station.coordinates.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {editingStation !== station.id && (
                      <button
                        onClick={() => handleEditStart(station)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuración del Sistema */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración del Sistema</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Zona Horaria</h4>
                <p className="text-sm text-blue-700">Buenos Aires (UTC-3)</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-1">Hora Local</h4>
                <p className="text-sm text-green-700">
                  {new Date().toLocaleString('es-AR', { 
                    timeZone: 'America/Argentina/Buenos_Aires',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Problemas Detectados */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Problemas Detectados</h3>
            
            <div className="space-y-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-800">Valores de lluvia excesivos detectados (5359.4mm)</span>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-800">Gráficos superpuestos en el dashboard</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
