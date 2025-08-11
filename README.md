# EMAS Weather Monitoring System

Sistema de monitoreo meteorológico para estaciones locales **WeatherLink Live** de Davis Instruments.

## 🌟 Características Principales

- **Monitoreo en Tiempo Real**: Datos meteorológicos actualizados cada 30 segundos
- **Múltiples Estaciones**: Soporte para hasta 10 estaciones WeatherLink Live locales
- **API REST Completa**: Endpoints para estaciones, datos y reportes
- **WebSocket en Tiempo Real**: Transmisión instantánea de datos
- **Sistema de Alertas**: Notificaciones automáticas basadas en umbrales
- **Reportes Automáticos**: Generación de reportes diarios, mensuales y personalizados
- **Base de Datos SQLite**: Almacenamiento local eficiente
- **Logging Centralizado**: Sistema robusto de logs con rotación automática
- **Configuración Flexible**: Variables de entorno para personalización

## 🏗️ Arquitectura del Sistema

### Estaciones Locales
Cada estación meteorológica tiene su propio controlador **WeatherLink Live (WLL)** que:
- Expone una API HTTP local en `http://<IP_WLL:puerto>/v1/current_conditions`
- Transmite datos en tiempo real por UDP puerto 22222
- Funciona solo en la red local (no requiere internet)
- Soporta requests HTTP cada 10 segundos

### Servidor Central
- **Polling HTTP**: Consulta periódica a cada estación local
- **Listener UDP**: Escucha transmisiones en tiempo real
- **Procesamiento**: Normaliza y valida datos de múltiples sensores
- **Almacenamiento**: Guarda datos en base de datos SQLite
- **Distribución**: Envía datos por WebSocket a clientes conectados

## 📋 Requisitos del Sistema

### Hardware
- **Servidor**: Cualquier máquina con Node.js (Raspberry Pi, PC, servidor)
- **Red**: Acceso a la red local donde están las estaciones
- **Almacenamiento**: Mínimo 1GB para datos y logs

### Software
- **Node.js**: Versión 16 o superior
- **npm**: Gestor de paquetes de Node.js
- **Sistema Operativo**: Windows, macOS, Linux

### Estaciones Meteorológicas
- **WeatherLink Live** de Davis Instruments
- **Configuradas en la misma red local**
- **IPs estáticas o DHCP reservado**

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/wmaybank/emas.git
cd emas
```

### 2. Instalar Dependencias
```bash
npm run install:all
```

### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp backend/env.example backend/.env

# Editar configuración
nano backend/.env
```

#### Configuración de Estaciones
```bash
# Lista de IPs de estaciones en la red local
WEATHER_STATIONS=10.20.50.50:80,10.20.50.51:80,10.20.50.52:80

# Intervalo de polling HTTP (segundos)
STATION_POLLING_INTERVAL=30

# Timeout para requests HTTP (ms)
STATION_REQUEST_TIMEOUT=5000
```

### 4. Inicializar Base de Datos
```bash
npm run setup:db
```

### 5. Iniciar el Sistema
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

## ⚙️ Configuración

### Variables de Entorno Principales

#### Servidor
```bash
NODE_ENV=development
PORT=3001
HOST=localhost
```

#### Estaciones Locales
```bash
# Lista de IPs separadas por comas
WEATHER_STATIONS=10.20.50.50:80,10.20.50.51:80,10.20.50.52:80

# Configuración de polling
STATION_POLLING_INTERVAL=30
STATION_REQUEST_TIMEOUT=5000
```

#### UDP y WebSocket
```bash
UDP_PORT=22222
UDP_ENABLED=true
WS_PATH=/ws/realtime
```

#### Base de Datos
```bash
DB_PATH=./data/weather.db
DB_BACKUP_PATH=./backups/
```

## 🔌 API Endpoints

### Estaciones (`/api/stations`)
- `GET /` - Listar todas las estaciones
- `GET /:id` - Obtener estación específica
- `GET /:id/status` - Estado de conectividad
- `POST /` - Agregar nueva estación
- `PUT /:id` - Actualizar estación
- `DELETE /:id` - Eliminar estación

### Datos (`/api/data`)
- `GET /current` - Datos actuales de todas las estaciones
- `GET /current/:stationId` - Datos actuales de estación específica
- `GET /historical` - Datos históricos con filtros
- `GET /statistics` - Estadísticas de datos
- `GET /parameters` - Parámetros disponibles
- `GET /export` - Exportar datos a CSV
- `GET /alerts` - Alertas activas
- `POST /alerts` - Crear nueva alerta

