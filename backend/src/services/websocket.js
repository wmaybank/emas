const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.started = false;
  }

  start(server) {
    if (this.started) return;
    if (server) {
      this.wss = new WebSocket.Server({ server });
    } else {
      this.wss = new WebSocket.Server({ port: 8080 });
    }
    this.started = true;
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        // Manejar mensajes entrantes si es necesario
      });
    });
    console.log('✅ Servicio WebSocket iniciado');
  }

  attachToServer(server) {
    this.start(server);
  }

  isRunning() {
    return this.started;
  }

  broadcast(data) {
    if (!this.wss) return;
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  broadcastToAll(data) {
    this.broadcast(data);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.started = false;
    console.log('✅ Servicio WebSocket detenido');
  }
}

const instance = new WebSocketService();
module.exports = instance;
module.exports.default = instance;