import { Router } from 'express';
import cron from 'node-cron';

import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getDb } from '../db/database';
import { rconClient } from '../rcon/RconClient';

const router = Router();
const activeSchedules = new Map<number, cron.ScheduledTask>();

router.use(authenticateToken);

function initCronJobs() {
  const db = getDb();
  const schedules = db.prepare('SELECT * FROM wipe_schedules WHERE active = 1').all() as any[];
  
  for (const schedule of schedules) {
    if (cron.validate(schedule.cron_expression)) {
      const task = cron.schedule(schedule.cron_expression, () => {
        executeWipe(schedule.type, 'system');
      });
      activeSchedules.set(schedule.id, task);
    }
  }
}

// Will be called when routes are imported, assuming DB is already init. Better to export a setup function if DB isn't ready.
// For now, we will do a lazy init or assume it's called after DB init.

import * as cronParserType from 'cron-parser';
const cronParser = require('cron-parser');

router.get('/schedules', (req, res) => {
  try {
    const db = getDb();
    const schedules = db.prepare('SELECT * FROM wipe_schedules').all() as any[];
    const formatted = schedules.map(s => {
      let nextRun = null;
      try {
        if (s.active === 1) {
          const interval = cronParser.parseExpression(s.cron_expression);
          nextRun = interval.next().toDate().toISOString();
        }
      } catch (e) {
        console.error('Failed to parse cron:', e);
      }
      
      return { ...s, nextRun };
    });
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/schedules', (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { type, cron_expression } = req.body;
  if (!type || !['map', 'bp', 'full', 'backup'].includes(type) || !cron_expression) {
    return res.status(400).json({ error: 'Invalid type or cron_expression' });
  }

  if (!cron.validate(cron_expression)) {
    return res.status(400).json({ error: 'Invalid cron expression format' });
  }

  try {
    const db = getDb();
    const result = db.prepare('INSERT INTO wipe_schedules (type, cron_expression) VALUES (?, ?)').run(type, cron_expression);
    const id = result.lastInsertRowid as number;
    
    const task = cron.schedule(cron_expression, () => {
      executeWipe(type, 'system');
    });
    activeSchedules.set(id, task);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/schedules/:id', (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const id = parseInt(req.params.id, 10);
  try {
    const db = getDb();
    db.prepare('DELETE FROM wipe_schedules WHERE id = ?').run(id);
    
    const task = activeSchedules.get(id);
    if (task) {
      task.stop();
      activeSchedules.delete(id);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import { executeBackup } from './backup';

async function executeWipe(type: string, user: string) {
  if (type === 'backup') {
    try {
      await executeBackup();
      const db = getDb();
      db.prepare('INSERT INTO wipe_history (type, executed_by) VALUES (?, ?)').run(type, user);
      return true;
    } catch (err) {
      console.error('Backup execution error:', err);
      return false;
    }
  }

  if (!rconClient || !rconClient.isConnected) {
    console.error(`Wipe failed: RCON disconnected (type: ${type})`);
    return false;
  }

  try {
    if (type === 'map' || type === 'full') {
      const seed = Math.floor(Math.random() * 2147483647);
      await rconClient.sendCommand(`server.seed ${seed}`);
      await rconClient.sendCommand('server.writecfg');
    }
    if (type === 'bp' || type === 'full') {
      await rconClient.sendCommand('wipebp');
    }

    const db = getDb();
    db.prepare('INSERT INTO wipe_history (type, executed_by) VALUES (?, ?)').run(type, user);
    return true;
  } catch (err) {
    console.error('Wipe execution error:', err);
    return false;
  }
}

router.post('/execute', async (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { type } = req.body;
  if (!type || !['map', 'bp', 'full', 'backup'].includes(type)) {
    return res.status(400).json({ error: 'Invalid wipe type' });
  }

  const success = await executeWipe(type, req.user.username);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to execute wipe via RCON' });
  }
});

router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const history = db.prepare('SELECT * FROM wipe_history ORDER BY executed_at DESC').all();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export function setupWipeSchedules() {
  initCronJobs();
}

export default router;
