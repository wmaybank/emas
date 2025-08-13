# Dockerfile para EMAS Weather Monitoring System - Full Stack Build
FROM node:18-alpine AS frontend-builder

# Instalar dependencias para frontend
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci --only=production

# Copiar código fuente del frontend
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/tsconfig.json ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Construir frontend
RUN npm run build

# Etapa principal - Backend con frontend construido
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk update && apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    && rm -rf /var/cache/apk/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json principal (incluye dependencias backend)
COPY package*.json ./

# Instalar dependencias
RUN npm install --only=production && npm cache clean --force

# Copiar código fuente del backend
COPY backend/src ./src

# Copiar frontend construido desde la etapa anterior
COPY --from=frontend-builder /app/frontend/build ./public

# Crear directorios necesarios
RUN mkdir -p data logs backups config scripts

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar permisos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicio
CMD ["node", "src/app.js"]
