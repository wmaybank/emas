#!/bin/sh

# Script para iniciar nginx y el backend de Node.js

# Función para manejo de señales
cleanup() {
    echo "Deteniendo servicios..."
    kill $NODE_PID 2>/dev/null
    nginx -s quit 2>/dev/null
    exit 0
}

# Configurar manejo de señales
trap cleanup TERM INT

# Iniciar nginx en background
echo "Iniciando nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Esperar un momento para que nginx se inicie
sleep 2

# Cambiar al usuario nodejs para el backend
echo "Iniciando backend Node.js..."
su nodejs -c "cd /app && npm start" &
NODE_PID=$!

# Función para verificar si los procesos están corriendo
check_processes() {
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "Nginx ha terminado inesperadamente"
        exit 1
    fi
    if ! kill -0 $NODE_PID 2>/dev/null; then
        echo "Node.js ha terminado inesperadamente"
        exit 1
    fi
}

# Monitorear procesos
echo "Servicios iniciados. Monitoreando..."
while true; do
    check_processes
    sleep 10
done
