import { Router } from 'express';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getServerConfig, updateServerConfig, getDb, getUserByUsername } from '../db/database';
import { initRconClient, RconClient } from '../rcon/RconClient';

const router = Router();

router.use(authenticateToken);

router.get('/rcon', (req, res) => {
  const config = getServerConfig();
  if (config) {
    res.json({ host: config.rcon_host, port: config.rcon_port, dir: config.rust_server_dir });
  } else {
    res.status(404).json({ error: 'Config not found' });
  }
});

router.post('/rcon/test', async (req: AuthRequest, res) => {
  const { host, port, password } = req.body;
  if (!host || !port) {
    return res.status(400).json({ error: 'Host and port are required' });
  }

  try {
    const testClient = new RconClient(host, port, password);
    await testClient.connect();
    testClient.disconnect();
    res.json({ success: true, message: 'Connection successful!' });
  } catch (err: any) {
    res.status(400).json({ error: 'Connection failed: ' + err.message });
  }
});

router.put('/rcon', async (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { host, port, password, dir } = req.body;
  if (!host || !port || !password) {
    return res.status(400).json({ error: 'host, port, and password are required' });
  }

  try {
    const config = getServerConfig();
    updateServerConfig(host, port, password, dir !== undefined ? dir : config?.rust_server_dir || '');
    const client = initRconClient(host, port, password);
    
    // Await connection to verify credentials
    try {
      await client.connect();
      res.json({ success: true, message: 'Connection successful!' });
    } catch (connErr: any) {
      // Return 400 Bad Request to indicate connection failure to the frontend
      res.status(400).json({ error: 'Connection failed: ' + connErr.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const getVariablesPath = () => {
  const config = getServerConfig();
  if (!config || !config.rust_server_dir) throw new Error('Server directory not configured');
  return path.join(config.rust_server_dir, 'server_variables.json');
};

router.get('/variables', async (req, res) => {
  try {
    const varPath = getVariablesPath();
    let data = {
      serverName: 'My Rust Server',
      mapType: 'Procedural Map',
      worldSize: 3500,
      seed: 12345,
      description: 'Welcome to my Rust server!',
      website: 'https://rustmaps.com',
      maxPlayers: 100,
      serverImage: '',
      modded: true
    };
    
    try {
      const content = await fs.readFile(varPath, 'utf-8');
      data = { ...data, ...JSON.parse(content) };
    } catch (e) {
      // Return defaults if file doesn't exist
    }
    
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/variables', async (req, res) => {
  try {
    const { serverName, mapType, maxPlayers } = req.body;
    if (!serverName || !mapType || maxPlayers === undefined) {
      return res.status(400).json({ error: 'serverName, mapType, and maxPlayers are required fields' });
    }

    const varPath = getVariablesPath();
    await fs.writeFile(varPath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/panel', (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  const user = getUserByUsername(req.user.username);
  res.json({ admin_username: user.username });
});

router.put('/panel/password', async (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'current_password and new_password are required' });
  }

  try {
    const user = getUserByUsername(req.user.username);
    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    getDb().prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, user.username);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
