# EMAS - Despliegue Simple para Producción

## 🚀 Solución Rápida para Producción

Si estás teniendo problemas con el despliegue complejo, usa esta versión simplificada que **construye las imágenes localmente** sin depender de registries externos.

### ✅ Comandos de Despliegue Simple

```bash
# En tu servidor de producción
cd /opt/emas/DevOps

# Opción 1: Build automático completo (recomendado)
chmod +x scripts/build-deploy.sh
./scripts/build-deploy.sh build-deploy

# Opción 2: Build alternativo (si hay problemas)
./scripts/build-deploy.sh build-alternative

# Opción 3: Comandos manuales
# Primero construir frontend
cd ../frontend && npm install && npm run build && cd ../DevOps
# Luego desplegar
docker compose -f docker-compose.simple.yml down --remove-orphans
docker compose -f docker-compose.simple.yml up -d --build
```

### 📋 Diferencias de la Versión Simple

| Aspecto | Versión Compleja | Versión Simple |
|---------|------------------|----------------|
| **Nombres** | `emas-weather-app` | `weather-app` |
| **Imágenes** | Pull desde registry | Build local |
| **Red** | `emas_network` | `app_network` |
| **Configuración** | Múltiples archivos | Un solo archivo |

### 🔧 Comandos de Gestión

```bash
# Ver estado
./scripts/deploy-simple.sh status

# Ver logs
./scripts/deploy-simple.sh logs

# Reiniciar
./scripts/deploy-simple.sh restart

# Reconstruir desde cero
./scripts/deploy-simple.sh rebuild

# Detener
./scripts/deploy-simple.sh stop
```

### 🛠️ Comandos Docker Compose Directos

```bash
cd /opt/emas/DevOps

# Construir e iniciar
docker compose -f docker-compose.simple.yml up -d --build

# Ver estado
docker compose -f docker-compose.simple.yml ps

# Ver logs
docker compose -f docker-compose.simple.yml logs -f

# Detener
docker compose -f docker-compose.simple.yml down
```

### 🔍 Verificación

```bash
# Health check
curl http://localhost/health

# Ver dashboard
curl -I http://localhost/

# Ver API
curl http://localhost/api/stations

# Estado de contenedores
docker ps | grep weather
```

### 📁 Archivos de la Versión Simple

- `docker-compose.simple.yml`: Configuración simplificada
- `nginx/conf.d/simple.conf`: Configuración nginx básica
- `scripts/deploy-simple.sh`: Script de despliegue automático

### 🚨 Solución de Problemas

#### Error: "frontend/build not found"
**Solución**: Construir frontend primero
```bash
# Opción A: Script automático
./scripts/build-deploy.sh build-deploy

# Opción B: Manual
cd ../frontend
npm install
npm run build
cd ../DevOps
docker compose -f docker-compose.simple.yml up -d --build
```

#### Error: "repository does not exist"
**Solución**: La versión simple construye localmente, no hace pull.

#### Error: "host not found in upstream"
**Solución**: Usa nombres simples (`weather-app` en lugar de `emas-weather-app`).

#### Contenedores no inician
```bash
# Ver logs detallados
docker compose -f docker-compose.simple.yml logs

# Reconstruir desde cero
docker compose -f docker-compose.simple.yml down --volumes
docker compose -f docker-compose.simple.yml build --no-cache
docker compose -f docker-compose.simple.yml up -d
```

### 🔄 Migración desde Versión Compleja

Si tienes la versión compleja corriendo:

```bash
# 1. Detener versión compleja
docker compose -f docker-compose.yml down

# 2. Iniciar versión simple
docker compose -f docker-compose.simple.yml up -d --build

# 3. Verificar
curl http://localhost/health
```

### 📊 Puertos y Servicios

- **80**: Aplicación web (nginx)
- **3001**: Backend API (Node.js)
- **6379**: Redis
- **9090**: Prometheus

### ✅ Contenedores Creados

- `weather-app`: Aplicación principal
- `weather-nginx`: Proxy reverso
- `weather-redis`: Cache
- `weather-prometheus`: Monitoreo

---

**💡 Esta versión simple es más confiable para producción porque construye todo localmente sin dependencias externas.**
