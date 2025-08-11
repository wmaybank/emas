# Script de despliegue PowerShell para EMAS
# Uso: .\deploy.ps1 [production|development|stop|restart|logs|status]

param(
    [Parameter(Position=0)]
    [ValidateSet("production", "development", "stop", "restart", "logs", "status", "clean", "help")]
    [string]$Command = "help"
)

# Colores para output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Blue"

# Configuración
$COMPOSE_FILE = "docker-compose.yml"
$COMPOSE_DEV_FILE = "docker-compose.dev.yml"
$COMPOSE_FULLSTACK_FILE = "docker-compose.fullstack.yml"
$ENV_FILE = "env.docker"

# Detectar comando de Docker Compose
function Get-DockerComposeCommand {
    try {
        docker compose version | Out-Null
        return "docker compose"
    }
    catch {
        try {
            docker-compose --version | Out-Null
            return "docker-compose"
        }
        catch {
            Write-Host "❌ Docker Compose no está instalado" -ForegroundColor $RED
            exit 1
        }
    }
}

$DOCKER_COMPOSE_CMD = Get-DockerComposeCommand

function Show-Help {
    Write-Host "EMAS Weather Monitoring System - Script de Despliegue PowerShell" -ForegroundColor $BLUE
    Write-Host ""
    Write-Host "Uso: .\deploy.ps1 [COMANDO]"
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor $BLUE
    Write-Host "  production   - Desplegar en modo producción (fullstack: frontend + backend)"
    Write-Host "  development  - Desplegar en modo desarrollo (solo backend)"
    Write-Host "  stop         - Detener todos los servicios"
    Write-Host "  restart      - Reiniciar todos los servicios"
    Write-Host "  logs         - Mostrar logs de todos los servicios"
    Write-Host "  status       - Mostrar estado de los servicios"
    Write-Host "  clean        - Limpiar contenedores, volúmenes y redes"
    Write-Host "  help         - Mostrar esta ayuda"
    Write-Host ""
    Write-Host "Ejemplos:" -ForegroundColor $YELLOW
    Write-Host "  .\deploy.ps1 production    # Desplegar fullstack en producción"
    Write-Host "  .\deploy.ps1 development   # Desplegar solo backend en desarrollo"
    Write-Host "  .\deploy.ps1 logs          # Ver logs"
    Write-Host "  .\deploy.ps1 status        # Ver estado"
}

function Test-Requirements {
    Write-Host "🔍 Verificando requisitos..." -ForegroundColor $BLUE
    
    # Verificar Docker
    try {
        docker --version | Out-Null
    }
    catch {
        Write-Host "❌ Docker no está instalado" -ForegroundColor $RED
        exit 1
    }
    
    # Verificar Docker Compose
    try {
        if ($DOCKER_COMPOSE_CMD -eq "docker compose") {
            docker compose version | Out-Null
        } else {
            docker-compose --version | Out-Null
        }
    }
    catch {
        Write-Host "❌ Docker Compose no está instalado" -ForegroundColor $RED
        exit 1
    }
    
    # Verificar que Docker esté ejecutándose
    try {
        docker info | Out-Null
    }
    catch {
        Write-Host "❌ Docker no está ejecutándose" -ForegroundColor $RED
        exit 1
    }
    
    Write-Host "✅ Requisitos verificados" -ForegroundColor $GREEN
}

function Deploy-Production {
    Write-Host "🚀 Desplegando EMAS en modo PRODUCCIÓN (Fullstack)..." -ForegroundColor $BLUE
    
    if (Test-Path $ENV_FILE) {
        Write-Host "📋 Cargando variables de entorno desde $ENV_FILE" -ForegroundColor $YELLOW
    } else {
        Write-Host "⚠️  Archivo $ENV_FILE no encontrado, usando valores por defecto" -ForegroundColor $YELLOW
    }
    
    Write-Host "🔨 Construyendo imagen fullstack (Frontend + Backend)..." -ForegroundColor $BLUE
    & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE build emas-fullstack
    
    Write-Host "📦 Levantando servicios fullstack..." -ForegroundColor $BLUE
    & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE up -d
    
    Write-Host "✅ Despliegue fullstack completado" -ForegroundColor $GREEN
    Write-Host "🌐 Servicios disponibles:" -ForegroundColor $BLUE
    Write-Host "  - Frontend: http://localhost/"
    Write-Host "  - Backend API: http://localhost/api/"
    Write-Host "  - Grafana: http://localhost:3000 (admin/admin)"
    Write-Host "  - Prometheus: http://localhost:9090"
    Write-Host "  - Redis: localhost:6379"
}

function Deploy-Development {
    Write-Host "🔧 Desplegando EMAS en modo DESARROLLO..." -ForegroundColor $BLUE
    
    Write-Host "🔨 Construyendo imagen de la aplicación..." -ForegroundColor $BLUE
    & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE build emas-app
    
    Write-Host "📦 Levantando servicios de desarrollo..." -ForegroundColor $BLUE
    & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE up -d
    
    Write-Host "✅ Despliegue en desarrollo completado" -ForegroundColor $GREEN
    Write-Host "🌐 Servicios disponibles:" -ForegroundColor $BLUE
    Write-Host "  - Backend API: http://localhost:3001/api/"
    Write-Host ""
    Write-Host "⚠️  MODO DESARROLLO:" -ForegroundColor $YELLOW
    Write-Host "   Para el frontend, ejecuta en otra terminal:"
    Write-Host "   cd frontend && npm start"
    Write-Host "   El frontend estará disponible en http://localhost:3000/"
}

