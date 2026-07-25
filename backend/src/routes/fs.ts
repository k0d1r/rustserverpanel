import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import { getServerConfig } from '../db/database';

const router = Router();
router.use(authenticateToken);

// Helper to securely resolve and validate paths
const resolveSafePath = (userPath: string) => {
  const config = getServerConfig();
  if (!config || !config.rust_server_dir) {
    throw new Error('Rust server directory is not configured in settings.');
  }

  const baseDir = path.resolve(config.rust_server_dir);
  
  // Clean the user path (remove leading slashes to prevent absolute path override)
  const cleanUserPath = userPath.replace(/^\/+/, '');
  const targetPath = path.resolve(baseDir, cleanUserPath);

  // Prevent Path Traversal
  if (!targetPath.startsWith(baseDir)) {
    throw new Error('Access denied: Invalid path traversal detected.');
  }

  return { baseDir, targetPath };
};

router.get('/list', async (req, res) => {
  try {
    const queryPath = (req.query.path as string) || '';
    const { targetPath } = resolveSafePath(queryPath);

    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    
    const files = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(targetPath, entry.name);
      let size = 0;
      let mtime = new Date();
      
      try {
        const stats = await fs.stat(entryPath);
        size = stats.size;
        mtime = stats.mtime;
      } catch (e) {
        // Ignore stat errors for inaccessible files
      }

      return {
        name: entry.name,
        isDirectory: entry.isDirectory(),
        size,
        mtime
      };
    }));

    // Sort: Directories first, then alphabetical
    files.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });

    res.json(files);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/read', async (req, res) => {
  try {
    const queryPath = (req.query.path as string) || '';
    if (!queryPath) throw new Error('Path is required');

    const { targetPath } = resolveSafePath(queryPath);
    const content = await fs.readFile(targetPath, 'utf-8');
    
    res.json({ content });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) throw new Error('Path and content are required');

    const { targetPath } = resolveSafePath(filePath);
    await fs.writeFile(targetPath, content, 'utf-8');
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { path: target } = req.body;
    if (!target) throw new Error('Path is required');

    const { targetPath } = resolveSafePath(target);
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/mkdir', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) throw new Error('Path is required');

    const { targetPath } = resolveSafePath(dirPath);
    await fs.mkdir(targetPath, { recursive: true });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
