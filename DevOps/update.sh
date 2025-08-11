#!/bin/bash

# Script para actualizar EMAS en producción
set -e

echo "🔄 Iniciando actualización de EMAS..."

# Navegar al directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "📂 Directorio del proyecto: $PROJECT_DIR"

# Hacer backup de la base de datos antes de actualizar
echo "💾 Creando backup de la base de datos..."
cd DevOps
./deploy.sh backup

# Hacer pull de los últimos cambios
echo "📥 Descargando últimos cambios..."
cd "$PROJECT_DIR"
git fetch origin
git pull origin main

# Verificar si hay cambios en Docker files
if git diff HEAD~1 HEAD --name-only | grep -E "(Dockerfile|docker-compose)" > /dev/null; then
    echo "🏗️  Detectados cambios en Docker, reconstruyendo imágenes..."
    REBUILD_NEEDED=true
else
    echo "ℹ️  No hay cambios en Docker files, solo restart"
    REBUILD_NEEDED=false
fi

cd DevOps

if [ "$REBUILD_NEEDED" = true ]; then
    echo "🛑 Deteniendo servicios..."
    ./deploy.sh stop
    
    echo "🏗️  Reconstruyendo imágenes..."
    docker compose -f docker-compose.fullstack.yml build --no-cache
    
    echo "🚀 Iniciando servicios..."
    ./deploy.sh production
else
    echo "🔄 Reiniciando servicios..."
    ./deploy.sh restart
fi

# Verificar que los servicios estén funcionando
echo "🔍 Verificando estado de los servicios..."
sleep 10
./deploy.sh status

echo "✅ Actualización completada!"
echo "🌐 Frontend: http://localhost"
echo "📡 Backend: http://localhost:3001"
echo "📊 Prometheus: http://localhost:9090"
