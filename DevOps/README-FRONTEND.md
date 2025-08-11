# Despliegue EMAS con Frontend Incluido

## Cambios Realizados

### 1. **Dockerfile Multi-stage (Dockerfile.frontend)**
- **Frontend Builder Stage**: Compila el frontend React
- **Production Stage**: Combina backend Node.js + frontend estático + Nginx
- **Servicios integrados**: Un solo contenedor con todo

### 2. **Nginx Configuración (emas-fullstack.conf)**
- **Frontend**: Sirve archivos estáticos de React desde `/var/www/html`
- **API Proxy**: Redirecciona `/api/*` al backend Node.js
- **WebSocket**: Soporte para `/ws/*` 
- **SPA Support**: Configurado para React Router con `try_files`
- **Cache**: Optimizado para archivos estáticos

### 3. **Docker Compose Fullstack (docker-compose.fullstack.yml)**
- **Servicio único**: `emas-fullstack` con frontend + backend + nginx
- **Puerto 80**: Acceso directo sin proxy externo
- **Volúmenes**: Separados para logs de nginx
- **Health checks**: Verificación del frontend

### 4. **Script de Inicio (start-services.sh)**
- **Multi-proceso**: Maneja nginx + Node.js en un contenedor
- **Monitoreo**: Reinicia si algún servicio falla
- **Cleanup**: Manejo correcto de señales

### 5. **Script de Despliegue Mejorado (deploy-fullstack.sh)**
- **Verificación**: Chequea frontend y backend
- **Backup**: Antes de cada despliegue
- **Health checks**: Post-despliegue
- **Información**: URLs y comandos útiles

## Cómo Usar

### Despliegue Completo (Recomendado)
```bash
# Desde el directorio raíz del proyecto
chmod +x DevOps/deploy-fullstack.sh
./DevOps/deploy-fullstack.sh production
```

### Despliegue Manual
```bash
# Construir y desplegar
docker compose -f DevOps/docker-compose.fullstack.yml build
docker compose -f DevOps/docker-compose.fullstack.yml up -d

# Verificar
curl http://localhost/           # Frontend
curl http://localhost/api/health # Backend
```

### Despliegue de Desarrollo
```bash
./DevOps/deploy-fullstack.sh development
# Luego en otra terminal:
cd frontend && npm start
```

## URLs de Acceso

- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/
- **WebSocket**: ws://localhost/ws/realtime
- **Grafana**: http://localhost:3000/
- **Prometheus**: http://localhost:9090/

## Estructura de Archivos

```
/var/www/html/          # Frontend React compilado
/app/                   # Backend Node.js
/etc/nginx/conf.d/      # Configuración Nginx
/var/log/nginx/         # Logs de Nginx
```

## Comandos Útiles

```bash
# Ver logs del contenedor principal
docker compose -f DevOps/docker-compose.fullstack.yml logs -f emas-fullstack

# Acceder al contenedor
docker exec -it emas-fullstack sh

# Reiniciar solo el servicio principal
docker compose -f DevOps/docker-compose.fullstack.yml restart emas-fullstack

# Detener todo
docker compose -f DevOps/docker-compose.fullstack.yml down
```

## Ventajas del Nuevo Setup

1. **Simplificado**: Un solo contenedor para frontend + backend
2. **Optimizado**: Archivos estáticos servidos directamente por Nginx
3. **Escalable**: Separación clara entre servicios
4. **Productivo**: Cache optimizado para archivos estáticos
5. **Monitoreable**: Health checks y logs integrados

## Migración desde Setup Anterior

El setup anterior (solo backend) sigue funcionando con:
- `docker-compose.yml` (original)
- `Dockerfile` (original)

Para usar el nuevo setup completo, usar:
- `docker-compose.fullstack.yml`
- `Dockerfile.frontend`
