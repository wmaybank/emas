#!/bin/bash

# Script de build completo para EMAS
# Construye frontend local y despliega con Docker

set -e

echo "=== EMAS Weather System - Build y Despliegue ==="
echo "Fecha: $(date)"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

# Función para construir frontend localmente
build_frontend() {
    info "Construyendo frontend React..."
    
    if [ ! -d "../frontend" ]; then
        error "Directorio frontend no encontrado"
        return 1
    fi
    
    cd ../frontend
    
    # Verificar que existe package.json
    if [ ! -f "package.json" ]; then
        error "No se encontró package.json en frontend/"
        return 1
    fi
    
    # Instalar dependencias si no existen
    if [ ! -d "node_modules" ]; then
        info "Instalando dependencias del frontend..."
        npm install
    fi
    
    # Construir frontend
    info "Ejecutando npm run build..."
    npm run build
    
    # Verificar que se creó el directorio build
    if [ ! -d "build" ]; then
        error "No se generó el directorio build/"
        return 1
    fi
    
    info "✓ Frontend construido exitosamente"
    cd ../DevOps
}

# Función principal
main() {
    local action=${1:-"build-deploy"}
    
    # Verificar que estamos en DevOps
    if [ ! -f "docker-compose.simple.yml" ]; then
        error "Ejecutar desde el directorio DevOps/"
        exit 1
    fi
    
    case "$action" in
        "build-frontend")
            build_frontend
            ;;
            
        "build-deploy")
            log "=== Iniciando build completo ==="
            
            # 1. Construir frontend
            build_frontend
            
            # 2. Verificar archivo .env
            if [ ! -f ".env" ]; then
                if [ -f "env.docker" ]; then
                    log "Copiando env.docker a .env"
                    cp env.docker .env
                else
                    warn "No se encontró archivo .env, usando valores por defecto"
                fi
            fi
            
            # 3. Limpiar contenedores anteriores
            log "Limpiando contenedores anteriores..."
            docker compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true
            
            # 4. Construir imágenes Docker
            log "Construyendo imágenes Docker..."
            docker compose -f docker-compose.simple.yml build --no-cache
            
            # 5. Iniciar servicios
            log "Iniciando servicios..."
            docker compose -f docker-compose.simple.yml up -d
            
            # 6. Verificar despliegue
            sleep 10
            log "Verificando servicios..."
            docker compose -f docker-compose.simple.yml ps
            
            # 7. Health check
            log "Verificando aplicación..."
            for i in {1..30}; do
                if curl -f http://localhost/health >/dev/null 2>&1; then
                    log "✓ Aplicación respondiendo en http://localhost"
                    break
                elif [ $i -eq 30 ]; then
                    warn "⚠ La aplicación puede estar iniciando aún"
                    log "Ver logs con: docker compose -f docker-compose.simple.yml logs"
                else
                    echo -n "."
                    sleep 2
                fi
            done
            
            log "=== Build y despliegue completado ==="
            log "Dashboard: http://localhost"
            log "API: http://localhost/api"
            log "Monitoreo: http://localhost:9090"
            ;;
            
        "build-alternative")
            log "=== Build con frontend local ==="
            
            # Construir frontend
            build_frontend
            
            # Usar Dockerfile simple
            log "Construyendo con Dockerfile simple..."
            docker build -t weather-app:latest -f Dockerfile.simple ..
            
            # Actualizar docker-compose para usar imagen local
            log "Desplegando con imagen local..."
            sed 's/build:/# build:/g' docker-compose.simple.yml > docker-compose.local.yml
            sed -i 's/context: ../image: weather-app:latest/g' docker-compose.local.yml
            sed -i 's/dockerfile: DevOps\/Dockerfile/# dockerfile: DevOps\/Dockerfile/g' docker-compose.local.yml
            
            docker compose -f docker-compose.local.yml down --remove-orphans 2>/dev/null || true
            docker compose -f docker-compose.local.yml up -d
            
            log "✓ Despliegue alternativo completado"
            ;;
            
        *)
            echo "Uso: $0 [build-frontend|build-deploy|build-alternative]"
            echo "  build-frontend   - Solo construir frontend React"
            echo "  build-deploy     - Build completo y despliegue (default)"
            echo "  build-alternative - Build local + imagen simple"
            exit 1
            ;;
    esac
}

# Manejo de errores
trap 'error "Build interrumpido"; exit 1' SIGINT SIGTERM

# Ejecutar
main "$@"
