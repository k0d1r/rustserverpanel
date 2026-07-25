import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface RconPacket {
  Identifier: number;
  Message: string;
  Name?: string;
  Type?: string;
  Stacktrace?: string;
}

export class RconClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private identifierCounter = 1;
  private pendingRequests = new Map<number, {
    resolve: (v: string) => void;
    reject: (e: Error) => void;
    timer: NodeJS.Timeout;
  }>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  public isConnected = false;
  private readonly commandTimeout = 10000;
  private reconnectDelay = 5000;

  constructor(
    private host: string,
    private port: number,
    private password: string
  ) { 
    super(); 
  }

  updateCredentials(host: string, port: number, password: string) {
    this.host = host; 
    this.port = port; 
    this.password = password;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.shouldReconnect = true;
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return resolve();
      }

      // Cleanup old ws listeners if any
      if (this.ws) {
        this.ws.removeAllListeners();
        this.ws.close();
      }

      this.ws = new WebSocket(`ws://${this.host}:${this.port}/${this.password}`);

      this.ws.on('open', () => {
        this.isConnected = true;
        this.reconnectDelay = 5000; // Reset backoff on success
        this.startHeartbeat();
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.RawData) => {
        try {
          const packet: RconPacket = JSON.parse(data.toString());
          this.handlePacket(packet);
        } catch (err) {
          console.error('Failed to parse RCON packet:', err);
        }
      });

      this.ws.on('error', (err) => {
        // Do not emit error upwards for connection refused loops to avoid log spam/unhandled rejections
        if (!this.isConnected) {
          reject(err);
        } else {
          console.error('RCON WebSocket error:', err.message);
          this.emit('error', err);
        }
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.rejectAllPending();
        this.emit('disconnected');
        
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('RCON is not connected'));
      }

      const identifier = this.identifierCounter++;
      
      const payload = {
        Identifier: identifier,
        Message: command,
        Name: 'WebPanel'
      };

      const timer = setTimeout(() => {
        if (this.pendingRequests.has(identifier)) {
          this.pendingRequests.delete(identifier);
          reject(new Error('Command timeout: ' + command));
        }
      }, this.commandTimeout);

      this.pendingRequests.set(identifier, { resolve, reject, timer });

      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        this.pendingRequests.delete(identifier);
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handlePacket(packet: RconPacket) {
    if (packet.Identifier <= 0) {
      this.emit('broadcast', packet);
      return;
    }

    const pending = this.pendingRequests.get(packet.Identifier);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(packet.Identifier);
      pending.resolve(packet.Message);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendCommand('status').catch(() => {
          // Ignore timeout or errors on heartbeat, we just want to keep the connection alive
        });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private rejectAllPending() {
    const error = new Error('RCON connection closed');
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(error);
    }
    this.pendingRequests.clear();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    // Exponential backoff up to 60 seconds
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => {
          // Reconnect logic handles error events, so it will just schedule another retry on close
        });
      }
    }, this.reconnectDelay);
  }
}

// Singleton
export let rconClient: RconClient | null = null;
export function initRconClient(host: string, port: number, password: string): RconClient {
  if (rconClient) rconClient.disconnect();
  rconClient = new RconClient(host, port, password);
  return rconClient;
}
