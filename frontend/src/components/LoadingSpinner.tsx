import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-weather-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-weather-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-weather-gray-900 mb-2">
          Cargando datos meteorológicos
        </h2>
        <p className="text-weather-gray-600">
          Conectando con las estaciones...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
