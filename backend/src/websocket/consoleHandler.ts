import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';
import { verifyToken } from '../middleware/auth';
import { rconClient } from '../rcon/RconClient';
import { parseServerInfo } from '../rcon/RconParser';

export function setupConsoleWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const parsedUrl = url.parse(request.url || '', true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/ws/console') {
      const token = parsedUrl.query.token as string;
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
        socket.destroy();
        return;
      }

      try {
        verifyToken(token);
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (err) {
        socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    // Send initial status
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { online: rconClient ? rconClient.isConnected : false }
    }));

    // Stats loop
    const statsInterval = setInterval(async () => {
      if (rconClient && rconClient.isConnected) {
        try {
          const raw = await rconClient.sendCommand('serverinfo');
          const info = parseServerInfo(raw);
          if (info) {
            ws.send(JSON.stringify({ type: 'stats', payload: info }));
          }
        } catch (e) {
          // Ignore failures silently
        }
      }
    }, 10000);

    const onBroadcast = (packet: any) => {
      ws.send(JSON.stringify({
        type: 'log',
        payload: {
          message: packet.Message,
          logType: packet.Type || 'Generic',
          timestamp: new Date().toISOString()
        }
      }));
    };

    const onRconConnected = () => {
      ws.send(JSON.stringify({ type: 'connected', payload: { online: true } }));
    };

    const onRconDisconnected = () => {
      ws.send(JSON.stringify({ type: 'connected', payload: { online: false } }));
    };

    if (rconClient) {
      rconClient.on('broadcast', onBroadcast);
      rconClient.on('connected', onRconConnected);
      rconClient.on('disconnected', onRconDisconnected);
    }

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'command' && msg.payload && msg.payload.command) {
          if (rconClient && rconClient.isConnected) {
            const response = await rconClient.sendCommand(msg.payload.command);
            ws.send(JSON.stringify({
              type: 'command_response',
              payload: {
                command: msg.payload.command,
                response
              }
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'RCON disconnected' }
            }));
          }
        }
      } catch (err) {
        // parse error or command error
      }
    });

    ws.on('close', () => {
      clearInterval(statsInterval);
      if (rconClient) {
        rconClient.removeListener('broadcast', onBroadcast);
        rconClient.removeListener('connected', onRconConnected);
        rconClient.removeListener('disconnected', onRconDisconnected);
      }
    });
  });
}
