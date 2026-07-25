import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { rconClient } from '../rcon/RconClient';
import { parsePlayerList, parseBanList } from '../rcon/RconParser';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  try {
    const raw = await rconClient.sendCommand('playerlist');
    const players = parsePlayerList(raw);
    res.json(players);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/kick', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { steamId, reason } = req.body;
  if (!steamId) return res.status(400).json({ error: 'steamId is required' });

  try {
    const response = await rconClient.sendCommand(`kick "${steamId}" "${reason || ''}"`);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ban', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { steamId, reason } = req.body;
  if (!steamId) return res.status(400).json({ error: 'steamId is required' });

  try {
    const response = await rconClient.sendCommand(`ban "${steamId}" "${reason || ''}"`);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/unban', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { steamId } = req.body;
  if (!steamId) return res.status(400).json({ error: 'steamId is required' });

  try {
    const response = await rconClient.sendCommand(`unban "${steamId}"`);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bans', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  try {
    const raw = await rconClient.sendCommand('bans');
    const bans = parseBanList(raw);
    res.json(bans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/message', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { name, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'name and message are required' });

  try {
    // using say with PM format as fallback if no custom pm plugin
    const response = await rconClient.sendCommand(`say "[PM to ${name}] ${message}"`);
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
