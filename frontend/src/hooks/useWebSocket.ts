import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useConsoleStore } from '../store/consoleStore';
import { ServerInfo } from '../types';

// Global state for WebSocket to prevent multiple connections from different components
let globalWs: WebSocket | null = null;
let globalIsConnected = false;
let globalServerInfo: ServerInfo | null = null;
const listeners = new Set<() => void>();
let reconnectAttempts = 0;
export let reconnectTimeout: any = null;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const connectGlobal = (token: string, addLog: (log: any) => void) => {
  if (globalWs) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/console?token=${token}`;
  
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    globalIsConnected = true;
    reconnectAttempts = 0;
    notifyListeners();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        addLog({
          id: Math.random().toString(36).substring(7),
          ...data.payload
        });
      } else if (data.type === 'stats') {
        globalServerInfo = data.payload;
        notifyListeners();
      } else if (data.type === 'connected') {
        if (!data.payload.online) {
          if (globalServerInfo) {
            globalServerInfo = { ...globalServerInfo, online: false };
            notifyListeners();
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  };

  ws.onclose = () => {
    globalIsConnected = false;
    globalWs = null;
    notifyListeners();
    
    const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectAttempts += 1;
    
    reconnectTimeout = window.setTimeout(() => connectGlobal(token, addLog), timeout);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    ws.close();
  };

  globalWs = ws;
};

export const useWebSocket = () => {
  const token = useAuthStore((state) => state.token);
  const addLog = useConsoleStore((state) => state.addLog);
  
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(globalServerInfo);

  useEffect(() => {
    if (token && !globalWs) {
      connectGlobal(token, addLog);
    }

    const listener = () => {
      setIsConnected(globalIsConnected);
      setServerInfo(globalServerInfo);
    };

    listeners.add(listener);
    listener(); // initial sync

    return () => {
      listeners.delete(listener);
    };
  }, [token, addLog]);

  const sendCommand = useCallback((command: string) => {
    if (globalWs && globalIsConnected) {
      globalWs.send(JSON.stringify({ type: 'command', payload: { command } }));
    }
  }, []);

  return { isConnected, sendCommand, serverInfo };
};