### Reportes (`/api/reports`)
- `GET /daily` - Reporte diario
- `GET /monthly` - Reporte mensual
- `GET /custom` - Reporte personalizado
- `GET /summary` - Resumen de datos
- `GET /extremes` - Valores extremos
- `GET /trends` - Análisis de tendencias
- `GET /export/:type` - Exportar reporte (PDF/CSV)
- `GET /templates` - Plantillas disponibles
- `POST /schedule` - Programar reporte

### Sistema (`/api/health`)
- `GET /` - Estado de salud del sistema

## 📊 Parámetros Meteorológicos

### Sensores ISS (Integrated Sensor Suite)
- **Temperatura**: Actual, punto de rocío, índice de calor, sensación térmica
- **Humedad**: Humedad relativa actual
- **Viento**: Velocidad y dirección (última, 1 min, 2 min, 10 min)
- **Lluvia**: Tasa, acumulación (15 min, 1 hora, 24 horas, tormenta)
- **Radiación Solar**: W/m² y índice UV
- **Sistema**: Estado de batería, estado de recepción

### Sensores de Suelo/Hojas
- **Temperatura del Suelo**: 4 slots de sensores
- **Humedad del Suelo**: 4 slots de sensores
- **Humedad de Hojas**: 2 slots de sensores

### Sensores LSS (Leaf/Soil Station)
- **Barómetro**: Presión barométrica, tendencia, altímetro
- **Temperatura/Humedad**: Múltiples sensores con máximos y mínimos

## 🔧 Monitoreo y Logs

### Estructura de Logs
```
logs/
├── error.log      # Solo errores
├── combined.log   # Todos los logs
└── backups/       # Logs rotados
```

### Niveles de Log
- **error**: Errores del sistema
- **warn**: Advertencias
- **info**: Información general
- **debug**: Información detallada

### Rotación Automática
- **Tamaño máximo**: 5MB por archivo
- **Archivos máximos**: 5 archivos por tipo
- **Limpieza**: Logs antiguos se eliminan automáticamente

## 🚨 Sistema de Alertas

### Tipos de Alertas
- **Temperatura**: Mínima/máxima
- **Humedad**: Mínima/máxima
- **Viento**: Velocidad máxima
- **Lluvia**: Acumulación máxima
- **Presión**: Mínima/máxima

### Configuración
```bash
# Verificar alertas cada 60 segundos
ALERT_CHECK_INTERVAL=60

# Retener alertas por 30 días
ALERT_RETENTION_DAYS=30
```

## 📈 Tipos de Reportes

### Reportes Automáticos
- **Diario**: Resumen de 24 horas
- **Mensual**: Estadísticas del mes
- **Personalizado**: Rango de fechas específico

### Contenido de Reportes
- **Resumen**: Valores promedio, máximos y mínimos
- **Gráficos**: Tendencias temporales
- **Extremos**: Valores máximos y mínimos
- **Análisis**: Tendencias y patrones

### Formatos de Exportación
- **CSV**: Datos tabulares
- **PDF**: Reportes formateados

## 🔒 Seguridad

### Middleware de Seguridad
- **Helmet**: Headers HTTP seguros
- **CORS**: Control de acceso entre dominios
- **Compresión**: Optimización de respuestas

### Configuración CORS
```bash
# Dominios permitidos
CORS_ORIGINS=http://localhost:3000,http://ema.chapelco.local,https://ema.chapelco.local
```

## 🚀 Despliegue

### Entorno de Desarrollo
```bash
npm run dev
```

### Entorno de Producción
```bash
npm start
```

### Variables de Producción
```bash
NODE_ENV=production
LOG_LEVEL=warn
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

## 🧪 Testing

### Ejecutar Tests
```bash
npm test
```

### Tests de Integración
```bash
npm run test:integration
```

### Cobertura de Código
```bash
npm run test:coverage
```

## 📝 Contribución

### Guías de Contribución
1. Fork del repositorio
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- **ESLint**: Linting de JavaScript
- **Prettier**: Formateo de código
- **JSDoc**: Documentación de funciones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Equipo EMAS** - Desarrollo inicial
- **Contribuidores** - Mejoras y mantenimiento

## 🆘 Soporte

### Documentación
- [API Reference](docs/api.md)
- [Configuration Guide](docs/configuration.md)
- [Troubleshooting](docs/troubleshooting.md)

### Contacto
- **Issues**: [GitHub Issues](https://github.com/wmaybank/emas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wmaybank/emas/discussions)

### Recursos Adicionales
- [WeatherLink Live Documentation](https://weatherlink.github.io/weatherlink-live-local-api/)
- [Davis Instruments](https://www.davisinstruments.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

**EMAS Weather Monitoring System** - Monitoreo meteorológico profesional para estaciones locales
