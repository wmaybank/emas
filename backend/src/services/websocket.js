const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Set();
        this.isRunning = false;
    }

    // MÉTODO START CRÍTICO - ESTE ES EL QUE FALTA
    start(server) {
        try {
            if (this.isRunning) {
                logger.warn('WebSocket service ya está ejecutándose');
                return;
            }

            // Crear WebSocket Server
            this.wss = new WebSocket.Server({ 
                server,
                path: '/ws/realtime'
            });

            // Manejar nuevas conexiones
            this.wss.on('connection', (ws, request) => {
                this.clients.add(ws);
                logger.info(`✅ Cliente WebSocket conectado. Total clientes: ${this.clients.size}`);

                // Mensaje de bienvenida
                ws.send(JSON.stringify({
                    type: 'connection',
                    message: 'Conectado al sistema EMAS',
                    timestamp: new Date().toISOString()
                }));

                // Manejar mensajes entrantes
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        this.handleMessage(ws, data);
                    } catch (error) {
                        logger.error('Error procesando mensaje WebSocket:', error);
                    }
                });

                // Manejar desconexión
                ws.on('close', () => {
                    this.clients.delete(ws);
                    logger.info(`Cliente WebSocket desconectado. Total clientes: ${this.clients.size}`);
                });

                // Manejar errores
                ws.on('error', (error) => {
                    logger.error('Error en conexión WebSocket:', error);
                    this.clients.delete(ws);
                });
            });

            this.isRunning = true;
            logger.info('🚀 Servicio WebSocket iniciado correctamente en /ws/realtime');
            
        } catch (error) {
            logger.error('❌ Error crítico al iniciar WebSocket service:', error);
            throw error;
        }
    }

    // Manejar mensajes de clientes
    handleMessage(ws, data) {
        try {
            switch (data.type) {
                case 'ping':
                    ws.send(JSON.stringify({ 
                        type: 'pong', 
                        timestamp: new Date().toISOString() 
                    }));
                    break;
                
                case 'subscribe':
                    ws.send(JSON.stringify({ 
                        type: 'subscribed', 
                        channel: data.channel,
                        timestamp: new Date().toISOString() 
                    }));
                    logger.info(`Cliente suscrito a canal: ${data.channel}`);
                    break;
                
                default:
                    logger.warn('Tipo de mensaje WebSocket desconocido:', data.type);
            }
        } catch (error) {
            logger.error('Error manejando mensaje WebSocket:', error);
        }
    }

    // Broadcast a todos los clientes
    broadcast(data) {
        if (!this.isRunning || this.clients.size === 0) {
            return;
        }

        const message = JSON.stringify({
            ...data,
            timestamp: new Date().toISOString()
        });

        let successCount = 0;
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                    successCount++;
                } catch (error) {
                    logger.error('Error enviando mensaje a cliente:', error);
                    this.clients.delete(client);
                }
            } else {
                this.clients.delete(client);
            }
        });

        logger.debug(`Mensaje broadcast enviado a ${successCount} clientes`);
    }

    // Enviar datos meteorológicos
    broadcastWeatherData(weatherData) {
        this.broadcast({
            type: 'weather_update',
            data: weatherData
        });
        logger.info('Datos meteorológicos enviados via WebSocket');
    }

    // Enviar alertas
    broadcastAlert(alert) {
        this.broadcast({
            type: 'alert',
            data: alert,
            priority: 'high'
        });
        logger.warn('Alerta enviada via WebSocket:', alert.message);
    }

    // Detener servicio
    stop() {
        try {
            if (this.wss) {
                this.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.close(1000, 'Servidor cerrando');
                    }
                });
                this.clients.clear();
                this.wss.close();
                this.isRunning = false;
                logger.info('🛑 Servicio WebSocket detenido correctamente');
            }
        } catch (error) {
            logger.error('Error deteniendo WebSocket service:', error);
        }
    }

    // Estado del servicio
    get status() {
        return {
            running: this.isRunning,
            clients: this.clients.size,
            server: !!this.wss
        };
    }
}

// Exportar instancia singleton
module.exports = new WebSocketService();