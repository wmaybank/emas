#!/bin/bash

# Script de inicio robusto para EMAS Weather System
# Verifica conectividad y configuración antes de iniciar servicios

set -e

echo "=== EMAS Weather System - Inicio de Producción ==="
echo "Fecha: $(date)"
echo "Host: $(hostname)"

# Función para verificar conectividad
check_backend_connectivity() {
    local host=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo "Verificando conectividad a $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "✓ Conectividad exitosa a $host:$port"
            return 0
        fi
        
        echo "Intento $attempt/$max_attempts - Esperando conexión a $host:$port..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "✗ Error: No se pudo conectar a $host:$port después de $max_attempts intentos"
    return 1
}

# Función para verificar configuración de nginx
test_nginx_config() {
    echo "Verificando configuración de nginx..."
    
    if nginx -t; then
        echo "✓ Configuración de nginx válida"
        return 0
    else
        echo "✗ Error en configuración de nginx"
        return 1
    fi
}

# Función para mostrar información de red Docker
show_docker_network_info() {
    echo "=== Información de Red Docker ==="
    
    if command -v docker >/dev/null 2>&1; then
        echo "Contenedores en la red:"
        docker network ls 2>/dev/null || echo "No se pudo obtener lista de redes"
        
        echo "Contenedores corriendo:"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No se pudo obtener lista de contenedores"
    else
        echo "Docker CLI no disponible"
    fi
    
    echo "Información de red del contenedor:"
    cat /etc/hosts | grep -E "(emas|localhost)" || echo "No se encontraron entradas relevantes en /etc/hosts"
    
    echo "=== Fin de información de red ==="
}

# Función principal
main() {
    echo "Iniciando verificaciones de conectividad..."
    
    # Mostrar información de red
    show_docker_network_info
    
    # Lista de hosts del backend a verificar (en orden de prioridad)
    backend_hosts=("emas-weather-app" "emas-app" "localhost" "127.0.0.1")
    backend_port="3001"
    connected=false
    
    for host in "${backend_hosts[@]}"; do
        if check_backend_connectivity "$host" "$backend_port"; then
            echo "✓ Backend accesible en $host:$backend_port"
            connected=true
            break
        fi
    done
    
    if [ "$connected" = false ]; then
        echo "✗ Error crítico: No se pudo conectar a ningún backend"
        echo "Hosts verificados: ${backend_hosts[*]}"
        echo "Puerto: $backend_port"
        
        echo "Intentando diagnóstico adicional..."
        for host in "${backend_hosts[@]}"; do
            echo "Probando ping a $host..."
            ping -c 1 "$host" 2>/dev/null && echo "✓ Ping exitoso" || echo "✗ Ping falló"
            
            echo "Probando telnet a $host:$backend_port..."
            timeout 5s telnet "$host" "$backend_port" 2>/dev/null && echo "✓ Telnet exitoso" || echo "✗ Telnet falló"
        done
        
        echo "Verificando puertos locales en uso:"
        netstat -tln 2>/dev/null | grep ":$backend_port " || echo "Puerto $backend_port no está en uso localmente"
        
        exit 1
    fi
    
    # Verificar configuración de nginx
    if ! test_nginx_config; then
        echo "✗ Error crítico: Configuración de nginx inválida"
        exit 1
    fi
    
    echo "✓ Todas las verificaciones completadas exitosamente"
    echo "Iniciando nginx..."
    
    # Iniciar nginx en modo foreground
    exec nginx -g 'daemon off;'
}

# Manejo de señales para shutdown graceful
trap 'echo "Recibida señal de terminación. Deteniendo nginx..."; nginx -s quit; exit 0' SIGTERM SIGINT

# Ejecutar función principal
main "$@"
