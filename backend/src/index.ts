import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { initDatabase } from './db/database';
import { initRconClient, rconClient } from './rcon/RconClient';
import { setupConsoleWebSocket } from './websocket/consoleHandler';
import authRoutes from './routes/auth';
import serverRoutes from './routes/server';
import playerRoutes from './routes/players';
import pluginRoutes from './routes/plugins';
import settingsRoutes from './routes/settings';
import wipeRoutes, { setupWipeSchedules } from './routes/wipe';
import fsRoutes from './routes/fs';
import backupRoutes from './routes/backup';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());

// Initialize DB
const db = initDatabase();

// Initialize Wipe Schedules (requires DB to be initialized)
setupWipeSchedules();

// Initialize RCON from saved config
const config = db.prepare('SELECT * FROM server_config LIMIT 1').get() as any;
if (config && config.rcon_password) {
  const client = initRconClient(config.rcon_host, config.rcon_port, config.rcon_password);
  client.on('error', (err) => console.log(`RCON Client Event Error: ${err.message}`));
  client.connect().catch(() => console.log('RCON: Could not connect on startup, will retry...'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/wipe', wipeRoutes);
app.use('/api/fs', fsRoutes);
app.use('/api/backups', backupRoutes);

// WebSocket
setupConsoleWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`RustServerPanel backend running on :${PORT}`));
