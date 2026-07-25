import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { ZipArchive } from 'archiver';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getServerConfig } from '../db/database';

const router = Router();
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const files = await fsp.readdir(BACKUPS_DIR);
    const backups = [];
    
    for (const file of files) {
      if (!file.endsWith('.zip')) continue;
      
      const filePath = path.join(BACKUPS_DIR, file);
      const stat = await fsp.stat(filePath);
      
      backups.push({
        filename: file,
        sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
        createdAt: stat.birthtime.toISOString()
      });
    }
    
    // Sort newest first
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(backups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export async function executeBackup(): Promise<string> {
  const config = getServerConfig();
  if (!config || !config.rust_server_dir) {
    throw new Error('Rust server directory is not configured in Settings');
  }

  const rustDir = config.rust_server_dir;
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16); 
  const filename = `backup_${dateStr}.zip`;
  const outputPath = path.join(BACKUPS_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const output = fs.createWriteStream(outputPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`Backup created: ${filename} (${archive.pointer()} total bytes)`);
        resolve(filename);
      });

      archive.on('error', (err: any) => {
        reject(err);
      });

      archive.pipe(output);

      const oxideDir = path.join(rustDir, 'oxide');
      if (fs.existsSync(oxideDir)) {
        archive.directory(oxideDir, 'oxide');
      }

      const serverDir = path.join(rustDir, 'server');
      if (fs.existsSync(serverDir)) {
        const addServerFiles = async (dirPath: string, zipPath: string) => {
          const items = await fsp.readdir(dirPath, { withFileTypes: true });
          for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const zipRelativePath = path.join(zipPath, item.name);
            
            if (item.isDirectory()) {
              await addServerFiles(fullPath, zipRelativePath);
            } else if (item.isFile()) {
              if (fullPath.endsWith('.sav') || fullPath.endsWith('.sav.bak') || fullPath.endsWith('.cfg')) {
                archive.file(fullPath, { name: zipRelativePath });
              }
            }
          }
        };
        
        addServerFiles(serverDir, 'server').then(() => {
          archive.finalize();
        }).catch(reject);
      } else {
        archive.finalize();
      }
    } catch (err) {
      reject(err);
    }
  });
}

router.post('/create', async (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const filename = await executeBackup();
    res.json({ success: true, message: 'Backup created successfully', filename });
  } catch (err: any) {
    console.error('Backup creation error:', err);
    res.status(500).json({ error: 'Failed to create backup: ' + err.message });
  }
});

router.get('/:filename/download', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUPS_DIR, filename);

  // Security check to prevent path traversal
  if (!filePath.startsWith(BACKUPS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup not found' });
  }

  res.download(filePath);
});

router.delete('/:filename', (req: AuthRequest, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { filename } = req.params;
  const filePath = path.join(BACKUPS_DIR, filename);

  if (!filePath.startsWith(BACKUPS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup not found' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
