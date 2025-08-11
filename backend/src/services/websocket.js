const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Set();
        this.isRunning = false;
    }

    start(server) {
        try {
            if (this.isRunning) {
                logger.warn('WebSocket service ya está ejecutándose');
                return;
            }

            this.wss = new WebSocket.Server({
                server,
                path: '/ws/realtime'
            });

            this.wss.on('connection', (ws) => {
                this.clients.add(ws);
                logger.info(`Cliente WebSocket conectado. Total: ${this.clients.size}`);

                ws.send(JSON.stringify({
                    type: 'connection',
                    message: 'Conectado al sistema EMAS',
                    timestamp: new Date().toISOString()
                }));

                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        this.handleMessage(ws, data);
                    } catch (error) {
                        logger.error('Error procesando mensaje WebSocket:', error);
                    }
                });

                ws.on('close', () => {
                    this.clients.delete(ws);
                    logger.info(`Cliente WebSocket desconectado. Total: ${this.clients.size}`);
                });

                ws.on('error', (error) => {
                    logger.error('Error en conexión WebSocket:', error);
                    this.clients.delete(ws);
                });
            });

            this.isRunning = true;
            logger.info('✅ Servicio WebSocket iniciado en /ws/realtime');
        } catch (error) {
            logger.error('❌ Error al iniciar WebSocket service:', error);
            throw error;
        }
    }

    handleMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;
            case 'subscribe':
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channel: data.channel,
                    timestamp: new Date().toISOString()
                }));
                break;
            default:
                logger.warn('Tipo de mensaje WebSocket desconocido:', data.type);
        }
    }

    broadcast(payload) {
        if (!this.isRunning || this.clients.size === 0) return;
        const message = JSON.stringify({ ...payload, timestamp: new Date().toISOString() });

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try { client.send(message); }
                catch (err) {
                    logger.error('Error enviando mensaje a cliente:', err);
                    this.clients.delete(client);
                }
            } else {
                this.clients.delete(client);
            }
        });
    }

    broadcastWeatherData(weatherData) {
        this.broadcast({ type: 'weather_update', data: weatherData });
    }

    broadcastAlert(alert) {
        this.broadcast({ type: 'alert', data: alert, priority: 'high' });
    }

    stop() {
        try {
            if (this.wss) {
                this.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) client.close(1000, 'Servidor cerrando');
                });
                this.clients.clear();
                this.wss.close();
                this.isRunning = false;
                logger.info('🛑 Servicio WebSocket detenido');
            }
        } catch (error) {
            logger.error('Error deteniendo WebSocket service:', error);
        }
    }

    get status() {
        return {
            running: this.isRunning,
            clients: this.clients.size,
            server: !!this.wss
        };
    }
}

// Exportación tolerante a distintos estilos de import
const service = new WebSocketService();

// Soporta: const wsService = require(...); wsService.start()
service.start = service.start.bind(service);
service.broadcast = service.broadcast.bind(service);
service.broadcastWeatherData = service.broadcastWeatherData.bind(service);
service.broadcastAlert = service.broadcastAlert.bind(service);
service.stop = service.stop.bind(service);

// Soporta: const { start } = require(...); start()
module.exports = {
    service,
    start: (...args) => service.start(...args),
    broadcast: (...args) => service.broadcast(...args),
    broadcastWeatherData: (...args) => service.broadcastWeatherData(...args),
    broadcastAlert: (...args) => service.broadcastAlert(...args),
    stop: (...args) => service.stop(...args),
    get status() { return service.status; }
};