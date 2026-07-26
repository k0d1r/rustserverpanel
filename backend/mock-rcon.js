const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 28016 });

console.log('Mock Rust RCON Server listening on ws://localhost:28016');

wss.on('connection', (ws) => {
  console.log('Client connected to Mock RCON');

  // Send a broadcast log every 5 seconds
  const logInterval = setInterval(() => {
    ws.send(JSON.stringify({
      Identifier: 0,
      Message: 'This is a live log from the mock Rust server!',
      Type: 'Log'
    }));
  }, 5000);

  ws.on('message', (data) => {
    try {
      const packet = JSON.parse(data);
      console.log('Received:', packet);

      if (packet.Message === 'serverinfo') {
        const serverInfo = {
          Hostname: "Kadir's Awesome Rust Server",
          MaxPlayers: 100,
          Players: 42,
          Queued: 5,
          Joining: 2,
          EntityCount: 150000,
          GameTime: "12:00",
          Uptime: 3600,
          Map: "Procedural Map",
          Framerate: 60,
          Memory: 4096,
          Collections: 100,
          NetworkIn: 1024,
          NetworkOut: 2048,
          Restarting: false,
          SaveCreatedTime: "2026-07-26T00:00:00Z"
        };
        
        ws.send(JSON.stringify({
          Identifier: packet.Identifier,
          Message: JSON.stringify(serverInfo),
          Type: 'Generic'
        }));
      } else {
        ws.send(JSON.stringify({
          Identifier: packet.Identifier,
          Message: `Command '${packet.Message}' executed successfully.`,
          Type: 'Generic'
        }));
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(logInterval);
  });
});
