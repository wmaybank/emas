# EMAS Production Deployment Guide

## 🚨 Solución para Error de nginx en Producción

Si estás viendo este error:
```
nginx: [emerg] host not found in upstream "emas-weather-app:3001" in /etc/nginx/conf.d/default.conf:3
```

## 🔧 Solución Rápida

### Opción 1: Usar el Script de Despliegue Automático

```bash
# Navegar al directorio del proyecto
cd /path/to/emas

# Hacer ejecutable el script (solo la primera vez)
chmod +x DevOps/scripts/deploy.sh

# Ejecutar despliegue completo
./DevOps/scripts/deploy.sh deploy
```

### Opción 2: Despliegue Manual Paso a Paso

```bash
# 1. Navegar al directorio DevOps
cd DevOps

# 2. Detener contenedores existentes
docker compose down --remove-orphans

# 3. Construir imagen de la aplicación
cd ..
docker build -t emas-weather:latest -f DevOps/Dockerfile .

# 4. Construir imagen de nginx personalizada
cd DevOps
docker compose build nginx

# 5. Iniciar servicios en orden
docker compose up -d emas-db redis prometheus
sleep 10

docker compose up -d emas-app
sleep 15

docker compose up -d nginx
sleep 5

docker compose up -d backup

# 6. Verificar estado
docker compose ps
```

## 🔍 Diagnóstico y Resolución de Problemas

### Verificar Conectividad

```bash
# Verificar que el backend esté corriendo
docker exec emas-weather-app curl -f http://localhost:3001/api/health

# Verificar logs del backend
docker logs emas-weather-app --tail 20

# Verificar logs de nginx
docker logs emas-nginx --tail 20

# Verificar red Docker
docker network ls
docker network inspect devops_emas_network
```

### Verificar Configuración de nginx

```bash
# Probar configuración de nginx
docker exec emas-nginx nginx -t

# Ver configuración cargada
docker exec emas-nginx cat /etc/nginx/conf.d/default.conf

# Endpoint de debug (puerto 8080)
curl http://localhost:8080/debug
```

### Health Checks

```bash
# Nginx health check
curl http://localhost/nginx-health

# Backend health check a través de nginx
curl http://localhost/health

# Backend health check directo
curl http://localhost:3001/api/health

# Estado de todos los contenedores
docker compose ps
docker stats --no-stream
```

## 🛠️ Configuraciones Importantes

### Variables de Entorno Críticas

Asegúrate de que tu archivo `DevOps/.env` tenga:

```env
# Servicios
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Estaciones meteorológicas
WEATHER_STATIONS=10.20.50.50:80,10.20.50.51:80,10.20.50.52:80

# Base de datos
DB_PATH=./data/weather.db

# Logging
LOG_LEVEL=info
```

### Puertos Utilizados

- **80**: Aplicación web principal (nginx)
- **3001**: Backend API (Node.js)
- **8080**: Debug endpoint de nginx
- **9090**: Prometheus (monitoreo)
- **6379**: Redis (cache)

## 🚀 Scripts Disponibles

### Despliegue y Gestión

```bash
# Despliegue completo
./DevOps/scripts/deploy.sh deploy

# Ver logs en tiempo real
./DevOps/scripts/deploy.sh logs

# Ver estado de servicios
./DevOps/scripts/deploy.sh status

# Detener todos los servicios
./DevOps/scripts/deploy.sh stop

# Reiniciar servicios
./DevOps/scripts/deploy.sh restart
```

### Comandos de Mantenimiento

```bash
# Backup manual de la base de datos
docker exec emas-weather-app node scripts/backup.js

# Limpiar logs antiguos
docker exec emas-weather-app find logs/ -name "*.log" -mtime +7 -delete

# Actualizar desde Git
git pull origin main
./DevOps/scripts/deploy.sh deploy
```

## 🔧 Configuraciones Específicas

### Para Entornos con Firewall

Si tienes restricciones de red, asegúrate de abrir:
- Puerto 80 (HTTP)
- Puerto 443 (HTTPS, si usas SSL)
- Puerto 8080 (Debug, opcional)

### Para Nombres de Host Personalizados

Edita `DevOps/nginx/conf.d/emas-fullstack.conf`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com emas.local;
    # ... resto de configuración
}
```

### Para HTTPS/SSL

1. Coloca certificados en `DevOps/nginx/ssl/`
2. Actualiza configuración en `nginx.conf`
3. Agrega puerto 443 al docker-compose.yml

## 🆘 Solución de Problemas Comunes

### Error: "Container not found"

```bash
# Verificar que los contenedores existan
docker ps -a | grep emas

# Recrear contenedores
docker compose down
docker compose up -d
```

### Error: "Port already in use"

```bash
# Encontrar proceso usando el puerto
netstat -tlnp | grep :80

# Detener proceso conflictivo
sudo kill -9 <PID>

# O cambiar puerto en docker-compose.yml
ports:
  - "8080:80"  # Cambiar puerto externo
```

### Error: "Network not found"

```bash
# Recrear red Docker
docker network prune
docker compose up -d
```

### Backend no responde

```bash
# Verificar logs
docker logs emas-weather-app

# Verificar variables de entorno
docker exec emas-weather-app env | grep -E "(PORT|HOST|NODE_ENV)"

# Reiniciar solo el backend
docker compose restart emas-app
```

## 📊 Monitoreo en Producción

### Logs Importantes

```bash
# Logs de aplicación
docker logs emas-weather-app -f

# Logs de nginx
docker logs emas-nginx -f

# Logs de todos los servicios
docker compose logs -f
```

### Métricas con Prometheus

- Acceder a: http://localhost:9090
- Queries útiles:
  - `up{job="emas"}` - Estado de servicios
  - `http_requests_total` - Requests HTTP
  - `container_memory_usage_bytes` - Uso de memoria

### Alertas de Sistema

El sistema incluye health checks automáticos:
- Backend: http://localhost/health
- Nginx: http://localhost/nginx-health
- Debug: http://localhost:8080/debug

## 📞 Soporte

Si continúas teniendo problemas:

1. Ejecuta el diagnóstico completo:
   ```bash
   ./DevOps/scripts/deploy.sh status
   curl http://localhost:8080/debug
   docker compose logs --tail 50
   ```

2. Revisa los issues en GitHub: https://github.com/wmaybank/emas/issues

3. Crea un nuevo issue con:
   - Logs completos de error
   - Output del comando `docker compose ps`
   - Configuración de tu archivo `.env`
   - Sistema operativo y versión de Docker

---

**¡El sistema debería estar funcionando correctamente después de seguir estos pasos!** 🎉
