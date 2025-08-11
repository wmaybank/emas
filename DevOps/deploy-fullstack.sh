#!/bin/bash

# Script de despliegue mejorado para EMAS con Frontend
# Versión: 1.1.0
# Autor: Sistema EMAS

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables por defecto
ENVIRONMENT="${1:-production}"
COMPOSE_FILE="DevOps/docker-compose.fullstack.yml"
COMPOSE_DEV_FILE="DevOps/docker-compose.dev.yml"
PROJECT_NAME="emas"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker no está corriendo"
        exit 1
    fi
    
    success "Todas las dependencias están disponibles"
}

# Función para verificar archivo de entorno
check_env_file() {
    if [ ! -f "backend/.env" ]; then
        warning "Archivo backend/.env no encontrado"
        if [ -f "backend/env.example" ]; then
            log "Copiando backend/env.example a backend/.env"
            cp backend/env.example backend/.env
            warning "Por favor, revisa y configura el archivo backend/.env antes de continuar"
        else
            error "No se encontró backend/env.example"
            exit 1
        fi
    fi
}

# Función para crear backup
create_backup() {
    log "Creando backup antes del despliegue..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup de la base de datos si existe
    if docker volume ls | grep -q "${PROJECT_NAME}_emas_data"; then
        log "Creando backup de la base de datos..."
        docker run --rm -v ${PROJECT_NAME}_emas_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine:latest \
            sh -c "cd /data && tar czf /backup/database_backup.tar.gz ."
        success "Backup de base de datos creado en $BACKUP_DIR/database_backup.tar.gz"
    fi
    
    # Backup de logs si existen
    if docker volume ls | grep -q "${PROJECT_NAME}_emas_logs"; then
        log "Creando backup de logs..."
        docker run --rm -v ${PROJECT_NAME}_emas_logs:/logs -v "$(pwd)/$BACKUP_DIR":/backup alpine:latest \
            sh -c "cd /logs && tar czf /backup/logs_backup.tar.gz ."
        success "Backup de logs creado en $BACKUP_DIR/logs_backup.tar.gz"
    fi
}

# Función para detener servicios
stop_services() {
    log "Deteniendo servicios existentes..."
    
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down || true
    fi
    
    if [ -f "$COMPOSE_DEV_FILE" ]; then
        docker-compose -f "$COMPOSE_DEV_FILE" -p "$PROJECT_NAME" down || true
    fi
    
    success "Servicios detenidos"
}

# Función para limpiar recursos
cleanup_resources() {
    log "Limpiando recursos no utilizados..."
    
    # Eliminar contenedores detenidos
    docker container prune -f || true
    
    # Eliminar imágenes sin usar (solo las del proyecto)
    docker image ls --filter "reference=${PROJECT_NAME}*" --filter "dangling=true" -q | xargs -r docker image rm || true
    
    success "Recursos limpiados"
}

# Función para construir imagen
build_image() {
    log "Construyendo imagen de la aplicación (Frontend + Backend)..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache emas-fullstack
    else
        docker-compose -f "$COMPOSE_DEV_FILE" -p "$PROJECT_NAME" build --no-cache emas-app
    fi
    
    success "Imagen construida exitosamente"
}

# Función para desplegar aplicación
deploy_app() {
    log "Desplegando aplicación en modo $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
        
        # Verificar que el frontend esté siendo servido
        log "Verificando despliegue del frontend..."
        sleep 15
        
        if curl -f http://localhost/ &> /dev/null; then
            success "Frontend desplegado y accesible en http://localhost/"
        else
            warning "El frontend podría no estar disponible aún. Verifica los logs."
        fi
        
        if curl -f http://localhost/api/health &> /dev/null; then
            success "Backend API desplegado y accesible en http://localhost/api/"
        else
            warning "El backend API podría no estar disponible aún. Verifica los logs."
        fi
        
    else
        docker-compose -f "$COMPOSE_DEV_FILE" -p "$PROJECT_NAME" up -d
        success "Aplicación desplegada en modo desarrollo"
        warning "Recuerda ejecutar el frontend por separado con 'npm start' en el directorio frontend/"
    fi
}

