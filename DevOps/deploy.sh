#!/bin/bash

# Script de despliegue para EMAS Weather Monitoring System
# Uso: ./deploy.sh [production|development|stop|restart|logs|status|clean|backup|update|help]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.dev.yml"
ENV_FILE="env.docker"

# Detectar comando de Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}EMAS Weather Monitoring System - Script de Despliegue${NC}"
    echo ""
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  production   - Desplegar en modo producción (completo)"
    echo "  development  - Desplegar en modo desarrollo (solo app + db)"
    echo "  stop         - Detener todos los servicios"
    echo "  restart      - Reiniciar todos los servicios"
    echo "  logs         - Mostrar logs de todos los servicios"
    echo "  status       - Mostrar estado de los servicios"
    echo "  clean        - Limpiar contenedores, volúmenes y redes"
    echo "  backup       - Crear backup manual de la base de datos"
    echo "  update       - Actualizar aplicación en producción (pull + rebuild)"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 production    # Desplegar en producción"
    echo "  $0 development   # Desplegar en desarrollo"
    echo "  $0 logs          # Ver logs"
    echo "  $0 status        # Ver estado"
}

# Función para verificar requisitos
check_requirements() {
    echo -e "${BLUE}🔍 Verificando requisitos...${NC}"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        exit 1
    fi
    
    # Verificar que Docker esté ejecutándose
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker no está ejecutándose${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requisitos verificados${NC}"
}

# Función para desplegar en producción
deploy_production() {
    echo -e "${BLUE}🚀 Desplegando EMAS en modo PRODUCCIÓN...${NC}"
    
    # Cargar variables de entorno
    if [ -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}📋 Cargando variables de entorno desde $ENV_FILE${NC}"
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    else
        echo -e "${YELLOW}⚠️  Archivo $ENV_FILE no encontrado, usando valores por defecto${NC}"
    fi
    
    # Construir y levantar servicios
    echo -e "${BLUE}🔨 Construyendo imagen de la aplicación...${NC}"
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" build emas-app
    
    echo -e "${BLUE}📦 Levantando todos los servicios...${NC}"
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d
    
    echo -e "${GREEN}✅ Despliegue en producción completado${NC}"
    echo -e "${BLUE}🌐 Servicios disponibles:${NC}"
    echo -e "  - Aplicación: http://localhost:3001"
    echo -e "  - Nginx: http://localhost:80 (redirige a HTTPS)"
    echo -e "  - Grafana: http://localhost:3000 (admin/admin)"
    echo -e "  - Prometheus: http://localhost:9090"
    echo -e "  - Redis: localhost:6379"
}

# Función para desplegar en desarrollo
deploy_development() {
    echo -e "${BLUE}🔧 Desplegando EMAS en modo DESARROLLO...${NC}"
    
    # Construir y levantar servicios de desarrollo
    echo -e "${BLUE}🔨 Construyendo imagen de la aplicación...${NC}"
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" build emas-app
    
    echo -e "${BLUE}📦 Levantando servicios de desarrollo...${NC}"
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" up -d
    
    echo -e "${GREEN}✅ Despliegue en desarrollo completado${NC}"
    echo -e "${BLUE}🌐 Servicios disponibles:${NC}"
    echo -e "  - Aplicación: http://localhost:3001"
    echo -e "  - Base de datos: SQLite en volumen"
}

# Función para detener servicios
stop_services() {
    echo -e "${YELLOW}🛑 Deteniendo servicios...${NC}"
    
    # Detener servicios de producción
    if [ -f "$COMPOSE_FILE" ]; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down
    fi
    
    # Detener servicios de desarrollo
    if [ -f "$COMPOSE_DEV_FILE" ]; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" down
    fi
    
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
}

# Función para reiniciar servicios
restart_services() {
    echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"
    
    # Determinar qué archivo usar
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        echo -e "${BLUE}🔄 Reiniciando servicios de producción...${NC}"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" restart
    elif $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" ps | grep -q "Up"; then
        echo -e "${BLUE}🔄 Reiniciando servicios de desarrollo...${NC}"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" restart
    else
        echo -e "${YELLOW}⚠️  No hay servicios ejecutándose${NC}"
    fi
    
    echo -e "${GREEN}✅ Servicios reiniciados${NC}"
}

# Función para mostrar logs
show_logs() {
    echo -e "${BLUE}📋 Mostrando logs de los servicios...${NC}"
    
    # Determinar qué archivo usar
    if $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
    elif $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" ps | grep -q "Up"; then
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" logs -f
    else
        echo -e "${YELLOW}⚠️  No hay servicios ejecutándose${NC}"
    fi
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado de los servicios:${NC}"
    
    # Verificar servicios de producción
    if [ -f "$COMPOSE_FILE" ]; then
        echo -e "${BLUE}🏭 Servicios de Producción:${NC}"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" ps
    fi
    
    echo ""
    
    # Verificar servicios de desarrollo
    if [ -f "$COMPOSE_DEV_FILE" ]; then
        echo -e "${BLUE}🔧 Servicios de Desarrollo:${NC}"
        $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" ps
    fi
    
    echo ""
    echo -e "${BLUE}🐳 Contenedores Docker:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Función para limpiar
clean_all() {
    echo -e "${YELLOW}🧹 Limpiando contenedores, volúmenes y redes...${NC}"
    
    # Detener y eliminar contenedores
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
    $DOCKER_COMPOSE_CMD -f "$COMPOSE_DEV_FILE" down -v --remove-orphans 2>/dev/null || true
    
    # Eliminar contenedores huérfanos
    docker container prune -f
    
    # Eliminar volúmenes no utilizados
    docker volume prune -f
    
    # Eliminar redes no utilizadas
    docker network prune -f
    
    # Eliminar imágenes no utilizadas
    docker image prune -f
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para backup manual
manual_backup() {
    echo -e "${BLUE}💾 Creando backup manual...${NC}"
    
    # Ejecutar contenedor de backup
    docker run --rm \
        -v emas_data:/data:ro \
        -v emas_backups:/backups \
        -v "$(pwd)/backup:/scripts:ro" \
        alpine:latest \
        sh -c "
            apk add --no-cache sqlite3 gzip &&
            chmod +x /scripts/backup.sh &&
            /scripts/backup.sh
        "
    
    echo -e "${GREEN}✅ Backup manual completado${NC}"
}

# Función para actualizar en producción
update_production() {
    echo -e "${BLUE}🔄 Iniciando actualización de EMAS en producción...${NC}"
    
    # Crear backup antes de actualizar
    echo -e "${YELLOW}💾 Creando backup de seguridad...${NC}"
    manual_backup
    
    # Hacer pull de los últimos cambios
    echo -e "${YELLOW}📥 Descargando últimos cambios...${NC}"
    cd "$(dirname "$(pwd)")"
    git fetch origin
    git pull origin main
    cd DevOps
    
    # Verificar si hay cambios en archivos Docker
    if git diff HEAD~1 HEAD --name-only | grep -E "(Dockerfile|docker-compose)" > /dev/null 2>&1; then
        echo -e "${YELLOW}🏗️  Detectados cambios en Docker, reconstruyendo imágenes...${NC}"
        
        # Detener servicios
        echo -e "${YELLOW}🛑 Deteniendo servicios...${NC}"
        stop_services
        
        # Reconstruir imágenes
        echo -e "${YELLOW}🏗️  Reconstruyendo imágenes...${NC}"
        $DOCKER_COMPOSE_CMD -f docker-compose.fullstack.yml build --no-cache
        
        # Iniciar servicios
        echo -e "${YELLOW}🚀 Iniciando servicios...${NC}"
        deploy_production
    else
        echo -e "${YELLOW}ℹ️  No hay cambios en Docker files, reiniciando servicios...${NC}"
        restart_services
    fi
    
    # Verificar estado
    echo -e "${YELLOW}🔍 Verificando estado de los servicios...${NC}"
    sleep 10
    show_status
    
    echo -e "${GREEN}✅ Actualización completada!${NC}"
    echo -e "${BLUE}🌐 Frontend: http://localhost${NC}"
    echo -e "${BLUE}📡 Backend: http://localhost:3001${NC}"
    echo -e "${BLUE}📊 Prometheus: http://localhost:9090${NC}"
}

# Función principal
main() {
    case "${1:-help}" in
        "production")
            check_requirements
            deploy_production
            ;;
        "development")
            check_requirements
            deploy_development
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "clean")
            clean_all
            ;;
        "backup")
            manual_backup
            ;;
        "update")
            update_production
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
