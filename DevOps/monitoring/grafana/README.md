# Configuración de Dashboard Grafana para EMAS

Este directorio contiene la configuración del dashboard de Grafana para el sistema de monitoreo meteorológico EMAS.

## Dashboard

El archivo `dashboards/emas-weather-dashboard.json` contiene la configuración completa del dashboard que muestra:

- **Métricas de estaciones meteorológicas**
- **Temperaturas en tiempo real**
- **Velocidad y dirección del viento**
- **Humedad relativa**
- **Presión atmosférica**
- **Precipitación**
- **Estado de conectividad de las estaciones**

## Configuración en tu servidor Grafana

### 1. Importar el Dashboard

1. Accede a tu servidor Grafana
2. Ve a **Dashboards > Import**
3. Sube el archivo `dashboards/emas-weather-dashboard.json`
4. Configura el datasource de Prometheus (ver siguiente sección)

### 2. Configurar Datasource de Prometheus

Si aún no tienes configurado Prometheus como datasource:

1. Ve a **Configuration > Data Sources**
2. Añade un nuevo datasource de tipo **Prometheus**
3. Configura la URL: `http://[IP_DEL_SERVIDOR_EMAS]:9090`
4. Guarda y prueba la conexión

### 3. Variables del Dashboard

El dashboard utiliza estas variables que se configuran automáticamente:
- `$datasource`: El datasource de Prometheus
- `$instance`: Instancia del servicio EMAS
- `$station`: Estación meteorológica seleccionada

### 4. Paneles Incluidos

El dashboard incluye los siguientes paneles:

#### Métricas Generales
- **Estado del Sistema**: Uptime y estado de servicios
- **Conectividad de Estaciones**: Número de estaciones online/offline
- **Última Actualización**: Timestamp de la última lectura

#### Métricas Meteorológicas
- **Temperatura**: Gráfico temporal de temperaturas por estación
- **Humedad**: Niveles de humedad relativa
- **Presión Atmosférica**: Tendencias de presión
- **Viento**: Velocidad y dirección
- **Precipitación**: Acumulados de lluvia

#### Alertas
- **Alertas Activas**: Listado de alertas meteorológicas
- **Histórico de Alertas**: Tendencias de alertas por tipo

## Estructura de Archivos

```
monitoring/grafana/
├── README.md                           # Este archivo
├── dashboards/
│   └── emas-weather-dashboard.json    # Dashboard principal
└── provisioning/
    └── datasources/
        └── prometheus.yml             # Configuración automática de datasource (solo referencia)
```

## Métricas Disponibles

El sistema EMAS expone las siguientes métricas de Prometheus:

### Métricas del Sistema
- `emas_uptime_seconds`: Tiempo de funcionamiento del sistema
- `emas_stations_total`: Número total de estaciones configuradas
- `emas_stations_online`: Número de estaciones conectadas
- `emas_http_requests_total`: Total de requests HTTP
- `emas_websocket_connections`: Conexiones WebSocket activas

### Métricas Meteorológicas
- `emas_temperature_celsius{station="station_id"}`: Temperatura en Celsius
- `emas_humidity_percent{station="station_id"}`: Humedad relativa
- `emas_pressure_hpa{station="station_id"}`: Presión atmosférica
- `emas_wind_speed_ms{station="station_id"}`: Velocidad del viento
- `emas_wind_direction_degrees{station="station_id"}`: Dirección del viento
- `emas_rainfall_mm{station="station_id"}`: Precipitación acumulada

### Métricas de Alertas
- `emas_alerts_active`: Número de alertas activas
- `emas_alerts_total`: Total de alertas generadas

## Personalización

Para personalizar el dashboard:

1. Importa el dashboard base
2. Haz las modificaciones necesarias en Grafana
3. Exporta la nueva configuración
4. Reemplaza el archivo `emas-weather-dashboard.json`

## Notas

- El dashboard está optimizado para resoluciones de 1920x1080 o superiores
- Se recomienda configurar auto-refresh cada 30 segundos
- Las alertas se basan en umbrales configurables en el sistema EMAS
- Los datos históricos dependen de la configuración de retención de Prometheus

## Soporte

Para más información sobre la configuración del sistema EMAS, consulta la documentación principal en el directorio raíz del proyecto.