function Stop-Services {
    Write-Host "🛑 Deteniendo servicios..." -ForegroundColor $YELLOW
    
    if (Test-Path $COMPOSE_FULLSTACK_FILE) {
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE down
    }
    
    if (Test-Path $COMPOSE_FILE) {
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE down
    }
    
    if (Test-Path $COMPOSE_DEV_FILE) {
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE down
    }
    
    Write-Host "✅ Servicios detenidos" -ForegroundColor $GREEN
}

function Restart-Services {
    Write-Host "🔄 Reiniciando servicios..." -ForegroundColor $YELLOW
    
    $running = $false
    
    if (Test-Path $COMPOSE_FULLSTACK_FILE) {
        $status = & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE ps 2>$null
        if ($status -match "Up") {
            Write-Host "🔄 Reiniciando servicios fullstack..." -ForegroundColor $BLUE
            & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE restart
            $running = $true
        }
    }
    
    if (-not $running -and (Test-Path $COMPOSE_FILE)) {
        $status = & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE ps 2>$null
        if ($status -match "Up") {
            Write-Host "🔄 Reiniciando servicios de producción..." -ForegroundColor $BLUE
            & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE restart
            $running = $true
        }
    }
    
    if (-not $running -and (Test-Path $COMPOSE_DEV_FILE)) {
        $status = & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE ps 2>$null
        if ($status -match "Up") {
            Write-Host "🔄 Reiniciando servicios de desarrollo..." -ForegroundColor $BLUE
            & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE restart
            $running = $true
        }
    }
    
    if (-not $running) {
        Write-Host "⚠️  No hay servicios ejecutándose" -ForegroundColor $YELLOW
    } else {
        Write-Host "✅ Servicios reiniciados" -ForegroundColor $GREEN
    }
}

function Show-Logs {
    Write-Host "📋 Mostrando logs de los servicios..." -ForegroundColor $BLUE
    
    $running = $false
    
    if (Test-Path $COMPOSE_FULLSTACK_FILE) {
        $status = & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE ps 2>$null
        if ($status -match "Up") {
            & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE logs -f
            $running = $true
        }
    }
    
    if (-not $running -and (Test-Path $COMPOSE_FILE)) {
        $status = & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE ps 2>$null
        if ($status -match "Up") {
            & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE logs -f
            $running = $true
        }
    }
    
    if (-not $running -and (Test-Path $COMPOSE_DEV_FILE)) {
        $status = & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE ps 2>$null
        if ($status -match "Up") {
            & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE logs -f
            $running = $true
        }
    }
    
    if (-not $running) {
        Write-Host "⚠️  No hay servicios ejecutándose" -ForegroundColor $YELLOW
    }
}

function Show-Status {
    Write-Host "📊 Estado de los servicios:" -ForegroundColor $BLUE
    
    if (Test-Path $COMPOSE_FULLSTACK_FILE) {
        Write-Host ""
        Write-Host "🏭 Servicios Fullstack:" -ForegroundColor $BLUE
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE ps
    }
    
    if (Test-Path $COMPOSE_FILE) {
        Write-Host ""
        Write-Host "🏭 Servicios de Producción:" -ForegroundColor $BLUE
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE ps
    }
    
    if (Test-Path $COMPOSE_DEV_FILE) {
        Write-Host ""
        Write-Host "🔧 Servicios de Desarrollo:" -ForegroundColor $BLUE
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE ps
    }
    
    Write-Host ""
    Write-Host "🐳 Contenedores Docker:" -ForegroundColor $BLUE
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

function Clear-All {
    Write-Host "🧹 Limpiando contenedores, volúmenes y redes..." -ForegroundColor $YELLOW
    
    if (Test-Path $COMPOSE_FULLSTACK_FILE) {
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FULLSTACK_FILE down -v --remove-orphans 2>$null
    }
    
    if (Test-Path $COMPOSE_FILE) {
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_FILE down -v --remove-orphans 2>$null
    }
    
    if (Test-Path $COMPOSE_DEV_FILE) {
        & $DOCKER_COMPOSE_CMD.Split() -f $COMPOSE_DEV_FILE down -v --remove-orphans 2>$null
    }
    
    docker container prune -f 2>$null
    docker volume prune -f 2>$null
    docker network prune -f 2>$null
    docker image prune -f 2>$null
    
    Write-Host "✅ Limpieza completada" -ForegroundColor $GREEN
}

# Función principal
switch ($Command) {
    "production" {
        Test-Requirements
        Deploy-Production
    }
    "development" {
        Test-Requirements
        Deploy-Development
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "clean" {
        Clear-All
    }
    default {
        Show-Help
    }
}
