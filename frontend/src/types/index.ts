export interface ServerInfo {
  hostname: string;
  players: number;
  maxPlayers: number;
  queued: number;
  joining: number;
  fps: number;
  memory: number;
  entityCount: number;
  gameTime: string;
  uptime: number;
  map: string;
  description: string;
  url: string;
  headerImage: string;
  online: boolean;
}

export interface Player {
  steamId: string;
  name: string;
  ping: number;
  connectedSeconds: number;
  address: string;
}

export interface Ban {
  steamId: string;
  reason: string;
}

export interface InstalledPlugin {
  index: number;
  title: string;
  version: string;
  author: string;
  hookTime: string;
  filename: string;
}

export interface UModPlugin {
  name: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  version: string;
  category: string;
  download_url: string;
  icon_url?: string;
}

export interface WipeSchedule {
  id: number;
  type: string;
  cronExpression: string;
  active: boolean;
  nextRun: string;
  createdAt: string;
}

export interface WipeEvent {
  id: number;
  type: string;
  executedAt: string;
  executedBy: string;
}
