#!/bin/bash

# Script de despliegue robusto para EMAS Weather System
# Maneja el orden correcto de inicio y verificaciones

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== EMAS Weather System - Despliegue en Producción ==="
echo "Directorio del proyecto: $PROJECT_ROOT"
echo "Fecha: $(date)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con colores
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
    esac
}

# Función para verificar requisitos
check_requirements() {
    log "INFO" "Verificando requisitos del sistema..."
    
    # Verificar Docker
    if ! command -v docker >/dev/null 2>&1; then
        log "ERROR" "Docker no está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        log "ERROR" "Docker Compose no está disponible"
        exit 1
    fi
    
    # Verificar que Docker esté corriendo
    if ! docker info >/dev/null 2>&1; then
        log "ERROR" "Docker daemon no está corriendo"
        exit 1
    fi
    
    log "SUCCESS" "Todos los requisitos están disponibles"
}

# Función para limpiar contenedores anteriores
cleanup() {
    log "INFO" "Limpiando contenedores anteriores..."
    
    cd "$PROJECT_ROOT/DevOps"
    
    # Detener contenedores si están corriendo
    docker compose down --remove-orphans 2>/dev/null || true
    
    # Limpiar volúmenes de desarrollo si existen
    docker volume prune -f 2>/dev/null || true
    
    log "SUCCESS" "Limpieza completada"
}

# Función para construir imágenes
build_images() {
    log "INFO" "Construyendo imágenes Docker..."
    
    cd "$PROJECT_ROOT"
    
    # Construir imagen principal de la aplicación
    log "INFO" "Construyendo imagen de la aplicación..."
    docker build -t emas-weather:latest -f DevOps/Dockerfile .
    
    cd "$PROJECT_ROOT/DevOps"
    
    # Construir imagen de nginx
    log "INFO" "Construyendo imagen de nginx..."
    docker compose build nginx
    
    log "SUCCESS" "Todas las imágenes construidas exitosamente"
}

# Función para verificar configuración
verify_config() {
    log "INFO" "Verificando configuración..."
    
    cd "$PROJECT_ROOT/DevOps"
    
    # Verificar que existe el archivo .env
    if [ ! -f ".env" ]; then
        if [ -f "env.docker" ]; then
            log "WARNING" "Copiando env.docker a .env"
            cp env.docker .env
        else
            log "ERROR" "No se encontró archivo de configuración .env o env.docker"
            exit 1
        fi
    fi
    
    # Verificar docker-compose.yml
    if ! docker compose config >/dev/null; then
        log "ERROR" "Error en configuración de docker compose"
        exit 1
    fi
    
    log "SUCCESS" "Configuración verificada"
}

# Función para iniciar servicios en orden
start_services() {
    log "INFO" "Iniciando servicios en orden secuencial..."
    
    cd "$PROJECT_ROOT/DevOps"
    
    # 1. Iniciar base de datos y servicios auxiliares
    log "INFO" "Iniciando servicios auxiliares..."
    docker compose up -d emas-db redis prometheus
    
    # Esperar un momento para que se inicialicen
    sleep 5
    
    # 2. Iniciar aplicación principal
    log "INFO" "Iniciando aplicación principal..."
    docker compose up -d emas-app
    
    # 3. Esperar a que el backend esté listo
    log "INFO" "Esperando a que el backend esté listo..."
    wait_for_backend
    
    # 4. Iniciar nginx
    log "INFO" "Iniciando nginx..."
    docker compose up -d nginx
    
    # 5. Servicios opcionales
    log "INFO" "Iniciando servicios de respaldo..."
    docker compose up -d backup
    
    log "SUCCESS" "Todos los servicios iniciados"
}

# Función para esperar a que el backend esté listo
wait_for_backend() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec emas-weather-app curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            log "SUCCESS" "Backend está listo y respondiendo"
            return 0
        fi
        
        log "INFO" "Esperando backend... intento $attempt/$max_attempts"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log "ERROR" "Backend no responde después de $max_attempts intentos"
    log "INFO" "Mostrando logs del backend para diagnóstico:"
    docker logs emas-weather-app --tail 20
    exit 1
}

# Función para verificar estado final
verify_deployment() {
    log "INFO" "Verificando estado del despliegue..."
    
    cd "$PROJECT_ROOT/DevOps"
    
    # Mostrar estado de contenedores
    log "INFO" "Estado de contenedores:"
    docker compose ps
    
    # Verificar health checks
    log "INFO" "Verificando health checks..."
    
    local services=("emas-weather-app" "emas-nginx")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "no-healthcheck")
        
        if [ "$health" = "healthy" ] || [ "$health" = "no-healthcheck" ]; then
            log "SUCCESS" "$service: $health"
        else
            log "WARNING" "$service: $health"
            all_healthy=false
        fi
    done
    
    # Verificar endpoints
    log "INFO" "Verificando endpoints..."
    
    # Verificar nginx health
    if curl -f http://localhost/nginx-health >/dev/null 2>&1; then
        log "SUCCESS" "Nginx health check: OK"
    else
        log "WARNING" "Nginx health check: FAIL"
        all_healthy=false
    fi
    
    # Verificar backend health
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log "SUCCESS" "Backend health check: OK"
    else
        log "WARNING" "Backend health check: FAIL"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log "SUCCESS" "Despliegue completado exitosamente"
        log "INFO" "Aplicación disponible en: http://localhost"
        log "INFO" "API disponible en: http://localhost/api"
        log "INFO" "Monitoreo disponible en: http://localhost:9090"
        log "INFO" "Debug nginx disponible en: http://localhost:8080/debug"
    else
        log "WARNING" "Despliegue completado con advertencias"
        log "INFO" "Revisar logs con: docker-compose logs [servicio]"
    fi
}

# Función para mostrar logs en tiempo real
show_logs() {
    log "INFO" "Mostrando logs en tiempo real (Ctrl+C para salir)..."
    cd "$PROJECT_ROOT/DevOps"
    docker compose logs -f
}

# Función principal
main() {
    local action=${1:-"deploy"}
    
    case $action in
        "deploy")
            check_requirements
            cleanup
            verify_config
            build_images
            start_services
            sleep 10  # Dar tiempo para que se estabilicen los health checks
            verify_deployment
            ;;
        "logs")
            show_logs
            ;;
        "status")
            cd "$PROJECT_ROOT/DevOps"
            docker compose ps
            ;;
        "stop")
            cd "$PROJECT_ROOT/DevOps"
            docker compose down
            ;;
        "restart")
            cd "$PROJECT_ROOT/DevOps"
            docker compose restart
            ;;
        *)
            echo "Uso: $0 [deploy|logs|status|stop|restart]"
            echo "  deploy  - Despliegue completo (default)"
            echo "  logs    - Mostrar logs en tiempo real"
            echo "  status  - Mostrar estado de contenedores"
            echo "  stop    - Detener todos los servicios"
            echo "  restart - Reiniciar todos los servicios"
            exit 1
            ;;
    esac
}

# Manejo de señales
trap 'log "WARNING" "Despliegue interrumpido por el usuario"; exit 1' SIGINT SIGTERM

# Ejecutar función principal
main "$@"
