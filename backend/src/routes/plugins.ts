import { Router } from 'express';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { rconClient } from '../rcon/RconClient';
import { parseOxidePlugins } from '../rcon/RconParser';
import { getServerConfig } from '../db/database';

const router = Router();

router.use(authenticateToken);

// Abstraction Map for Modding Frameworks (Oxide vs Carbon)
// In MVP we default to Oxide, but this makes v3 Carbon support a 1-line config change.
const MOD_FRAMEWORK: 'oxide' | 'carbon' = 'oxide';

const cmdMap = {
  oxide: {
    plugins: 'oxide.plugins',
    reload: (name: string) => `oxide.reload ${name}`,
    unload: (name: string) => `oxide.unload ${name}`,
    load: (name: string) => `oxide.load ${name}`
  },
  carbon: {
    plugins: 'c.plugins',
    reload: (name: string) => `c.reload ${name}`,
    unload: (name: string) => `c.unload ${name}`,
    load: (name: string) => `c.load ${name}`
  }
};

const cmds = cmdMap[MOD_FRAMEWORK];

router.get('/installed', async (req, res) => {
  try {
    const config = getServerConfig();
    const pluginsDir = path.join(config?.rust_server_dir || '', 'oxide', 'plugins');
    
    let filePlugins: string[] = [];
    try {
      const files = await fs.readdir(pluginsDir);
      filePlugins = files.filter(f => f.endsWith('.cs')).map(f => f.replace('.cs', ''));
    } catch (err) {
      // Directory might not exist yet, ignore
    }

    let rconPlugins: any[] = [];
    if (rconClient && rconClient.isConnected) {
      try {
        const raw = await rconClient.sendCommand(cmds.plugins);
        rconPlugins = parseOxidePlugins(raw);
      } catch (err) {
        // Ignore RCON failure
      }
    }

    // Merge file system plugins with RCON plugins
    const merged = filePlugins.map(name => {
      const rconPlugin = rconPlugins.find(p => p.name === name);
      if (rconPlugin) return rconPlugin;
      return {
        name,
        title: name,
        author: 'Unknown',
        version: 'Unknown',
        description: 'Installed in filesystem',
        isLoaded: false
      };
    });

    res.json(merged);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reload', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const response = await rconClient.sendCommand(cmds.reload(name));
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/unload', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const response = await rconClient.sendCommand(cmds.unload(name));
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/load', async (req, res) => {
  if (!rconClient || !rconClient.isConnected) {
    return res.status(503).json({ error: 'RCON disconnected' });
  }

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const response = await rconClient.sendCommand(cmds.load(name));
    res.json({ response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/store', async (req, res) => {
  const { category, search, page = '1' } = req.query;

  try {
    let url = `https://umod.org/plugins/search.json?page=${page}`;
    let queryParts = [];
    if (search) queryParts.push(search as string);
    if (category && category !== 'All') queryParts.push(category as string);
    
    if (queryParts.length > 0) {
      url += `&query=${encodeURIComponent(queryParts.join(' '))}`;
    }

    const response = await fetch(url);
    const data = (await response.json()) as any;
    
    if (!data || !data.data) {
      throw new Error('Invalid response from uMod');
    }

    // Still ensure it's a Rust or Universal plugin
    let plugins = data.data.filter((p: any) => 
      p.category_tags === 'rust' || 
      p.category_tags === 'universal' ||
      (p.games_detail && p.games_detail.some((g: any) => g.slug === 'rust'))
    );

    res.json({
      total: data.total,
      page: data.current_page,
      limit: data.per_page || 10,
      plugins: plugins
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch plugins from uMod: ' + err.message });
  }
});

router.post('/install', async (req, res) => {
  const { name, download_url } = req.body;
  if (!name || !download_url) {
    return res.status(400).json({ error: 'name and download_url are required' });
  }

  try {
    const config = getServerConfig();
    const pluginsDir = path.join(config?.rust_server_dir || '', 'oxide', 'plugins');
    
    // Ensure directory exists
    await fs.mkdir(pluginsDir, { recursive: true });

    const response = await fetch(download_url);
    if (!response.ok) throw new Error(`Failed to download from ${download_url}`);
    
    const code = await response.text();
    
    const filePath = path.join(pluginsDir, `${name}.cs`);
    await fs.writeFile(filePath, code, 'utf-8');

    // Attempt to load via RCON if connected
    if (rconClient && rconClient.isConnected) {
      rconClient.sendCommand(cmds.load(name)).catch(() => {});
    }

    res.json({ success: true, message: `${name} installed successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', async (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ error: 'filename and content are required' });
  }

  // Ensure it's a .cs file
  if (!filename.endsWith('.cs')) {
    return res.status(400).json({ error: 'Only .cs files are allowed' });
  }

  try {
    const config = getServerConfig();
    const pluginsDir = path.join(config?.rust_server_dir || '', 'oxide', 'plugins');
    
    // Ensure directory exists
    await fs.mkdir(pluginsDir, { recursive: true });
    
    const filePath = path.join(pluginsDir, filename);
    await fs.writeFile(filePath, content, 'utf-8');

    // Attempt to load via RCON if connected
    const name = filename.replace('.cs', '');
    if (rconClient && rconClient.isConnected) {
      rconClient.sendCommand(cmds.load(name)).catch(() => {});
    }

    res.json({ success: true, message: `${filename} uploaded successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/installed/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const config = getServerConfig();
    const pluginsDir = path.join(config?.rust_server_dir || '', 'oxide', 'plugins');
    const filePath = path.join(pluginsDir, `${name}.cs`);
    
    // Check if file exists to prevent throwing if it doesn't
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (e) {
      // File already gone
    }

    // Try to unload via RCON just in case it was loaded in memory
    if (rconClient && rconClient.isConnected) {
      rconClient.sendCommand(cmds.unload(name)).catch(() => {});
    }

    res.json({ success: true, message: `${name} deleted successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
