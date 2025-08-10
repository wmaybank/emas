const WebSocket = require('ws');

class WebSocketService {
  constructor(server, logger) {
    this.server = server;
    this.logger = logger;
    this.wss = null;
    this.clients = new Set();
    this.broadcastInterval = null;
    this.lastData = new Map();
    this.heartbeatInterval = null;
  }

  initialize() {
    // Crear servidor WebSocket
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws/realtime'
    });

    this.logger.info('Servidor WebSocket inicializado en /ws/realtime');

    // Configurar eventos del servidor WebSocket
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Configurar heartbeat para mantener conexiones activas
    this.setupHeartbeat();

    // Configurar broadcast de datos en tiempo real
    this.setupBroadcast();
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws: ws,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      connectedAt: new Date(),
      lastHeartbeat: Date.now(),
      subscriptions: new Set() // Para filtrar datos por estación
    };

    this.clients.add(clientInfo);
    this.logger.info(`Cliente WebSocket conectado: ${clientId} desde ${clientInfo.ip}`);

    // Enviar mensaje de bienvenida
    ws.send(JSON.stringify({
      type: 'connection',
      clientId: clientId,
      message: 'Conectado al sistema de monitoreo meteorológico EMA Chapelco',
      timestamp: new Date().toISOString(),
      availableStations: [
        'chapelco_base',
        'chapelco_1700', 
        'chapelco_cerro_teta'
      ]
    }));

    // Configurar eventos del cliente
    ws.on('message', (message) => {
      this.handleMessage(clientInfo, message);
    });

    ws.on('close', () => {
      this.handleDisconnection(clientInfo);
    });

    ws.on('error', (error) => {
      this.logger.error(`Error en WebSocket del cliente ${clientId}:`, error);
      this.handleDisconnection(clientInfo);
    });

    // Configurar ping/pong para detectar conexiones muertas
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      clientInfo.lastHeartbeat = Date.now();
    });
  }

  handleMessage(clientInfo, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscription(clientInfo, data);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscription(clientInfo, data);
          break;
          
        case 'ping':
          this.sendPong(clientInfo);
          break;
          
        case 'request_data':
          this.handleDataRequest(clientInfo, data);
          break;
          
        default:
          this.logger.warn(`Tipo de mensaje desconocido: ${data.type}`);
      }
    } catch (error) {
      this.logger.error(`Error al procesar mensaje del cliente ${clientInfo.id}:`, error);
      this.sendError(clientInfo, 'Mensaje inválido');
    }
  }

  handleSubscription(clientInfo, data) {
    if (data.stations && Array.isArray(data.stations)) {
      data.stations.forEach(stationId => {
        if (['chapelco_base', 'chapelco_1700', 'chapelco_cerro_teta'].includes(stationId)) {
          clientInfo.subscriptions.add(stationId);
        }
      });
      
      this.logger.info(`Cliente ${clientInfo.id} suscrito a: ${Array.from(clientInfo.subscriptions).join(', ')}`);
      
      // Enviar confirmación
      this.sendToClient(clientInfo, {
        type: 'subscription_confirmed',
        stations: Array.from(clientInfo.subscriptions),
        message: 'Suscripción confirmada'
      });
    }
  }

  handleUnsubscription(clientInfo, data) {
    if (data.stations && Array.isArray(data.stations)) {
      data.stations.forEach(stationId => {
        clientInfo.subscriptions.delete(stationId);
      });
      
      this.logger.info(`Cliente ${clientInfo.id} desuscrito de: ${data.stations.join(', ')}`);
      
      this.sendToClient(clientInfo, {
        type: 'unsubscription_confirmed',
        stations: data.stations,
        message: 'Desuscripción confirmada'
      });
    }
  }

  handleDataRequest(clientInfo, data) {
    // Enviar datos históricos si están disponibles
    if (data.stationId && data.limit) {
      // Aquí se podrían obtener datos de la base de datos
      this.sendToClient(clientInfo, {
        type: 'historical_data',
        stationId: data.stationId,
        data: [], // Datos históricos
        message: 'Datos históricos solicitados'
      });
    }
  }

  handleDisconnection(clientInfo) {
    this.clients.delete(clientInfo);
    this.logger.info(`Cliente WebSocket desconectado: ${clientInfo.id}`);
  }

  setupHeartbeat() {
    // Enviar heartbeat cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          this.logger.warn('Cliente WebSocket inactivo, cerrando conexión');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  setupBroadcast() {
    // Broadcast de datos cada 2.5 segundos (como especificado)
    this.broadcastInterval = setInterval(() => {
      this.broadcastWeatherData();
    }, 2500);
  }

  broadcastWeatherData() {
    if (this.clients.size === 0) return;

    const currentTime = new Date().toISOString();
    
    this.clients.forEach(clientInfo => {
      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        // Enviar solo datos de las estaciones suscritas
        const dataToSend = {
          type: 'weather_update',
          timestamp: currentTime,
          stations: {}
        };

        clientInfo.subscriptions.forEach(stationId => {
          const stationData = this.lastData.get(stationId);
          if (stationData) {
            dataToSend.stations[stationId] = stationData;
          }
        });

        if (Object.keys(dataToSend.stations).length > 0) {
          this.sendToClient(clientInfo, dataToSend);
        }
      }
    });
  }

  // Método para actualizar datos de una estación
  updateStationData(stationId, data) {
    this.lastData.set(stationId, {
      ...data,
      lastUpdate: new Date().toISOString()
    });

    // Broadcast inmediato a clientes suscritos
    this.broadcastToSubscribers(stationId, data);
  }

  broadcastToSubscribers(stationId, data) {
    const message = {
      type: 'weather_update',
      timestamp: new Date().toISOString(),
      stations: {
        [stationId]: {
          ...data,
          lastUpdate: new Date().toISOString()
        }
      }
    };

    this.clients.forEach(clientInfo => {
      if (clientInfo.subscriptions.has(stationId) && 
          clientInfo.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientInfo, message);
      }
    });
  }

  // Método para enviar alertas meteorológicas
  broadcastAlert(alert) {
    const message = {
      type: 'weather_alert',
      timestamp: new Date().toISOString(),
      alert: alert
    };

    this.broadcastToAll(message);
  }

  // Método para enviar mensaje a todos los clientes
  broadcastToAll(message) {
    this.clients.forEach(clientInfo => {
      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientInfo, message);
      }
    });
  }

  // Método para enviar mensaje a un cliente específico
  sendToClient(clientInfo, message) {
    try {
      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        clientInfo.ws.send(JSON.stringify(message));
      }
    } catch (error) {
      this.logger.error(`Error al enviar mensaje al cliente ${clientInfo.id}:`, error);
    }
  }

  // Método para enviar error a un cliente
  sendError(clientInfo, errorMessage) {
    this.sendToClient(clientInfo, {
      type: 'error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  // Método para enviar pong
  sendPong(clientInfo) {
    this.sendToClient(clientInfo, {
      type: 'pong',
      timestamp: new Date().toISOString()
    });
  }

  // Método para obtener estadísticas de conexiones
  getConnectionStats() {
    const stats = {
      totalClients: this.clients.size,
      activeConnections: 0,
      subscriptions: {}
    };

    this.clients.forEach(clientInfo => {
      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        stats.activeConnections++;
        
        clientInfo.subscriptions.forEach(stationId => {
          if (!stats.subscriptions[stationId]) {
            stats.subscriptions[stationId] = 0;
          }
          stats.subscriptions[stationId]++;
        });
      }
    });

    return stats;
  }

  // Método para limpiar recursos
  cleanup() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Cerrar todas las conexiones
    this.wss.clients.forEach((ws) => {
      ws.close();
    });

    this.wss.close();
    this.logger.info('Servicio WebSocket cerrado');
  }

  // Generar ID único para clientes
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Método para obtener información de clientes conectados
  getConnectedClients() {
    const clients = [];
    this.clients.forEach(clientInfo => {
      if (clientInfo.ws.readyState === WebSocket.OPEN) {
        clients.push({
          id: clientInfo.id,
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          connectedAt: clientInfo.connectedAt,
          lastHeartbeat: clientInfo.lastHeartbeat,
          subscriptions: Array.from(clientInfo.subscriptions)
        });
      }
    });
    return clients;
  }
}

module.exports = WebSocketService;
