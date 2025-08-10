#!/bin/sh

# Script de backup automático para EMAS Weather Monitoring System
# Este script se ejecuta dentro del contenedor de backup

set -e

# Configuración
BACKUP_DIR="/backups"
DATA_DIR="/data"
DB_NAME="weather.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="emas_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="emas_backup_${TIMESTAMP}.sql.gz"

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup de la base de datos EMAS..."
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Directorio de datos: $DATA_DIR"
echo "💾 Archivo de backup: $BACKUP_FILE"

# Verificar que la base de datos existe
if [ ! -f "$DATA_DIR/$DB_NAME" ]; then
    echo "❌ Error: No se encontró la base de datos en $DATA_DIR/$DB_NAME"
    exit 1
fi

# Crear backup de la base de datos
echo "📊 Creando backup de la base de datos..."
sqlite3 "$DATA_DIR/$DB_NAME" ".dump" > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado exitosamente: $BACKUP_FILE"
    
    # Comprimir el backup
    echo "🗜️ Comprimiendo backup..."
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup comprimido: $COMPRESSED_FILE"
        
        # Calcular tamaño del archivo
        BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
        echo "📏 Tamaño del backup: $BACKUP_SIZE"
        
        # Limpiar backups antiguos (mantener solo los últimos 30 días)
        echo "🧹 Limpiando backups antiguos..."
        find "$BACKUP_DIR" -name "emas_backup_*.sql.gz" -mtime +30 -delete
        
        # Listar backups disponibles
        echo "📋 Backups disponibles:"
        ls -lh "$BACKUP_DIR"/emas_backup_*.sql.gz 2>/dev/null || echo "No hay backups disponibles"
        
    else
        echo "❌ Error al comprimir el backup"
        exit 1
    fi
    
else
    echo "❌ Error al crear el backup"
    exit 1
fi

echo "🎉 Proceso de backup completado exitosamente"
echo "📁 Ubicación: $BACKUP_DIR/$COMPRESSED_FILE"
