# EMAS - Comandos Docker Compose Actualizados

## 🚀 Comandos Principales de Despliegue

### Despliegue Automático (Recomendado)
```bash
# Despliegue completo con verificaciones
./DevOps/scripts/deploy.sh deploy

# Ver logs en tiempo real
./DevOps/scripts/deploy.sh logs

# Verificar estado
./DevOps/scripts/deploy.sh status
```

### Comandos Docker Compose Manuales

#### Despliegue Básico
```bash
cd DevOps

# Construir e iniciar todos los servicios
docker compose up -d

# Ver estado de servicios
docker compose ps

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down
```

#### Despliegue Secuencial (Para Producción)
```bash
cd DevOps

# 1. Detener servicios existentes
docker compose down --remove-orphans

# 2. Construir imágenes
docker compose build

# 3. Iniciar servicios en orden
docker compose up -d emas-db redis prometheus
sleep 10

docker compose up -d emas-app
sleep 15

docker compose up -d nginx
sleep 5

docker compose up -d backup

# 4. Verificar estado
docker compose ps
```

## 🔧 Comandos de Mantenimiento

### Reconstruir Servicios
```bash
# Reconstruir imagen específica
docker compose build nginx
docker compose build emas-app

# Reconstruir sin cache
docker compose build --no-cache

# Forzar recreación de contenedores
docker compose up -d --force-recreate
```

### Gestión de Servicios
```bash
# Reiniciar servicio específico
docker compose restart emas-app
docker compose restart nginx

# Escalar servicio (si aplicable)
docker compose up -d --scale emas-app=2

# Ver recursos utilizados
docker compose top
```

### Logs y Diagnóstico
```bash
# Logs de servicio específico
docker compose logs emas-app
docker compose logs nginx

# Logs con seguimiento
docker compose logs -f emas-app

# Logs de últimas líneas
docker compose logs --tail 50 emas-app

# Logs de todos los servicios
docker compose logs --tail 20
```

### Gestión de Volúmenes
```bash
# Listar volúmenes
docker volume ls | grep emas

# Limpiar volúmenes no utilizados
docker volume prune

# Backup de volúmenes (datos importantes)
docker run --rm -v devops_emas_data:/source -v $(pwd):/backup alpine tar czf /backup/emas-data-backup.tar.gz -C /source .
```

## 🛠️ Comandos de Desarrollo

### Desarrollo Local
```bash
# Modo desarrollo con rebuild automático
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Solo backend para desarrollo frontend
docker compose up -d emas-app emas-db redis

# Ver configuración final
docker compose config
```

### Testing y Debug
```bash
# Ejecutar comando dentro de contenedor
docker compose exec emas-app bash
docker compose exec nginx sh

# Ver variables de entorno
docker compose exec emas-app env

# Verificar configuración nginx
docker compose exec nginx nginx -t

# Health checks manuales
docker compose exec emas-app curl http://localhost:3001/api/health
```

## 🔍 Comandos de Diagnóstico

### Verificación de Red
```bash
# Inspeccionar red
docker network ls
docker network inspect devops_emas_network

# Verificar conectividad entre contenedores
docker compose exec nginx ping emas-weather-app
docker compose exec nginx nc -zv emas-weather-app 3001
```

### Información del Sistema
```bash
# Uso de recursos
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
docker stats --no-stream

# Información detallada de contenedores
docker compose ps -a
docker inspect emas-weather-app
```

### Debug de Problemas
```bash
# Verificar configuración de compose
docker compose config --services
docker compose config --volumes

# Ver eventos del sistema
docker system events &
docker compose up -d

# Limpiar sistema completo (¡CUIDADO!)
docker system prune -a --volumes
```

## 📱 Comandos de Monitoreo

### Health Checks
```bash
# Verificar todos los health checks
for service in emas-weather-app emas-nginx; do
  echo "=== $service ==="
  docker inspect --format='{{.State.Health.Status}}' $service
done

# Endpoints de salud
curl -s http://localhost/health | jq .
curl -s http://localhost/nginx-health
curl -s http://localhost:8080/debug
```

### Métricas y Logs
```bash
# Prometheus metrics
curl -s http://localhost:9090/metrics

# Nginx status
curl -s http://localhost:8080/nginx-status

# Logs estructurados
docker compose logs --timestamps --since 1h
```

## 🚨 Comandos de Emergencia

### Recuperación Rápida
```bash
# Reinicio completo
docker compose down && docker compose up -d

# Reinicio con rebuild
docker compose down
docker compose build --no-cache
docker compose up -d

# Limpiar y reiniciar
docker compose down --volumes --remove-orphans
docker system prune -f
docker compose up -d
```

### Backup de Emergencia
```bash
# Backup de base de datos
docker compose exec emas-app node scripts/backup.js

# Backup de configuración
tar czf emas-config-backup-$(date +%Y%m%d).tar.gz DevOps/
```

## 📝 Notas Importantes

### Diferencias Docker Compose V1 vs V2
- ✅ **V2 (Nuevo)**: `docker compose` (plugin integrado)
- ❌ **V1 (Legacy)**: `docker-compose` (binario standalone)

### Verificar Versión
```bash
# Verificar que tienes Docker Compose V2
docker compose version

# Si solo tienes V1, actualizar Docker Desktop
# o instalar el plugin compose
```

### Compatibilidad
- Todos los comandos en este proyecto usan `docker compose`
- Si tu sistema solo tiene `docker-compose`, reemplaza en los comandos
- Para instalar V2: actualizar Docker Desktop o seguir [docs oficiales](https://docs.docker.com/compose/install/)

---

**💡 Tip**: Usar siempre `docker compose` en lugar de `docker-compose` para compatibilidad futura.