# Función para verificar estado de servicios
check_services() {
    log "Verificando estado de los servicios..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        COMPOSE_CMD="docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME"
    else
        COMPOSE_CMD="docker-compose -f $COMPOSE_DEV_FILE -p $PROJECT_NAME"
    fi
    
    # Mostrar estado de contenedores
    echo ""
    log "Estado de contenedores:"
    $COMPOSE_CMD ps
    
    # Verificar salud de servicios principales
    echo ""
    log "Verificando salud de servicios..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Verificar frontend
        if curl -f -s http://localhost/ > /dev/null; then
            success "✓ Frontend responde correctamente"
        else
            error "✗ Frontend no responde"
        fi
        
        # Verificar backend API
        if curl -f -s http://localhost/api/health > /dev/null; then
            success "✓ Backend API responde correctamente"
        else
            error "✗ Backend API no responde"
        fi
    else
        # En desarrollo, solo verificar backend
        if curl -f -s http://localhost:3001/api/health > /dev/null; then
            success "✓ Backend API responde correctamente"
        else
            error "✗ Backend API no responde"
        fi
    fi
}

# Función para mostrar logs
show_logs() {
    log "Mostrando logs de la aplicación..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail=50 emas-fullstack
    else
        docker-compose -f "$COMPOSE_DEV_FILE" -p "$PROJECT_NAME" logs --tail=50 emas-app
    fi
}

# Función para mostrar información final
show_final_info() {
    echo ""
    echo "=========================================="
    success "Despliegue completado exitosamente!"
    echo "=========================================="
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🌐 Frontend: http://localhost/"
        echo "🔧 Backend API: http://localhost/api/"
        echo "📊 Grafana: http://localhost:3000/ (admin/admin)"
        echo "📈 Prometheus: http://localhost:9090/"
        echo ""
        echo "Servicios desplegados:"
        echo "  - Frontend React (servido por Nginx)"
        echo "  - Backend Node.js"
        echo "  - Base de datos SQLite"
        echo "  - Redis (cache)"
        echo "  - Prometheus (monitoreo)"
        echo "  - Grafana (visualización)"
        echo "  - Backup automático"
    else
        echo "🔧 Backend API: http://localhost:3001/api/"
        echo "📊 Grafana: http://localhost:3000/ (admin/admin)"
        echo "📈 Prometheus: http://localhost:9090/"
        echo ""
        echo "⚠️  MODO DESARROLLO:"
        echo "   Para el frontend, ejecuta en otra terminal:"
        echo "   cd frontend && npm start"
        echo "   El frontend estará disponible en http://localhost:3000/"
    fi
    
    echo ""
    echo "Comandos útiles:"
    echo "  Ver logs: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    echo "  Detener: docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down"
    echo "  Reiniciar: $0 $ENVIRONMENT"
    echo ""
}

# Función principal
main() {
    log "Iniciando despliegue de EMAS Weather System v1.1.0"
    log "Ambiente: $ENVIRONMENT"
    echo ""
    
    check_dependencies
    check_env_file
    
    if [ "$ENVIRONMENT" = "production" ]; then
        create_backup
    fi
    
    stop_services
    cleanup_resources
    build_image
    deploy_app
    
    # Esperar un momento para que los servicios se inicien
    log "Esperando que los servicios se inicien..."
    sleep 20
    
    check_services
    show_final_info
    
    # Ofrecer mostrar logs
    echo ""
    read -p "¿Deseas ver los logs en tiempo real? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Manejo de errores
trap 'error "Error durante el despliegue en línea $LINENO"' ERR

# Verificar argumentos
if [ "$#" -gt 1 ]; then
    echo "Uso: $0 [production|development]"
    echo ""
    echo "Ejemplos:"
    echo "  $0 production    # Despliegue completo con frontend y backend"
    echo "  $0 development   # Solo backend, frontend por separado"
    echo "  $0               # Por defecto: production"
    exit 1
fi

# Ejecutar función principal
main
