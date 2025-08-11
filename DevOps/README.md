# DevOps - EMAS Weather Monitoring System

Este directorio contiene toda la configuración necesaria para desplegar el sistema EMAS Weather Monitoring System usando Docker Compose.

## 🏗️ Arquitectura del Despliegue

### Servicios Principales

- **emas-app**: Aplicación Node.js principal
- **emas-db**: Base de datos SQLite
- **nginx**: Proxy reverso con SSL
- **redis**: Cache y sesiones
- **prometheus**: Monitoreo y métricas
- **backup**: Backup automático de la base de datos

> **Nota**: Grafana se ha removido del stack Docker. Se asume que tienes un servidor Grafana existente en tu red. Ver `monitoring/grafana/EXTERNAL_SETUP.md` para instrucciones de configuración.

### Redes y Volúmenes

- **emas_network**: Red interna para comunicación entre servicios
- **emas_data**: Volumen persistente para la base de datos
- **emas_logs**: Volumen para logs de la aplicación
- **emas_backups**: Volumen para backups automáticos

## 🚀 Despliegue Rápido

### 1. Verificar Requisitos

```bash
# Verificar Docker
docker --version
docker compose version

# Verificar que Docker esté ejecutándose
docker info
```

### 2. Configurar Variables de Entorno

```bash
# Copiar y editar el archivo de variables
cp env.docker .env
# Editar .env con tus configuraciones específicas
```

### 3. Desplegar

```bash
# Dar permisos de ejecución al script
chmod +x deploy.sh

# Desplegar en producción (completo)
./deploy.sh production

# O desplegar en desarrollo (solo app + db)
./deploy.sh development
```

## 📋 Comandos Disponibles

```bash
./deploy.sh production    # Desplegar en modo producción
./deploy.sh development   # Desplegar en modo desarrollo
./deploy.sh stop          # Detener todos los servicios
./deploy.sh restart       # Reiniciar todos los servicios
./deploy.sh logs          # Mostrar logs en tiempo real
./deploy.sh status        # Mostrar estado de los servicios
./deploy.sh clean         # Limpiar contenedores y volúmenes
./deploy.sh backup        # Crear backup manual
./deploy.sh help          # Mostrar ayuda
```

## 🔧 Configuración

### Variables de Entorno Principales

```bash
# Estaciones meteorológicas locales
WEATHER_STATIONS=10.20.50.50:80,10.20.50.51:80,10.20.50.52:80

# Configuración de polling
STATION_POLLING_INTERVAL=30
STATION_REQUEST_TIMEOUT=5000

# Configuración UDP
UDP_ENABLED=true
UDP_PORT=22222

# Configuración de seguridad
REDIS_PASSWORD=tu_password_aqui
GRAFANA_PASSWORD=tu_password_aqui
```

### Puertos Externos

- **80/443**: Nginx (HTTP/HTTPS)
- **3001**: Aplicación EMAS
- **9090**: Prometheus
- **6379**: Redis

> **Nota**: El puerto 3000 ya no está en uso por Grafana local. Configura tu servidor Grafana existente para conectarse a Prometheus en el puerto 9090.

## 📊 Monitoreo

### Prometheus

- **URL**: http://localhost:9090
- **Métricas**: Aplicación, Nginx, Redis, Sistema
- **Retención**: 200 horas por defecto

### Grafana Externo

- **Configuración**: Ver `monitoring/grafana/EXTERNAL_SETUP.md`
- **Dashboard**: Importar `monitoring/grafana/dashboards/emas-weather-dashboard.json`
- **Datasource**: Conectar a Prometheus en `http://[IP_SERVIDOR]:9090`

## 🔒 Seguridad

### SSL/TLS

- Certificados ubicados en `nginx/ssl/`
- Redirección automática HTTP → HTTPS
- Headers de seguridad configurados

### Rate Limiting

- API: 10 requests/segundo por IP
- Login: 1 request/segundo por IP

### Headers de Seguridad

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

## 💾 Backup y Recuperación

### Backup Automático

- **Frecuencia**: Cada 24 horas (configurable)
- **Retención**: 30 días
- **Formato**: SQL comprimido (.sql.gz)
- **Ubicación**: Volumen `emas_backups`

### Backup Manual

```bash
./deploy.sh backup
```

### Restaurar Base de Datos

```bash
# Copiar archivo de backup al contenedor
docker cp emas_backup_20241208_143022.sql.gz emas-weather-app:/tmp/

# Descomprimir y restaurar
docker exec -it emas-weather-app sh -c "
  cd /tmp &&
  gunzip emas_backup_20241208_143022.sql.gz &&
  sqlite3 /app/data/weather.db < emas_backup_20241208_143022.sql
"
```

## 🐛 Troubleshooting

### Ver Logs

```bash
# Logs de todos los servicios
./deploy.sh logs

# Logs de un servicio específico
docker compose logs -f emas-app
docker compose logs -f nginx
```

### Verificar Estado

```bash
# Estado de los servicios
./deploy.sh status

# Estado de contenedores Docker
docker ps
```

### Reiniciar Servicios

```bash
# Reiniciar todos los servicios
./deploy.sh restart

# Reiniciar un servicio específico
docker compose restart emas-app
```

### Problemas Comunes

#### 1. Puerto ya en uso
```bash
# Verificar qué proceso usa el puerto
netstat -tulpn | grep :3001

# Detener proceso o cambiar puerto en docker-compose.yml
```

#### 2. Problemas de permisos
```bash
# Verificar permisos de volúmenes
docker volume ls
docker volume inspect emas_data

# Recrear volúmenes si es necesario
./deploy.sh clean
./deploy.sh production
```

#### 3. Problemas de conectividad entre contenedores
```bash
# Verificar red Docker
docker network ls
docker network inspect emas_emas_network

# Verificar conectividad
docker exec emas-app ping nginx
```

## 🔄 Actualizaciones

### Actualizar Aplicación

```bash
# Detener servicios
./deploy.sh stop

# Reconstruir imagen
docker compose build --no-cache emas-app

# Levantar servicios
./deploy.sh production
```

### Actualizar Configuración

```bash
# Editar archivos de configuración
# Reiniciar servicios
./deploy.sh restart
```

## 📈 Escalabilidad

### Escalar Servicios

```bash
# Escalar aplicación
docker compose up -d --scale emas-app=3

# Escalar con balanceador de carga
# Agregar HAProxy o Traefik al docker-compose.yml
```

### Monitoreo de Recursos

```bash
# Ver uso de recursos
docker stats

# Ver logs de Prometheus
docker compose logs prometheus
```

## 🧪 Testing

### Pruebas de Conectividad

```bash
# Health check de la aplicación
curl http://localhost:3001/api/health

# Health check de Nginx
curl http://localhost/health

# Verificar WebSocket
wscat -c ws://localhost:3001/ws/realtime
```

### Pruebas de Carga

```bash
# Instalar Apache Bench
apt-get install apache2-utils

# Prueba de carga básica
ab -n 1000 -c 10 http://localhost:3001/api/health
```

## 📚 Recursos Adicionales

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/)
- [Grafana Documentation](https://grafana.com/docs/)

## 🤝 Soporte

Para problemas o preguntas sobre el despliegue:

1. Revisar logs: `./deploy.sh logs`
2. Verificar estado: `./deploy.sh status`
3. Consultar documentación de Docker
4. Revisar issues del proyecto

---

**Nota**: Este despliegue está configurado para desarrollo y producción. Ajusta las configuraciones según tus necesidades específicas de infraestructura y seguridad.
