# EMA Chapelco - Sistema de Monitoreo Meteorológico

Sistema completo de monitoreo meteorológico para estaciones Davis Vantage Pro 2 con WeatherLink Live, desarrollado para EMA Chapelco.

## 🚀 Características

- **Monitoreo en tiempo real** de múltiples estaciones meteorológicas
- **Integración con WeatherLink Live** para datos Davis Vantage Pro 2
- **Soporte UDP** para estaciones locales
- **API REST completa** con documentación
- **WebSocket** para datos en tiempo real
- **Sistema de alertas** configurable
- **Generación de reportes** automática y manual
- **Exportación de datos** en múltiples formatos
- **Base de datos SQLite** con respaldos automáticos
- **Logging avanzado** con rotación automática
- **Seguridad** con Helmet y CORS configurado

## 📋 Requisitos

- Node.js 16.x o superior
- npm 8.x o superior
- Acceso a estaciones Davis Vantage Pro 2
- Cuenta de WeatherLink Live (opcional)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd emas
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp backend/env.example backend/.env
```

Editar `backend/.env` con tus configuraciones:
- API keys de WeatherLink Live
- Configuración de estaciones UDP
- Configuración de base de datos
- Configuración de seguridad

### 4. Inicializar la base de datos
```bash
npm run setup:db
```

### 5. Iniciar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🏗️ Arquitectura

```
emas/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Servidor principal
│   │   ├── controllers/           # Controladores de API
│   │   │   ├── stationsController.js
│   │   │   ├── dataController.js
│   │   │   └── reportsController.js
│   │   ├── services/             # Servicios de negocio
│   │   │   ├── databaseService.js
│   │   │   ├── weatherLinkService.js
│   │   │   └── websocketService.js
│   │   └── utils/                # Utilidades
│   │       ├── logger.js
│   │       └── unitConverter.js
│   ├── data/                     # Base de datos SQLite
│   ├── logs/                     # Archivos de log
│   └── backups/                  # Respaldos automáticos
└── package.json
```

## 🔌 API Endpoints

### Estaciones (`/api/stations`)
- `GET /` - Listar todas las estaciones
- `GET /:id` - Obtener estación específica
- `POST /` - Crear nueva estación
- `PUT /:id` - Actualizar estación
- `DELETE /:id` - Eliminar estación
- `GET /:id/status` - Estado de la estación

### Datos (`/api/data`)
- `GET /current` - Datos actuales de todas las estaciones
- `GET /current/:stationId` - Datos actuales de una estación
- `GET /historical` - Datos históricos con filtros
- `GET /statistics` - Estadísticas de los datos
- `GET /parameters` - Parámetros disponibles
- `GET /export` - Exportar datos en CSV
- `GET /alerts` - Alertas activas
- `POST /alerts` - Crear nueva alerta

### Reportes (`/api/reports`)
- `GET /daily` - Reporte diario
- `GET /monthly` - Reporte mensual
- `GET /custom` - Reporte personalizado
- `GET /summary` - Resumen de datos
- `GET /extremes` - Valores extremos
- `GET /trends` - Análisis de tendencias
- `GET /export/:type` - Exportar reportes
- `GET /templates` - Plantillas disponibles
- `POST /schedule` - Programar reportes

### Sistema
- `GET /api/health` - Estado del sistema
- `GET /` - Información de la API
- `GET /ws/realtime` - WebSocket para datos en tiempo real

## 📊 Parámetros Meteorológicos

El sistema soporta los siguientes parámetros:
- **Temperatura** (°C, °F)
- **Humedad relativa** (%)
- **Presión barométrica** (hPa, inHg)
- **Velocidad del viento** (km/h, mph, m/s)
- **Dirección del viento** (grados)
- **Precipitación** (mm, pulgadas)
- **Radiación solar** (W/m²)
- **UV Index**
- **Punto de rocío** (°C, °F)
- **Sensación térmica** (°C, °F)

## 🔧 Configuración

### Variables de Entorno Principales

```bash
# Servidor
NODE_ENV=development
PORT=3001

# WeatherLink Live
WEATHERLINK_API_KEY=your_key
WEATHERLINK_API_SECRET=your_secret

# Base de datos
DB_PATH=./data/weather.db

# UDP
UDP_PORT=22222
UDP_HOST=0.0.0.0
```

### Configuración de Estaciones

Las estaciones se configuran a través de la API o directamente en la base de datos:

```json
{
  "name": "Estación Base",
  "type": "davis_vantage_pro2",
  "location": {
    "latitude": -40.123,
    "longitude": -71.456,
    "altitude": 1000
  },
  "weatherlink": {
    "deviceId": "12345",
    "apiKey": "your_key"
  },
  "udp": {
    "enabled": true,
    "port": 22222
  }
}
```

## 📈 Monitoreo y Logs

### Logs del Sistema
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Rotación automática** cada 5MB
- **Retención** configurable

### Métricas de Monitoreo
- Estado de estaciones
- Tiempo de respuesta de API
- Uso de memoria y CPU
- Conexiones WebSocket activas
- Errores y excepciones

## 🚨 Sistema de Alertas

### Tipos de Alertas
- **Umbrales**: Cuando un parámetro supera un valor
- **Tendencias**: Cambios significativos en el tiempo
- **Estado**: Estaciones offline o con errores
- **Calidad**: Datos anómalos o fuera de rango

### Configuración de Alertas
```json
{
  "stationId": 1,
  "parameter": "temperature",
  "threshold": 30,
  "condition": "greater_than",
  "message": "Temperatura alta detectada"
}
```

## 📊 Reportes

### Tipos de Reportes
- **Diarios**: Resumen de 24 horas
- **Mensuales**: Estadísticas del mes
- **Personalizados**: Períodos y parámetros específicos
- **Tendencias**: Análisis de cambios temporales

### Formatos de Exportación
- **CSV**: Para análisis en Excel
- **PDF**: Para presentaciones y archivo
- **JSON**: Para integración con otros sistemas

## 🔒 Seguridad

- **Helmet.js** para headers de seguridad
- **CORS** configurado para dominios específicos
- **Rate limiting** en endpoints críticos
- **Validación** de entrada en todos los endpoints
- **Sanitización** de datos de entrada

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Docker (próximamente)
```bash
docker build -t emas-weather .
docker run -p 3001:3001 emas-weather
```

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Cobertura de código
npm run test:coverage
```

## 📝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **EMA Chapelco** - *Desarrollo inicial* - [EMA Chapelco](https://ema.chapelco.local)

## 🙏 Agradecimientos

- Davis Instruments por la documentación de WeatherLink Live
- Comunidad de Node.js por las librerías utilizadas
- Equipo de desarrollo de EMA Chapelco

## 📞 Soporte

Para soporte técnico o preguntas:
- **Email**: soporte@ema.chapelco.local
- **Documentación**: [Wiki del proyecto](https://wiki.ema.chapelco.local)
- **Issues**: [GitHub Issues](https://github.com/ema-chapelco/emas/issues)

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Estado**: En desarrollo activo
