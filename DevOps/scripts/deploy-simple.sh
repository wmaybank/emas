#!/bin/bash

# Script de despliegue simple para producción
# Usa nombres de contenedor simples y configuración mínima

set -e

echo "=== EMAS Weather System - Despliegue Simple ==="
echo "Fecha: $(date)"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.simple.yml" ]; then
    error "No se encontró docker-compose.simple.yml. Asegúrate de estar en el directorio DevOps/"
    exit 1
fi

# Verificar Docker
if ! docker info >/dev/null 2>&1; then
    error "Docker no está corriendo"
    exit 1
fi

# Verificar Docker Compose
if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose no está disponible"
    exit 1
fi

case "${1:-deploy}" in
    "deploy")
        log "Iniciando despliegue simple..."
        
        # Detener servicios existentes
        log "Deteniendo servicios existentes..."
        docker compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true
        
        # Verificar archivo .env
        if [ ! -f ".env" ]; then
            if [ -f "env.docker" ]; then
                log "Copiando env.docker a .env"
                cp env.docker .env
            else
                warn "No se encontró archivo .env, usando valores por defecto"
            fi
        fi
        
        # Limpiar imágenes antiguas (opcional)
        log "Limpiando imágenes no utilizadas..."
        docker image prune -f >/dev/null 2>&1 || true
        
        # Construir e iniciar servicios
        log "Construyendo e iniciando servicios..."
        docker compose -f docker-compose.simple.yml up -d --build
        
        # Esperar un momento
        sleep 10
        
        # Verificar estado
        log "Verificando estado de servicios..."
        docker compose -f docker-compose.simple.yml ps
        
        # Health checks
        log "Verificando health checks..."
        sleep 5
        
        if curl -f http://localhost/health >/dev/null 2>&1; then
            log "✓ Aplicación está respondiendo en http://localhost"
        else
            warn "⚠ La aplicación puede estar iniciando aún. Verifica con: docker compose -f docker-compose.simple.yml logs"
        fi
        
        log "Despliegue completado!"
        log "Dashboard: http://localhost"
        log "API: http://localhost/api"
        log "Monitoreo: http://localhost:9090"
        ;;
        
    "logs")
        docker compose -f docker-compose.simple.yml logs -f
        ;;
        
    "status")
        docker compose -f docker-compose.simple.yml ps
        ;;
        
    "stop")
        log "Deteniendo servicios..."
        docker compose -f docker-compose.simple.yml down
        ;;
        
    "restart")
        log "Reiniciando servicios..."
        docker compose -f docker-compose.simple.yml restart
        ;;
        
    "rebuild")
        log "Reconstruyendo servicios..."
        docker compose -f docker-compose.simple.yml down
        docker compose -f docker-compose.simple.yml build --no-cache
        docker compose -f docker-compose.simple.yml up -d
        ;;
        
    *)
        echo "Uso: $0 [deploy|logs|status|stop|restart|rebuild]"
        echo "  deploy  - Despliegue completo (default)"
        echo "  logs    - Mostrar logs en tiempo real"
        echo "  status  - Mostrar estado de contenedores"
        echo "  stop    - Detener todos los servicios"
        echo "  restart - Reiniciar todos los servicios"
        echo "  rebuild - Reconstruir imágenes y reiniciar"
        exit 1
        ;;
esac
