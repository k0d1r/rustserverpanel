import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(path.join(dbDir, 'database.sqlite'));

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS server_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rcon_host TEXT NOT NULL,
      rcon_port INTEGER NOT NULL,
      rcon_password TEXT NOT NULL,
      rust_server_dir TEXT NOT NULL DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wipe_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wipe_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_by TEXT
    );
  `);

  // Default admin user
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const saltRounds = 10;
    const defaultPassword = 'admin'; // Based on requirements: password=admin123, Wait, prompt says password=admin123.
    const hash = bcrypt.hashSync('admin123', saltRounds);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  }

  // Default server config
  const configCount = db.prepare('SELECT COUNT(*) as count FROM server_config').get() as { count: number };
  if (configCount.count === 0) {
    db.prepare('INSERT INTO server_config (rcon_host, rcon_port, rcon_password, rust_server_dir) VALUES (?, ?, ?, ?)').run('127.0.0.1', 28016, 'rust_rcon_password', path.join(process.cwd(), 'test_server_files'));
  }

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getUserByUsername(username: string) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
}

export function createUser(username: string, passwordHash: string, role: string) {
  return getDb().prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, passwordHash, role);
}

export function getServerConfig() {
  return getDb().prepare('SELECT * FROM server_config ORDER BY id DESC LIMIT 1').get() as any;
}

export function updateServerConfig(host: string, port: number, password: string, rust_server_dir: string) {
  getDb().prepare('UPDATE server_config SET rcon_host = ?, rcon_port = ?, rcon_password = ?, rust_server_dir = ?, updated_at = CURRENT_TIMESTAMP').run(host, port, password, rust_server_dir);
}
