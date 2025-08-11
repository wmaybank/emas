# Configuración para Servidor Grafana Externo

## Configuración del Datasource de Prometheus

Agrega esta configuración en tu servidor Grafana existente:

**Nombre**: EMAS Prometheus
**Tipo**: Prometheus
**URL**: `http://[IP_DEL_SERVIDOR_EMAS]:9090`

Donde `[IP_DEL_SERVIDOR_EMAS]` es la IP donde ejecutas el stack de Docker Compose.

## Importar Dashboard

1. Ve a tu Grafana
2. Dashboards > Import
3. Sube el archivo: `dashboards/emas-weather-dashboard.json`
4. Selecciona el datasource "EMAS Prometheus"
5. Importar

## Variables de Red

Si tu servidor Grafana está en una red diferente, asegúrate de que:

- El puerto 9090 (Prometheus) esté accesible desde tu servidor Grafana
- No hay firewalls bloqueando la conexión
- El DNS/IP del servidor EMAS sea resolvible desde tu Grafana

## URL de Acceso a Prometheus

Una vez desplegado con Docker Compose, Prometheus estará disponible en:
- `http://localhost:9090` (local)
- `http://[IP_DEL_SERVIDOR]:9090` (desde red)

Puedes verificar que funciona accediendo a esa URL y viendo la interfaz de Prometheus.
