export interface InstalledPlugin {
  index: number;
  title: string;
  version: string;
  author: string;
  hookTime: string;
  filename: string;
}

export interface ParsedPlayer {
  steamId: string;
  name: string;
  ping: number;
  connectedSeconds: number;
  address: string;
}

export interface ParsedServerInfo {
  Hostname: string;
  MaxPlayers: number;
  Players: number;
  Queued: number;
  Joining: number;
  EntityCount: number;
  GameTime: string;
  Uptime: number;
  Map: string;
  Framerate: number;
  Memory: number;
  Collections: number;
  NetworkIn: number;
  NetworkOut: number;
  Restarting: boolean;
  SaveCreatedTime: string;
  Version: number;
  Protocol: string;
  [key: string]: any;
}

export function parseOxidePlugins(raw: string): InstalledPlugin[] {
  const plugins: InstalledPlugin[] = [];
  const regex = /^\\s*(\\d+)\\s+"([^"]+)"\\s+\\(([^)]+)\\)\\s+by\\s+(.+?)\\s+\\(([^)]+)\\)\\s+-\\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    plugins.push({
      index: parseInt(match[1], 10),
      title: match[2],
      version: match[3],
      author: match[4],
      hookTime: match[5],
      filename: match[6]
    });
  }
  return plugins;
}

export function parsePlayerList(raw: string): ParsedPlayer[] {
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map(p => ({
        steamId: p.SteamID,
        name: p.DisplayName,
        ping: p.Ping,
        connectedSeconds: p.ConnectedSeconds,
        address: p.Address
      }));
    }
  } catch (e) {
    // If not JSON, it could be status command output
    const players: ParsedPlayer[] = [];
    const lines = raw.split('\\n');
    let inPlayerList = false;
    for (const line of lines) {
      if (line.includes('id name ping connected spwned')) {
        inPlayerList = true;
        continue;
      }
      if (inPlayerList && line.trim() !== '') {
        // parse plain text
        // example line: 12345678901234567 "PlayerName" 45 1h23m 12.34.56.78:1234
        const parts = line.trim().match(/^(\\d+)\\s+"([^"]+)"\\s+(\\d+)\\s+(\\S+)\\s+(.+)$/);
        if (parts) {
          players.push({
            steamId: parts[1],
            name: parts[2],
            ping: parseInt(parts[3], 10),
            connectedSeconds: 0, // Hard to parse exactly from string
            address: parts[5]
          });
        }
      }
    }
    return players;
  }
  return [];
}

export function parseServerInfo(raw: string): any | null {
  try {
    const data = JSON.parse(raw);
    
    // Map PascalCase keys from Rust server to camelCase keys for frontend
    return {
      hostname: data.Hostname || 'Unknown Server',
      players: data.Players || 0,
      maxPlayers: data.MaxPlayers || 0,
      queued: data.Queued || 0,
      joining: data.Joining || 0,
      entityCount: data.EntityCount || 0,
      gameTime: data.GameTime || '',
      uptime: data.Uptime || 0,
      map: data.Map || 'Unknown Map',
      fps: data.Framerate || 0,
      memory: data.Memory || 0,
      collections: data.Collections || 0,
      networkIn: data.NetworkIn || 0,
      networkOut: data.NetworkOut || 0,
      restarting: data.Restarting || false,
      saveCreatedTime: data.SaveCreatedTime || ''
    };
  } catch (e) {
    return null;
  }
}

export function parseBanList(raw: string): Array<{steamId: string, reason: string}> {
  const bans: Array<{steamId: string, reason: string}> = [];
  const lines = raw.split('\\n');
  for (const line of lines) {
    // example line: 12345678901234567 "Banned for cheating"
    const match = line.trim().match(/^(\\d+)\\s+"([^"]*)"/);
    if (match) {
      bans.push({
        steamId: match[1],
        reason: match[2]
      });
    }
  }
  return bans;
}
