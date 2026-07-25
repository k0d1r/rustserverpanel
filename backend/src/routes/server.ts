import { Router } from 'express';
import os from 'os';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { rconClient } from '../rcon/RconClient';
import { parseServerInfo } from '../rcon/RconParser';
import { getServerConfig } from '../db/database';

const router = Router();

router.use(authenticateToken);

router.get('/system', (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = (usedMem / totalMem) * 100;
    
    // CPU load estimate (1 min load average normalized by core count)
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    const cpuPercentage = Math.min((loadAvg / cpus) * 100, 100);

    res.json({
      cpu: cpuPercentage,
      memory: {
        total: totalMem,
        used: usedMem,
        percentage: memPercentage
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/info', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.json({ online: false });
  }

  try {
    const raw = await rconClient.sendCommand('serverinfo');
    const info = parseServerInfo(raw);
    if (info) {
      res.json({ ...info, online: true });
    } else {
      res.status(500).json({ error: 'Failed to parse serverinfo' });
    }
  } catch (err: any) {
    res.status(503).json({ online: false, error: err.message });
  }
});

router.post('/command', async (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  try {
    const response = await rconClient.sendCommand(command);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/restart', async (req: AuthRequest, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const seconds = req.body.seconds || 300;

  try {
    const response = await rconClient.sendCommand(`restart ${seconds}`);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/save', async (req: AuthRequest, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  try {
    const response = await rconClient.sendCommand('server.save');
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/say', async (req: AuthRequest, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await rconClient.sendCommand(`say "${message}"`);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json({ online: rconClient ? rconClient.isConnected : false });
});

export default router;
